import {buildAdminSessionSetCookie, resolveSessionSecret, signSession} from '~/lib/admin/auth';
import type {Route} from './+types/api.auth.dev-login';

/** Hard-coded local-dev identity (Vite dev only; route returns 404 in production builds). */
const DEV_LOCAL_ADMIN = {
  email: 'kayluhb@gmail.com',
  name: 'Kayluhb',
} as const;

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  if (!import.meta.env.DEV) {
    return Response.json({error: 'Not found'}, {status: 404});
  }

  const env = context.cloudflare.env;
  const origin = new URL(request.url).origin;
  const cookieValue = await signSession(
    {email: DEV_LOCAL_ADMIN.email, name: DEV_LOCAL_ADMIN.name},
    resolveSessionSecret(env),
  );

  return Response.json(
    {ok: true, redirect: `${origin}/admin`},
    {
      headers: {
        'Set-Cookie': buildAdminSessionSetCookie(request, cookieValue),
      },
    },
  );
}
