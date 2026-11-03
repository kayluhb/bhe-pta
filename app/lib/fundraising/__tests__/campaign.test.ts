import {describe, expect, it} from 'vitest';

import {annualFundCodeDefaults} from '~/data/annual-fund-campaign';

import {
  annualFundAsOfDate,
  campaignFromDraft,
  draftFromCode,
  parseAnnualFundSubmission,
  parseMoney,
  validateAnnualFundDraft,
} from '../campaign';

describe('annual fund draft', () => {
  it('adds online and offline into the raised total', () => {
    const campaign = campaignFromDraft(draftFromCode());
    expect(campaign.raisedAmount).toBeCloseTo(
      annualFundCodeDefaults.onlineRaisedAmount + annualFundCodeDefaults.offlineRaisedAmount,
    );
    expect(campaign.milestones.at(-1)?.amount).toBe(campaign.goalAmount);
  });

  it('parses dollar amounts with commas and cents', () => {
    expect(parseMoney('$215,350.88')).toBe(215_350.88);
    expect(parseMoney('59_000')).toBe(59_000);
    expect(parseMoney('-1')).toBeNull();
    expect(parseMoney('12.345')).toBeNull();
  });

  it('rejects a final milestone that does not equal the goal', () => {
    const draft = draftFromCode();
    draft.goalAmount = 300_000;
    expect(validateAnnualFundDraft(draft)).toMatch(/last milestone/);
  });

  it('rejects milestone amounts that are not cumulative', () => {
    const draft = draftFromCode();
    draft.milestones[1].amount = draft.milestones[0].amount;
    expect(validateAnnualFundDraft(draft)).toMatch(/cumulative/);
  });

  it('stamps last updated in Austin and accepts a cleared offline total', () => {
    const result = parseAnnualFundSubmission({
      goalAmount: annualFundCodeDefaults.goalAmount,
      milestones: annualFundCodeDefaults.milestones,
      offlineRaisedAmount: '60,000',
      onlineRaisedAmount: annualFundCodeDefaults.onlineRaisedAmount,
      schoolYear: annualFundCodeDefaults.schoolYear,
      suggestedAskPerChild: annualFundCodeDefaults.suggestedAskPerChild,
      title: annualFundCodeDefaults.title,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.offlineRaisedAmount).toBe(60_000);
    expect(result.draft.lastUpdated).toBe(annualFundAsOfDate());
    expect(campaignFromDraft(result.draft).raisedAmount).toBeCloseTo(
      annualFundCodeDefaults.onlineRaisedAmount + 60_000,
    );
  });

  it('dates the publish day in Central time', () => {
    expect(annualFundAsOfDate(new Date('2026-11-02T05:30:00Z'))).toBe('2026-11-01');
  });

  it('defaults the thermometer to visible and can publish it hidden', () => {
    expect(campaignFromDraft(draftFromCode()).thermometerVisible).toBe(true);

    const result = parseAnnualFundSubmission({
      goalAmount: annualFundCodeDefaults.goalAmount,
      milestones: annualFundCodeDefaults.milestones,
      offlineRaisedAmount: annualFundCodeDefaults.offlineRaisedAmount,
      onlineRaisedAmount: annualFundCodeDefaults.onlineRaisedAmount,
      schoolYear: annualFundCodeDefaults.schoolYear,
      suggestedAskPerChild: annualFundCodeDefaults.suggestedAskPerChild,
      thermometerVisible: false,
      title: annualFundCodeDefaults.title,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.thermometerVisible).toBe(false);
    expect(campaignFromDraft(result.draft).thermometerVisible).toBe(false);
  });
});
