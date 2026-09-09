import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/admin.membership';

// Placeholder pending Task 7 (the admin page). Registering this route in Task 6 lets
// api.admin.membership-import.ts's route-typegen dependency resolve; Task 7 replaces this
// file entirely.
export async function loader({request, context}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  return null;
}

export default function AdminMembership() {
  return <p>Membership import — coming soon.</p>;
}
