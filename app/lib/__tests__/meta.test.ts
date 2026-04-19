import {describe, expect, it} from 'vitest';

import {mergeParentMeta} from '../meta';

describe('mergeParentMeta', () => {
  it('merges child meta over parent for overlapping keys', () => {
    const out = mergeParentMeta(
      [
        {
          meta: [
            {title: 'Parent'},
            {name: 'description', content: 'P'},
            {property: 'og:title', content: 'OG Parent'},
          ],
        },
      ],
      [{title: 'Child'}, {name: 'description', content: 'C'}],
    );
    expect(out.find((m) => 'title' in m && m.title === 'Child')).toBeTruthy();
    expect(
      out.find((m) => 'name' in m && m.name === 'description' && m.content === 'C'),
    ).toBeTruthy();
    expect(out.some((m) => 'property' in m && m.property === 'og:title')).toBe(true);
  });

  it('keeps parent entries the child does not override', () => {
    const out = mergeParentMeta(
      [{meta: [{name: 'twitter:card', content: 'summary'}]}],
      [{title: 'T'}],
    );
    expect(out.some((m) => 'name' in m && m.name === 'twitter:card')).toBe(true);
  });

  it('handles empty matches and child-only descriptors', () => {
    expect(mergeParentMeta([], [{title: 'Only'}])).toEqual([{title: 'Only'}]);
    expect(mergeParentMeta([undefined], [])).toEqual([]);
  });

  it('keeps parent link-style descriptors the child does not replace', () => {
    const out = mergeParentMeta(
      [{meta: [{href: '/x', rel: 'canonical', tagName: 'link'}]}] as Parameters<
        typeof mergeParentMeta
      >[0],
      [{title: 'Child'}],
    );
    expect(out.some((m) => 'href' in m && (m as {href?: string}).href === '/x')).toBe(true);
  });
});
