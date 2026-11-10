/** @vitest-environment jsdom */
import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';

import {Button} from '~/components/ui/Button';

describe('Button', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders accent variant as a real button', () => {
    render(<Button variant="accent">Give now</Button>);
    expect(screen.getByRole('button', {name: 'Give now'})).toBeTruthy();
  });
});
