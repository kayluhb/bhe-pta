/** @vitest-environment jsdom */
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useTurnstile} from '../useTurnstile';

function Harness() {
  const {containerRef, reset, token} = useTurnstile();
  return (
    <>
      <div data-testid="host" ref={containerRef} />
      <button onClick={reset} type="button">
        reset
      </button>
      <span data-testid="tok">{token ?? ''}</span>
    </>
  );
}

describe('useTurnstile', () => {
  beforeEach(() => {
    for (const n of document.head.querySelectorAll('script[src*="turnstile"]')) {
      n.remove();
    }
    delete (window as unknown as {turnstile?: unknown}).turnstile;
  });

  afterEach(() => {
    cleanup();
    for (const n of document.head.querySelectorAll('script[src*="turnstile"]')) {
      n.remove();
    }
    delete (window as unknown as {turnstile?: unknown}).turnstile;
    vi.restoreAllMocks();
  });

  it('renders widget when turnstile is already on window', () => {
    const renderFn = vi.fn(() => 'wid');
    (
      window as unknown as {
        turnstile: {render: typeof renderFn; remove: () => void; reset: () => void};
      }
    ).turnstile = {
      render: renderFn,
      remove: vi.fn(),
      reset: vi.fn(),
    };
    render(<Harness />);
    expect(renderFn).toHaveBeenCalled();
  });

  it('subscribes to load when turnstile script tag already exists', () => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    document.head.appendChild(script);
    const renderFn = vi.fn(() => 'wid-pre');
    (window as unknown as {turnstile?: {render: typeof renderFn}}).turnstile = undefined;
    render(<Harness />);
    (
      window as unknown as {
        turnstile: {render: typeof renderFn; remove: () => void; reset: () => void};
      }
    ).turnstile = {
      render: renderFn,
      remove: vi.fn(),
      reset: vi.fn(),
    };
    fireEvent.load(script);
    expect(renderFn).toHaveBeenCalled();
  });

  it('injects script when turnstile is missing then renders on load', () => {
    const renderFn = vi.fn(() => 'wid2');
    render(<Harness />);
    const script = document.querySelector('script[src*="turnstile"]');
    expect(script).toBeTruthy();
    if (!script) {
      throw new Error('expected turnstile script');
    }
    (
      window as unknown as {
        turnstile: {render: typeof renderFn; remove: () => void; reset: () => void};
      }
    ).turnstile = {
      render: renderFn,
      remove: vi.fn(),
      reset: vi.fn(),
    };
    fireEvent.load(script);
    expect(renderFn).toHaveBeenCalled();
  });

  it('reset clears token when widget exists', () => {
    const resetFn = vi.fn();
    (
      window as unknown as {
        turnstile: {render: () => string; remove: () => void; reset: typeof resetFn};
      }
    ).turnstile = {
      render: () => 'wid',
      remove: vi.fn(),
      reset: resetFn,
    };
    render(<Harness />);
    fireEvent.click(screen.getAllByRole('button', {name: 'reset'})[0]);
    expect(resetFn).toHaveBeenCalled();
  });
});
