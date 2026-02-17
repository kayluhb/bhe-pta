import type { Route } from "./+types/api.auth.google";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { GOOGLE_CLIENT_ID } = context.cloudflare.env;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    hd: "bheeagles.com",
  });

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return Response.redirect(googleUrl, 302);
}
