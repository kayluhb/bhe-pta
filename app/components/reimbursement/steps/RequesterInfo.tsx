import {Button} from '~/components/reimbursement/ui/Button';
import {Input} from '~/components/reimbursement/ui/Input';
import type {RequesterData} from '~/lib/reimbursement/validation';

interface RequesterInfoProps {
  data: RequesterData;
  onChange: (data: Partial<RequesterData>) => void;
  onNext: () => void;
  onShowHelp?: () => void;
  errors?: Record<string, string>;
}

export function RequesterInfo({
  data,
  onChange,
  onNext,
  onShowHelp,
  errors = {},
}: RequesterInfoProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-card border border-bhe-border bg-bhe-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-display text-xl font-bold text-bhe-ink">Who should we pay?</h2>
          {onShowHelp && (
            <button
              aria-label="Show form instructions"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-bhe-border bg-bhe-card text-xs font-semibold text-bhe-muted transition-colors hover:bg-bhe-paper-2 hover:text-bhe-ink"
              onClick={onShowHelp}
              type="button"
            >
              <span aria-hidden="true">?</span>
            </button>
          )}
        </div>
        <p className="mb-6 text-bhe-muted">
          Payment details for your reimbursement request.
          <br />
          Fields marked with <span className="text-bhe-error">*</span> are required.
        </p>

        <div className="space-y-4">
          <Input
            autoComplete="name"
            error={errors.payableTo}
            label="Payable to"
            onChange={(e) => onChange({payableTo: e.target.value})}
            placeholder="Name to appear on check"
            required
            value={data.payableTo}
          />

          <Input
            autoComplete="email"
            error={errors.email}
            label="Email Address"
            onChange={(e) => onChange({email: e.target.value})}
            placeholder="your@email.com"
            required
            type="email"
            value={data.email}
          />

          <Input
            autoComplete="tel"
            error={errors.phone}
            label="Phone Number"
            onChange={(e) => onChange({phone: e.target.value})}
            placeholder="(555) 123-4567"
            type="tel"
            value={data.phone || ''}
          />

          <Input
            autoComplete="street-address"
            error={errors.address}
            label="Mailing Address"
            onChange={(e) => onChange({address: e.target.value})}
            placeholder="Street address, City, State ZIP"
            required
            value={data.address}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              autoComplete="off"
              disabled
              label="Date of Request"
              onChange={() => {}} // Read-only
              type="date"
              value={data.dateOfRequest}
            />

            <Input
              autoComplete="off"
              error={errors.dateCheckNeeded}
              label="Date Check Needed"
              onChange={(e) => onChange({dateCheckNeeded: e.target.value})}
              required
              type="date"
              value={data.dateCheckNeeded}
            />
          </div>

          <Input
            autoComplete="off"
            error={errors.invoiceNumber}
            label="Invoice Number (if applicable)"
            onChange={(e) => onChange({invoiceNumber: e.target.value})}
            placeholder="Optional"
            value={data.invoiceNumber || ''}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Next: Add Receipts</Button>
      </div>
    </form>
  );
}
