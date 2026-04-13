import type {Route} from './+types/api.auth.google';

export async function loader({request, context}: Route.LoaderArgs) {
  const {GOOGLE_CLIENT_ID} = context.cloudflare.env;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    hd: 'bheeagles.com',
    state,
  });

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: googleUrl,
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}
