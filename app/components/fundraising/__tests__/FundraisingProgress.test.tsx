/** @vitest-environment jsdom */
import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';

import type {AnnualFundCampaign} from '~/data/annual-fund-campaign';

import {FundraisingProgress} from '../FundraisingProgress';

vi.mock('lottie-react', () => ({
  LottieSvg: () => <div data-testid="eagle-lottie" />,
}));

const campaign: AnnualFundCampaign = {
  giveUrl: 'https://example.com',
  goalAmount: 100,
  lastUpdated: '2026-10-16',
  milestones: [
    {
      amount: 50,
      description: 'First milestone',
      id: 'first',
      label: 'First',
      targetDate: '2026-06-25',
    },
    {
      amount: 100,
      description: 'Final milestone',
      id: 'last',
      label: 'Last',
      targetDate: '2027-05-01',
    },
  ],
  raisedAmount: 120,
  schoolYear: '2026-27',
  suggestedAskPerChild: 650,
  title: 'Annual Fund Milestones',
};

describe('FundraisingProgress', () => {
  afterEach(() => {
    cleanup();
  });

  beforeAll(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      matches: true,
      media: query,
      removeEventListener: vi.fn(),
    }));
  });

  it('celebrates when the raised amount reaches the goal', () => {
    render(<FundraisingProgress campaign={campaign} />);

    expect(screen.getByText('Goal reached')).toBeInTheDocument();
    expect(document.querySelector('.goal-celebration-wrap')).not.toBeNull();
    expect(document.querySelector('img[src="/barton-hills-mascot.svg"]')).toBeNull();
  });

  it('keeps the thermometer quiet before the goal', () => {
    render(<FundraisingProgress campaign={{...campaign, raisedAmount: 40}} />);

    expect(screen.queryByText('Goal reached')).not.toBeInTheDocument();
    expect(document.querySelector('.goal-celebration-wrap')).toBeNull();
    expect(document.querySelector('img[src="/barton-hills-mascot.svg"]')).not.toBeNull();
  });
});
