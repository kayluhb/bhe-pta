import jsPDF from 'jspdf';

interface PDFData {
  submission: {
    id: string;
    submittedAt: string;
    totalAmount: number;
  };
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
  budget: {
    primaryAccount: string;
    splitAccounts: boolean;
  };
}

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function generatePDF(data: PDFData): Promise<Uint8Array> {
  const { submission, requester, receipts, budget } = data;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PTA Check Request', 105, 20, { align: 'center' });

  // Horizontal line
  doc.setDrawColor(200);
  doc.line(20, 28, 190, 28);

  // Submission Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`Reference: ${submission.id}`, 20, 38);
  doc.text(`Submitted: ${formatDate(submission.submittedAt)}`, 140, 38);

  // Check Request Info Section
  let yPos = 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Check Request Information', 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Payable to: ${requester.payableTo}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${requester.email}`, 20, yPos);
  yPos += 6;
  if (requester.phone) {
    doc.text(`Phone: ${requester.phone}`, 20, yPos);
    yPos += 6;
  }
  doc.text(`Address: ${requester.address}`, 20, yPos);
  yPos += 6;
  doc.text(`Date of Request: ${formatDate(requester.dateOfRequest)}`, 20, yPos);
  doc.text(`Date Check Needed: ${formatDate(requester.dateCheckNeeded)}`, 105, yPos);
  yPos += 6;
  if (requester.invoiceNumber) {
    doc.text(`Invoice #: ${requester.invoiceNumber}`, 20, yPos);
    yPos += 6;
  }

  // Budget Account Section
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Budget Account', 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Primary Account: ${budget.primaryAccount}`, 20, yPos);

  // Receipts Table
  yPos += 14;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Details', 20, yPos);

  yPos += 8;

  // Table header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  doc.text('Date', 22, yPos);
  doc.text('Description', 42, yPos);
  doc.text('Place', 90, yPos);
  doc.text('Account', 115, yPos);
  doc.text('Amount', 168, yPos);

  yPos += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  receipts.forEach((receipt, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPos - 5, 170, 8, 'F');
    }

    doc.text(formatDate(receipt.date), 22, yPos);
    doc.text(truncateText(receipt.description, 22), 42, yPos);
    doc.text(truncateText(receipt.placeOfPurchase || '-', 12), 90, yPos);
    doc.text(truncateText(receipt.budgetAccount, 24), 115, yPos);
    doc.text(formatCurrency(receipt.amount), 168, yPos);

    yPos += 8;
  });

  // Total line
  yPos += 5;
  doc.setDrawColor(200);
  doc.line(130, yPos - 3, 190, yPos - 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', 148, yPos + 2);
  doc.text(formatCurrency(submission.totalAmount), 168, yPos + 2);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text(
    'This document was automatically generated. Please retain for your records.',
    105,
    280,
    { align: 'center' }
  );
  doc.text(
    'Note: Sales tax cannot be reimbursed.',
    105,
    285,
    { align: 'center' }
  );

  // Return as Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
