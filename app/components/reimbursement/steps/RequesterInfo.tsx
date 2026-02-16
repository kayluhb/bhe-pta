import { Input } from '~/components/reimbursement/ui/Input';
import { Button } from '~/components/reimbursement/ui/Button';
import type { RequesterData } from '~/lib/reimbursement/validation';

interface RequesterInfoProps {
  data: RequesterData;
  onChange: (data: Partial<RequesterData>) => void;
  onNext: () => void;
  errors?: Record<string, string>;
}

export function RequesterInfo({ data, onChange, onNext, errors = {} }: RequesterInfoProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-charcoal/10">
        <h2 className="text-xl font-semibold text-charcoal mb-4">Check Request Information</h2>
        <p className="text-charcoal/70 mb-6">
          Please provide the payment details for your reimbursement request.
        </p>

        <div className="space-y-4">
          <Input
            label="Payable to"
            value={data.payableTo}
            onChange={(e) => onChange({ payableTo: e.target.value })}
            error={errors.payableTo}
            placeholder="Name to appear on check"
            autoComplete="name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            error={errors.email}
            placeholder="your@email.com"
            autoComplete="email"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => onChange({ phone: e.target.value })}
            error={errors.phone}
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />

          <Input
            label="Mailing Address"
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
            error={errors.address}
            placeholder="Street address, City, State ZIP"
            autoComplete="street-address"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date of Request"
              type="date"
              value={data.dateOfRequest}
              onChange={() => {}} // Read-only
              disabled
              autoComplete="off"
            />

            <Input
              label="Date Check Needed"
              type="date"
              value={data.dateCheckNeeded}
              onChange={(e) => onChange({ dateCheckNeeded: e.target.value })}
              error={errors.dateCheckNeeded}
              autoComplete="off"
              required
            />
          </div>

          <Input
            label="Invoice Number (if applicable)"
            value={data.invoiceNumber || ''}
            onChange={(e) => onChange({ invoiceNumber: e.target.value })}
            error={errors.invoiceNumber}
            placeholder="Optional"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">
          Next: Add Receipts
        </Button>
      </div>
    </form>
  );
}
