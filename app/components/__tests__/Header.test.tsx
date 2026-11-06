/** @vitest-environment jsdom */
import {cleanup, render, screen} from '@testing-library/react';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {afterEach, describe, expect, it} from 'vitest';

import {Header} from '~/components/Header';

describe('Header', () => {
  afterEach(() => {
    cleanup();
  });

  it('exposes Give link to annual fund and main nav', () => {
    const router = createMemoryRouter(
      [
        {path: '/', element: <Header />},
        {path: '/annual-fund', element: <div />},
        {path: '/about', element: <div />},
      ],
      {initialEntries: ['/']},
    );
    render(<RouterProvider router={router} />);
    const giveLinks = screen.getAllByRole('link', {name: /^give$/i});
    expect(giveLinks.length).toBeGreaterThan(0);
    expect(giveLinks.every((el) => el.getAttribute('href') === '/annual-fund')).toBe(true);
    expect(giveLinks.some((el) => /bhe-gold/.test(el.className))).toBe(true);
    expect(screen.getByRole('navigation', {name: /main/i})).toBeTruthy();
    expect(screen.getByText(/parent teacher association/i)).toBeTruthy();
  });
});
