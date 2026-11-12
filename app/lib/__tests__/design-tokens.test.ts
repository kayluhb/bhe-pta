import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

describe('design tokens', () => {
  it('defines bhe theme colors and fonts in app.css', () => {
    const css = readFileSync(resolve('app/app.css'), 'utf8');
    for (const needle of [
      '--color-bhe-green: #173d2e',
      '--color-bhe-gold: #f3b23c',
      '--color-bhe-paper: #f6f1e7',
      '--font-display:',
      '--font-body:',
      'Bricolage Grotesque',
      'Figtree',
    ]) {
      expect(css).toContain(needle);
    }
  });
});
