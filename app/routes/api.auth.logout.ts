import type { Route } from "./+types/api.auth.logout";

export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/`,
      "Set-Cookie":
        "admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
}
