/** @vitest-environment jsdom */
import {cleanup, fireEvent, render} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';

import {HeaderLogo} from '~/components/HeaderLogo';

function renderLogo() {
  const {container} = render(<HeaderLogo />);
  const logo = container.firstElementChild as HTMLElement;
  const wing = container.querySelector('.eagle-wing-upper') as SVGGElement;
  return {logo, wing};
}

/** jsdom has no AnimationEvent, so React listens for the WebKit-prefixed event name there. */
function finishFlapBeat(wing: SVGGElement) {
  fireEvent(wing, new Event('webkitAnimationIteration', {bubbles: true}));
}

describe('HeaderLogo', () => {
  afterEach(() => {
    cleanup();
  });

  it('flaps while the mouse is over it and stops once the current beat finishes', () => {
    const {logo, wing} = renderLogo();
    expect(logo.classList.contains('eagle-flap')).toBe(false);

    fireEvent.pointerEnter(logo, {pointerType: 'mouse'});
    expect(logo.classList.contains('eagle-flap')).toBe(true);

    finishFlapBeat(wing);
    expect(logo.classList.contains('eagle-flap')).toBe(true);

    fireEvent.pointerLeave(logo, {pointerType: 'mouse'});
    expect(logo.classList.contains('eagle-flap')).toBe(true);

    finishFlapBeat(wing);
    expect(logo.classList.contains('eagle-flap')).toBe(false);
  });

  it('does not flap on touch', () => {
    const {logo} = renderLogo();
    fireEvent.pointerEnter(logo, {pointerType: 'touch'});
    expect(logo.classList.contains('eagle-flap')).toBe(false);
  });

  it('gives each logo its own clip-path ids', () => {
    const {container} = render(
      <>
        <HeaderLogo />
        <HeaderLogo compact />
      </>,
    );
    const ids = Array.from(container.querySelectorAll('[id]'), (el) => el.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
