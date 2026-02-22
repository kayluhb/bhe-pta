import {verifySession} from '~/lib/admin/auth';
import type {Route} from './+types/admin.login';

export function meta() {
  return [{title: 'Sign In | Barton Hills Elementary PTA Admin'}];
}

export async function loader({request, context}: Route.LoaderArgs) {
  // If already logged in, redirect to admin
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const sessionCookie = cookieHeader.split('; ').find((c) => c.startsWith('admin_session='));
  if (sessionCookie) {
    const value = sessionCookie.substring('admin_session='.length);
    const payload = await verifySession(value, context.cloudflare.env.SESSION_SECRET);
    if (payload) {
      return Response.redirect(new URL('/admin', request.url).toString(), 302);
    }
  }
  return {};
}

export default function AdminLogin() {
  return (
    <main className="min-h-screen bg-warm-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-eagle-blue to-night-blue mb-4">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-charcoal">PTA Admin</h1>
          <p className="mt-2 text-sm text-gray-500 font-body">Barton Hills Elementary</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-body text-center mb-6">
            Sign in with your <span className="font-medium">@bheeagles.com</span> Google account to
            access the admin dashboard.
          </p>

          <a
            className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-charcoal shadow-sm hover:bg-gray-50 transition-colors font-body"
            href="/api/auth/google"
          >
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 font-body">
          Only authorized PTA board members can access this area.
        </p>
      </div>
    </main>
  );
}
