import type { Route } from "./+types/api.reimbursement.submit";
import { submissionSchema } from "~/lib/reimbursement/validation";
import { generatePDF } from "~/lib/reimbursement/pdf/generator";
import { sendNotificationEmail } from "~/lib/reimbursement/email/resend";

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = submissionSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
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

    // In production with D1, we would save to database here
    // For MVP, we'll just log and send email
    console.log("New submission:", {
      id: submissionId,
      requester: requester.payableTo,
      totalAmount,
      receiptsCount: receipts.length,
      filesCount: files.length,
      budgetAccount: budget.primaryAccount,
    });

    // Send email notification if configured
    if (resendApiKey && notificationEmail) {
      try {
        await sendNotificationEmail({
          submission: {
            id: submissionId,
            totalAmount,
          },
          requester,
          receipts: receiptsWithBudget,
          pdfBuffer,
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
      { status: 500 }
    );
  }
}
