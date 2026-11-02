import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {parseAnnualFundSubmission} from '~/lib/fundraising/campaign';
import {isMissingAnnualFundTable, saveAnnualFundDraft} from '~/lib/fundraising/campaign-store';
import type {Route} from './+types/api.admin.annual-fund';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({error: 'Expected JSON.'}, {status: 400});
  }

  const parsed = parseAnnualFundSubmission(body);
  if (!parsed.ok) return Response.json({error: parsed.error}, {status: 400});

  try {
    await saveAnnualFundDraft(env.REIMBURSEMENT_DB, parsed.draft);
  } catch (error) {
    if (isMissingAnnualFundTable(error)) {
      return Response.json(
        {
          error:
            'The Annual Fund table is not in the database yet. Apply the latest D1 migration, then save again.',
        },
        {status: 503},
      );
    }
    throw error;
  }

  return Response.json({draft: parsed.draft, ok: true});
}
