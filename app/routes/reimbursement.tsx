import {FormWizard} from '~/components/reimbursement/FormWizard';
import type {Route} from './+types/reimbursement';

export function meta({}: Route.MetaArgs) {
  return [
    {title: 'Reimbursement | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content: 'Submit a PTA reimbursement or check request for Barton Hills Elementary.',
    },
  ];
}

export default function Reimbursement() {
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
            Reimbursement Request
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Submit a check request for PTA-approved expenses
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-warm-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <FormWizard />
        </div>
      </section>
    </div>
  );
}
