import type { Route } from "./+types/api.admin.bulk-delete";
import { requireAdmin } from "~/lib/admin/auth";

export async function action({ request, context }: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const body = (await request.json()) as { ids?: string[] };

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return Response.json({ error: "No submissions selected" }, { status: 400 });
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const r2 = context.cloudflare.env.R2_BUCKET;

  // Get all R2 keys to delete
  const placeholders = body.ids.map(() => "?").join(", ");

  const submissions = await db
    .prepare(`SELECT id, pdf_key FROM submissions WHERE id IN (${placeholders})`)
    .bind(...body.ids)
    .all<{ id: string; pdf_key: string | null }>();

  const files = await db
    .prepare(`SELECT r2_key FROM file_attachments WHERE submission_id IN (${placeholders})`)
    .bind(...body.ids)
    .all<{ r2_key: string }>();

  // Delete from R2
  if (r2) {
    const keysToDelete = [
      ...submissions.results.map((s) => s.pdf_key).filter(Boolean),
      ...files.results.map((f) => f.r2_key),
    ] as string[];
    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((key) => r2.delete(key)));
    }
  }

  // Delete from D1 (cascades)
  await db
    .prepare(`DELETE FROM submissions WHERE id IN (${placeholders})`)
    .bind(...body.ids)
    .run();

  return Response.json({ success: true, deleted: body.ids.length });
}
