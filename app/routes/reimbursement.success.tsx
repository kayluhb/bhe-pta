import {Link, useSearchParams} from 'react-router';
import {PageHero} from '~/components/ui/PageHero';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/reimbursement.success';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Request Submitted | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content: 'Your reimbursement request has been submitted successfully.',
    },
    {name: 'robots', content: 'noindex, nofollow'},
  ]);
}

export default function ReimbursementSuccess() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  return (
    <div>
      {/* Page Banner */}
      <PageHero title="Request Submitted" />

      {/* Success Content */}
      <section className="bg-bhe-paper py-12 md:py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-bhe-border/10 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-bhe-green-2/10 mb-6">
              <svg
                aria-hidden="true"
                className="h-8 w-8 text-bhe-green-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-bhe-ink mb-2">Request Submitted!</h2>

            <p className="text-bhe-ink/70 mb-6">
              Your reimbursement request has been submitted successfully. You will receive a
              confirmation email shortly.
            </p>

            {id && (
              <p className="text-sm text-bhe-ink/70 mb-6">
                Reference ID: <span className="font-mono">{id}</span>
              </p>
            )}

            <div className="space-y-3">
              <Link
                className="block w-full py-2 px-4 bg-bhe-green text-white rounded-lg font-medium hover:bg-bhe-green/90 transition-colors"
                to="/reimbursement"
              >
                Submit Another Request
              </Link>

              <p className="text-sm text-bhe-ink/70">Questions? Contact your PTA treasurer.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
