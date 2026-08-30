import {describe, expect, it} from 'vitest';

import {annualFundCampaign} from '~/data/annual-fund-campaign';

describe('annualFundCampaign', () => {
  it('uses three cumulative milestones ending at the goal', () => {
    const {goalAmount, milestones, raisedAmount} = annualFundCampaign;

    expect(goalAmount).toBe(272_000);
    expect(raisedAmount).toBeCloseTo(171_649.22);
    expect(milestones).toHaveLength(3);
    expect(milestones.at(-1)?.amount).toBe(goalAmount);

    for (let i = 1; i < milestones.length; i++) {
      expect(milestones[i].amount).toBeGreaterThan(milestones[i - 1].amount);
    }
  });
});
