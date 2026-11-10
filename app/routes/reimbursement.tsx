import {FormWizard} from '~/components/reimbursement/FormWizard';
import {Container} from '~/components/ui/Container';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/reimbursement';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Reimbursement | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content: 'Submit a PTA reimbursement or check request for Barton Hills Elementary.',
    },
    {name: 'robots', content: 'noindex, nofollow'},
  ]);
}

export default function Reimbursement() {
  return (
    <div className="py-10 md:py-14">
      <Container>
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-green-2">
          For volunteers & staff
        </p>
        <h1 className="mt-3 font-display text-[40px] font-extrabold leading-[0.98] tracking-[-0.035em] text-bhe-ink md:text-[clamp(44px,5vw,64px)]">
          Reimbursement request
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] text-bhe-body">
          Submit a check request for PTA-approved expenses. Photos or PDFs of receipts welcome.
        </p>

        <details className="mt-6 rounded-card border border-bhe-border bg-bhe-card p-4 md:hidden">
          <summary className="cursor-pointer font-bold text-bhe-ink">Before you start</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-bhe-muted">
            <li>Photos or PDFs of receipts (up to 10 files)</li>
            <li>Amounts before sales tax — sales tax can&apos;t be reimbursed</li>
            <li>The PTA budget account</li>
            <li>Only PTA-approved expenses qualify</li>
          </ul>
        </details>

        <div className="mt-10">
          <FormWizard />
        </div>
      </Container>
    </div>
  );
}
