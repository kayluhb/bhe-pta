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
  const {submission, requester, receipts, budget} = data;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BHE PTA Check Request', 105, 18, {align: 'center'});

  // Horizontal line
  doc.setDrawColor(200);
  doc.line(20, 23, 190, 23);

  // Submission Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`Reference: ${submission.id}`, 20, 30);
  doc.text(`Submitted: ${formatDate(submission.submittedAt)}`, 140, 30);

  // Check Request Info Section — condensed two-column layout
  let yPos = 38;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Check Request Information', 20, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const labelX = 20;
  const valueX = 50;
  const labelX2 = 110;
  const valueX2 = 140;

  doc.text('Payable to:', labelX, yPos);
  doc.text(requester.payableTo, valueX, yPos);
  doc.text('Email:', labelX2, yPos);
  doc.text(requester.email, valueX2, yPos);
  yPos += 5;

  doc.text('Address:', labelX, yPos);
  doc.text(requester.address, valueX, yPos);
  if (requester.phone) {
    doc.text('Phone:', labelX2, yPos);
    doc.text(requester.phone, valueX2, yPos);
  }
  yPos += 5;

  doc.text('Date of Request:', labelX, yPos);
  doc.text(formatDate(requester.dateOfRequest), valueX, yPos);
  doc.text('Check Needed:', labelX2, yPos);
  doc.text(formatDate(requester.dateCheckNeeded), valueX2, yPos);
  yPos += 5;
  if (requester.invoiceNumber) {
    doc.text('Invoice #:', labelX, yPos);
    doc.text(requester.invoiceNumber, valueX, yPos);
    yPos += 5;
  }

  // Budget Account Section
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Budget Account', 20, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Primary Account: ${budget.primaryAccount}`, 20, yPos);

  // Receipts Table
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Details', 20, yPos);

  yPos += 8;

  // Table header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
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

  // Treasurer's Notes box and Remarks
  yPos += 16;
  doc.setDrawColor(0);
  doc.setTextColor(0);

  // Treasurer's Notes box
  const boxX = 20;
  const boxW = 90;
  const boxH = 52;
  let boxY = yPos + 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  boxY += 0;
  doc.text('Date Received:', boxX + 3, boxY);
  doc.line(boxX + 35, boxY + 1, boxX + 70, boxY + 1);

  boxY += 8;
  doc.text('Date Approved:', boxX + 3, boxY);
  doc.line(boxX + 35, boxY + 1, boxX + 70, boxY + 1);

  boxY += 8;
  doc.text('Date Paid:', boxX + 3, boxY);
  doc.line(boxX + 25, boxY + 1, boxX + 70, boxY + 1);

  boxY += 8;
  doc.text('Check Number:', boxX + 3, boxY);
  doc.line(boxX + 35, boxY + 1, boxX + 70, boxY + 1);

  boxY += 8;
  doc.text('Amount of Check:', boxX + 3, boxY);
  doc.line(boxX + 40, boxY + 1, boxX + 70, boxY + 1);

  // Signature lines
  yPos += boxH + 14;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('First Board Member:', 20, yPos);
  doc.line(58, yPos + 1, 190, yPos + 1);

  yPos += 10;
  doc.text('Second Board Member:', 20, yPos);
  doc.line(62, yPos + 1, 190, yPos + 1);

  // Footer
  yPos += 16;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text('This document was automatically generated. Please retain for your records.', 105, 280, {
    align: 'center',
  });
  doc.text('Note: Sales tax cannot be reimbursed.', 105, 285, {
    align: 'center',
  });

  // Return as Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
