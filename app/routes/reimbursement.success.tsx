import {Link, useSearchParams} from 'react-router';
import type {Route} from './+types/reimbursement.success';

export function meta({}: Route.MetaArgs) {
  return [
    {title: 'Request Submitted | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content: 'Your reimbursement request has been submitted successfully.',
    },
  ];
}

export default function ReimbursementSuccess() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  return (
    <div>
      {/* Page Banner */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Request Submitted
          </h1>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* Success Content */}
      <section className="bg-warm-white py-12 md:py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-charcoal/10 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-creek-green/10 mb-6">
              <svg
                className="h-8 w-8 text-creek-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-charcoal mb-2">Request Submitted!</h2>

            <p className="text-charcoal/70 mb-6">
              Your reimbursement request has been submitted successfully. You will receive a
              confirmation email shortly.
            </p>

            {id && (
              <p className="text-sm text-charcoal/70 mb-6">
                Reference ID: <span className="font-mono">{id}</span>
              </p>
            )}

            <div className="space-y-3">
              <Link
                to="/reimbursement"
                className="block w-full py-2 px-4 bg-eagle-blue text-white rounded-lg font-medium hover:bg-eagle-blue/90 transition-colors"
              >
                Submit Another Request
              </Link>

              <p className="text-sm text-charcoal/70">Questions? Contact your PTA treasurer.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
