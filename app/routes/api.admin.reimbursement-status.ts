import type { Route } from "./+types/api.admin.reimbursement-status";
import { requireAdmin } from "~/lib/admin/auth";

const VALID_STATUSES = ["pending", "approved", "rejected", "needs_info"];

export async function action({ request, params, context }: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const id = params.id;
  const body = (await request.json()) as { status?: string; notes?: string };

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const result = await db
    .prepare(
      `UPDATE submissions SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .bind(body.status, body.notes ?? null, id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "Submission not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
