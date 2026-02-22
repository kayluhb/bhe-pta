import { sendNotificationEmail } from "~/lib/reimbursement/email/resend";
import {
	buildPdfFilename,
	buildReceiptFilename,
	slugifyName,
} from "~/lib/reimbursement/filename";
import { generatePDF } from "~/lib/reimbursement/pdf/generator";
import { submissionSchema } from "~/lib/reimbursement/validation";
import type { Route } from "./+types/api.reimbursement.submit";

async function verifyTurnstile(
	token: string,
	secretKey: string,
	ip: string | null,
): Promise<boolean> {
	const formData = new URLSearchParams();
	formData.append("secret", secretKey);
	formData.append("response", token);
	if (ip) formData.append("remoteip", ip);

	const res = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: formData.toString(),
		},
	);
	const outcome = (await res.json()) as { success: boolean };
	return outcome.success;
}

export async function action({ request, context }: Route.ActionArgs) {
	try {
		const body = await request.json();

		// Verify Turnstile token
		const turnstileSecret = context.cloudflare.env.TURNSTILE_SECRET_KEY;
		const turnstileToken = (body as Record<string, unknown>).turnstileToken;
		if (
			!turnstileSecret ||
			!turnstileToken ||
			typeof turnstileToken !== "string"
		) {
			return Response.json({ error: "Verification failed" }, { status: 403 });
		}

		const clientIp = request.headers.get("CF-Connecting-IP");
		const verified = await verifyTurnstile(
			turnstileToken,
			turnstileSecret,
			clientIp,
		);
		if (!verified) {
			return Response.json(
				{ error: "Verification failed. Please try again." },
				{ status: 403 },
			);
		}

		// Validate input
		const validationResult = submissionSchema.safeParse(body);
		if (!validationResult.success) {
			return Response.json(
				{
					error: "Validation failed",
					details: validationResult.error.flatten(),
				},
				{ status: 400 },
			);
		}

		const { requester, receipts, files, budget } = validationResult.data;

		// Calculate total
		const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

		// Generate submission ID
		const submissionId = crypto.randomUUID();
		const submittedAt = new Date().toISOString();

		// Get environment variables from Cloudflare context
		const env = context.cloudflare.env;
		const resendApiKey = env.RESEND_API_KEY;
		const notificationEmail = env.NOTIFICATION_EMAIL;

		// Assign budget accounts to receipts
		const receiptsWithBudget = receipts.map((receipt) => ({
			...receipt,
			budgetAccount: receipt.budgetAccount || budget.primaryAccount,
		}));

		// Generate PDF
		const pdfBuffer = await generatePDF({
			submission: {
				id: submissionId,
				submittedAt,
				totalAmount,
			},
			requester,
			receipts: receiptsWithBudget,
			budget,
		});

		// Generate friendly filename slug
		const slug = slugifyName(requester.payableTo, submittedAt.slice(0, 10));
		const pdfFilename = buildPdfFilename(slug);

		// Store generated PDF in R2
		let pdfKey: string | null = null;
		if (env.R2_BUCKET) {
			pdfKey = `submissions/${submissionId}/${pdfFilename}`;
			await env.R2_BUCKET.put(pdfKey, pdfBuffer, {
				httpMetadata: { contentType: "application/pdf" },
			});
		}

		// Rename uploaded files to friendly names
		const renamedFiles = await Promise.all(
			files.map(async (file, i) => {
				const friendlyName = buildReceiptFilename(
					slug,
					i,
					file.filename,
					file.contentType,
				);
				const newKey = `submissions/${submissionId}/${friendlyName}`;

				if (env.R2_BUCKET) {
					const obj = await env.R2_BUCKET.get(file.key);
					if (obj) {
						await env.R2_BUCKET.put(newKey, await obj.arrayBuffer(), {
							httpMetadata: { contentType: file.contentType },
						});
						await env.R2_BUCKET.delete(file.key);
					}
				}

				return { ...file, key: newKey, filename: friendlyName };
			}),
		);

		// Save to D1 database
		const db = env.REIMBURSEMENT_DB;
		await db.batch([
			db
				.prepare(
					`INSERT INTO submissions (id, requester_name, requester_email, requester_phone, status, total_amount, pdf_key, submitted_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
				)
				.bind(
					submissionId,
					requester.payableTo,
					requester.email,
					requester.phone || null,
					totalAmount,
					pdfKey,
					submittedAt,
				),
			...receiptsWithBudget.map((receipt, i) =>
				db
					.prepare(
						`INSERT INTO receipt_entries (id, submission_id, receipt_date, description, amount, category, vendor, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
					)
					.bind(
						crypto.randomUUID(),
						submissionId,
						receipt.date,
						receipt.description,
						receipt.amount,
						receipt.budgetAccount,
						receipt.placeOfPurchase || null,
						i,
					),
			),
			...renamedFiles.map((file, i) =>
				db
					.prepare(
						`INSERT INTO file_attachments (id, submission_id, r2_key, original_filename, content_type, file_size, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
					)
					.bind(
						crypto.randomUUID(),
						submissionId,
						file.key,
						file.filename,
						file.contentType,
						file.size,
						i,
					),
			),
		]);

		console.log("Submission saved:", {
			id: submissionId,
			requester: requester.payableTo,
			totalAmount,
			receiptsCount: receipts.length,
			filesCount: files.length,
		});

		// Send email notification if configured
		if (resendApiKey && notificationEmail) {
			try {
				// Fetch uploaded files from R2 to attach to treasurer email
				const fileAttachments: Array<{
					filename: string;
					content: Uint8Array;
					contentType: string;
				}> = [];
				if (env.R2_BUCKET && renamedFiles.length > 0) {
					const fetched = await Promise.all(
						renamedFiles.map(async (f) => {
							try {
								const obj = await env.R2_BUCKET.get(f.key);
								if (!obj) return null;
								return {
									filename: f.filename,
									content: new Uint8Array(await obj.arrayBuffer()),
									contentType: f.contentType,
								};
							} catch {
								return null;
							}
						}),
					);
					for (const f of fetched) {
						if (f) fileAttachments.push(f);
					}
				}

				await sendNotificationEmail({
					submission: {
						id: submissionId,
						totalAmount,
					},
					requester,
					receipts: receiptsWithBudget,
					pdfBuffer,
					pdfFilename,
					fileAttachments,
					notificationEmail,
					resendApiKey,
				});
				console.log("Email sent successfully");
			} catch (emailError) {
				console.error("Email sending failed:", emailError);
				// Don't fail the whole request if email fails
			}
		} else {
			console.log("Email not configured - skipping notification");
		}

		return Response.json({
			success: true,
			submissionId,
			message: "Submission received successfully.",
		});
	} catch (error) {
		console.error("Submission error:", error);
		return Response.json(
			{ error: "Failed to process submission" },
			{ status: 500 },
		);
	}
}
