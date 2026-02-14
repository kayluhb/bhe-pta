import type { Route } from "./+types/api.reimbursement.pdf";
import { generatePDF } from "~/lib/reimbursement/pdf/generator";

interface PDFRequestData {
  submission?: { id?: string; submittedAt: string; totalAmount: number };
  requester: {
    payableTo: string;
    email: string;
    phone?: string;
    address: string;
    dateOfRequest: string;
    dateCheckNeeded: string;
    invoiceNumber?: string;
  };
  receipts: Array<{
    date: string;
    description: string;
    amount: number;
    placeOfPurchase?: string;
    budgetAccount: string;
  }>;
  budget: { primaryAccount: string; splitAccounts: boolean };
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const data = (await request.json()) as PDFRequestData;

    const pdfBuffer = await generatePDF(data as Parameters<typeof generatePDF>[0]);

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reimbursement-${data.submission?.id || "form"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return Response.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
