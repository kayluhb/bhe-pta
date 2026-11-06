import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

describe('design tokens', () => {
  it('defines bhe theme colors and fonts in app.css', () => {
    const css = readFileSync(resolve('app/app.css'), 'utf8');
    for (const needle of [
      '--color-bhe-green: #173D2E',
      '--color-bhe-gold: #F3B23C',
      '--color-bhe-paper: #F6F1E7',
      '--font-family-display:',
      '--font-family-body:',
      'Bricolage Grotesque',
      'Figtree',
    ]) {
      expect(css).toContain(needle);
    }
  });
});
