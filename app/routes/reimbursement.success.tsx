import {Link, useSearchParams} from 'react-router';

import {Button} from '~/components/ui/Button';
import {Container} from '~/components/ui/Container';
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
  const email = searchParams.get('email');
  const total = searchParams.get('total');

  return (
    <div>
      <PageHero title="Request submitted" />

      <section className="bg-bhe-paper py-12 md:py-16">
        <Container className="max-w-md">
          <div className="rounded-card border border-bhe-border bg-bhe-card p-8 text-center shadow-form">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-bhe-tint-green">
              <svg
                aria-hidden="true"
                className="h-8 w-8 text-bhe-green"
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

            {email ? (
              <p className="text-bhe-body">
                We&apos;ve emailed a copy to{' '}
                <span className="font-semibold text-bhe-ink">{email}</span>. The treasurer will
                follow up if anything else is needed.
              </p>
            ) : (
              <p className="text-bhe-body">
                We&apos;ve received your request. You&apos;ll get a confirmation email shortly, and
                the treasurer will follow up if anything else is needed.
              </p>
            )}

            {total ? (
              <p className="mt-4 font-display text-4xl font-extrabold text-bhe-ink">${total}</p>
            ) : null}

            {id ? (
              <p className="mt-3 text-sm text-bhe-muted">
                Reference ID: <span className="font-mono text-bhe-ink">{id}</span>
              </p>
            ) : null}

            <Button className="mt-8 w-full" size="lg" to="/reimbursement" variant="primary">
              Submit another request
            </Button>

            <p className="mt-4 text-sm text-bhe-muted">
              Questions?{' '}
              <a
                className="font-bold text-bhe-green hover:underline"
                href="mailto:treasurer@bheeagles.com"
              >
                Email treasurer@bheeagles.com
              </a>
            </p>

            <Link
              className="mt-6 inline-flex text-sm font-bold text-bhe-green hover:underline"
              to="/"
            >
              Back to home
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
