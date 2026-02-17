import type { Route } from "./+types/api.admin.reimbursements-export";
import { requireAdmin } from "~/lib/admin/auth";

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface ExportRow {
  id: string;
  submitted_at: string;
  requester_name: string;
  requester_email: string;
  total_amount: number;
  status: string;
  admin_notes: string | null;
  receipt_date: string | null;
  description: string | null;
  vendor: string | null;
  category: string | null;
  receipt_amount: number | null;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const idsParam = url.searchParams.get("ids");

  const db = context.cloudflare.env.REIMBURSEMENT_DB;

  let query = `
    SELECT s.id, s.submitted_at, s.requester_name, s.requester_email, s.total_amount, s.status, s.admin_notes,
           r.receipt_date, r.description, r.vendor, r.category, r.amount as receipt_amount
    FROM submissions s
    LEFT JOIN receipt_entries r ON r.submission_id = s.id
  `;

  const params: string[] = [];
  const conditions: string[] = [];

  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length > 0) {
      conditions.push(`s.id IN (${ids.map(() => "?").join(", ")})`);
      params.push(...ids);
    }
  } else if (statusFilter) {
    conditions.push(`s.status = ?`);
    params.push(statusFilter);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY s.submitted_at DESC, r.sort_order`;

  const stmt = params.length
    ? db.prepare(query).bind(...params)
    : db.prepare(query);

  const results = await stmt.all<ExportRow>();

  const headers = [
    "Submission ID",
    "Date",
    "Requester",
    "Email",
    "Total Amount",
    "Status",
    "Notes",
    "Receipt Date",
    "Description",
    "Vendor",
    "Budget Account",
    "Receipt Amount",
  ];

  const rows = results.results.map((row) =>
    [
      row.id,
      row.submitted_at,
      row.requester_name,
      row.requester_email,
      row.total_amount,
      row.status,
      row.admin_notes,
      row.receipt_date,
      row.description,
      row.vendor,
      row.category,
      row.receipt_amount,
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="reimbursements-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
