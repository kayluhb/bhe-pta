import {buildAdminSessionSetCookie, resolveSessionSecret, signSession} from '~/lib/admin/auth';
import {verifyGoogleIdToken} from '~/lib/admin/google-id-token';
import type {Route} from './+types/api.auth.callback';

const OAUTH_STATE_COOKIE = 'oauth_state';

function getCookie(request: Request, name: string): string | null {
  const raw = request.headers.get('Cookie') ?? '';
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    const prefix = `${name}=`;
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing authorization code', {status: 400});
  }

  const expectedState = getCookie(request, OAUTH_STATE_COOKIE);
  if (!state || !expectedState || state !== expectedState) {
    return new Response('Invalid or missing OAuth state', {status: 400});
  }

  const origin = url.origin;
  const {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET} = context.cloudflare.env;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/api/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    return new Response('Token exchange failed', {status: 401});
  }

  const tokenData = (await tokenResponse.json()) as {id_token?: string};
  const idToken = tokenData.id_token;

  if (!idToken) {
    return new Response('Failed to get ID token from Google', {status: 400});
  }

  const user = await verifyGoogleIdToken(idToken, GOOGLE_CLIENT_ID);
  if (!user) {
    return new Response('Access denied. Only @bheeagles.com accounts are allowed.', {status: 403});
  }

  const cookieValue = await signSession(
    {email: user.email, name: user.name, picture: user.picture},
    resolveSessionSecret(context.cloudflare.env),
  );

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `${OAUTH_STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  );
  headers.append('Set-Cookie', buildAdminSessionSetCookie(request, cookieValue));
  headers.set('Location', `${origin}/admin`);

  return new Response(null, {status: 302, headers});
}
