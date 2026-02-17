import type { Route } from "./+types/api.admin.bulk-status";
import { requireAdmin } from "~/lib/admin/auth";

const VALID_STATUSES = ["pending", "approved", "rejected", "needs_info"];

export async function action({ request, context }: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const body = (await request.json()) as { ids?: string[]; status?: string };

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return Response.json({ error: "No submissions selected" }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const placeholders = body.ids.map(() => "?").join(", ");
  await db
    .prepare(
      `UPDATE submissions SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`
    )
    .bind(body.status, ...body.ids)
    .run();

  return Response.json({ success: true, updated: body.ids.length });
}
