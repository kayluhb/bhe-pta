/** @vitest-environment jsdom */
import {cleanup, fireEvent, render, waitFor} from '@testing-library/react';
import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest';

import {useDiscoMode} from '../useDiscoMode';

function Harness() {
  const {isDiscoMode} = useDiscoMode();
  return <div data-testid="d">{isDiscoMode ? 'on' : 'off'}</div>;
}

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: () => {},
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: () => Promise.resolve(),
  });
});

afterAll(() => {
  delete (HTMLMediaElement.prototype as {pause?: unknown; play?: unknown}).pause;
  delete (HTMLMediaElement.prototype as {pause?: unknown; play?: unknown}).play;
});

describe('useDiscoMode', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('activates after typing the trigger word', async () => {
    render(<Harness />);
    for (const ch of 'beckett') {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: ch}));
    }
    await waitFor(() => {
      expect(document.querySelector('[data-testid="d"]')?.textContent).toBe('on');
    });
  });

  it('turns off after the disco timer elapses', async () => {
    vi.useFakeTimers();
    render(<Harness />);
    for (const ch of 'beckett') {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: ch}));
    }
    await vi.advanceTimersByTimeAsync(21_000);
    expect(document.querySelector('[data-testid="d"]')?.textContent).toBe('off');
    vi.useRealTimers();
  });

  it('ignores typing inside inputs', () => {
    render(
      <div>
        <input defaultValue="" />
        <Harness />
      </div>,
    );
    const input = document.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);
    const el = input as HTMLInputElement;
    el.focus();
    for (const ch of 'beckett') {
      fireEvent.keyDown(el, {bubbles: true, key: ch});
    }
    expect(document.querySelector('[data-testid="d"]')?.textContent).toBe('off');
  });

  it('activates after repeated strong motion events', async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      class Polyfill extends Event {
        accelerationIncludingGravity: DeviceMotionEventAcceleration | null;
        constructor(type: string, init?: DeviceMotionEventInit) {
          super(type);
          const a = init?.accelerationIncludingGravity;
          this.accelerationIncludingGravity =
            a && a.x != null && a.y != null && a.z != null ? {x: a.x, y: a.y, z: a.z} : null;
        }
      }
      (globalThis as unknown as {DeviceMotionEvent: typeof DeviceMotionEvent}).DeviceMotionEvent =
        Polyfill as typeof DeviceMotionEvent;
    }
    class TestAudio {
      currentTime = 0;
      pause = vi.fn();
      play = vi.fn().mockResolvedValue(undefined);
    }
    const OriginalAudio = globalThis.Audio;
    globalThis.Audio = TestAudio as unknown as typeof Audio;
    try {
      render(<Harness />);
      const mk = (x: number) => {
        const acc: DeviceMotionEventAcceleration = {x, y: 0, z: 0};
        return new DeviceMotionEvent('devicemotion', {accelerationIncludingGravity: acc});
      };
      window.dispatchEvent(mk(50));
      await new Promise((r) => setTimeout(r, 55));
      window.dispatchEvent(mk(90));
      await new Promise((r) => setTimeout(r, 55));
      window.dispatchEvent(mk(130));
      await waitFor(
        () => {
          expect(document.querySelector('[data-testid="d"]')?.textContent).toBe('on');
        },
        {timeout: 4000},
      );
    } finally {
      globalThis.Audio = OriginalAudio;
    }
  });
});
