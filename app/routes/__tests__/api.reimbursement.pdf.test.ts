import {describe, expect, it} from 'vitest';

import {createTestLoadContext} from '~/lib/test-cloudflare-context';
import {action} from '../api.reimbursement.pdf';

describe('POST /api/reimbursement/pdf', () => {
  it('returns 403 when Turnstile is missing', async () => {
    const response = await action({
      context: createTestLoadContext({
        ctx: {} as ExecutionContext,
        env: {TURNSTILE_SECRET_KEY: 'secret'},
      }),
      request: new Request('https://x.test/api/reimbursement/pdf', {
        body: '{}',
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      }),
    } as never);

    expect(response.status).toBe(403);
  });
});
