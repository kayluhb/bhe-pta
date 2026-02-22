import {signSession} from '~/lib/admin/auth';
import type {Route} from './+types/api.auth.callback';

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code', {status: 400});
  }

  const origin = url.origin;
  const {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET} = context.cloudflare.env;

  // Exchange code for tokens
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

  const tokenData = (await tokenResponse.json()) as {id_token?: string};
  const idToken = tokenData.id_token;

  if (!idToken) {
    return new Response('Failed to get ID token from Google', {status: 400});
  }

  // Decode JWT payload (no verification needed — received directly from Google over HTTPS)
  const payloadPart = idToken.split('.')[1];
  const decoded = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as {
    email?: string;
    name?: string;
    picture?: string;
  };

  const {email, name, picture} = decoded;

  if (!email || !email.endsWith('@bheeagles.com')) {
    return new Response('Access denied. Only @bheeagles.com accounts are allowed.', {status: 403});
  }

  const cookieValue = await signSession({email, name: name ?? email, picture}, SESSION_SECRET);

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/admin`,
      'Set-Cookie': `admin_session=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`,
    },
  });
}
