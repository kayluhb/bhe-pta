import type {MetaDescriptor} from 'react-router';

export const SITE_ORIGIN = 'https://bheeagles.com';

/**
 * Merge parent (root) meta with child route meta.
 * React Router v7 replaces parent meta entirely when a child exports `meta`.
 * This helper preserves parent OG tags etc. while letting the child override title/description.
 */
export function mergeParentMeta(
  matches: ({meta?: MetaDescriptor[]} | undefined)[],
  childMeta: MetaDescriptor[],
): MetaDescriptor[] {
  // Collect keys the child is setting so we can filter them from parent
  const childKeys = new Set<string>();
  for (const entry of childMeta) {
    if ('title' in entry) childKeys.add('title');
    if ('name' in entry && entry.name) childKeys.add(`name:${entry.name}`);
    if ('property' in entry && entry.property) childKeys.add(`property:${entry.property}`);
    if ('tagName' in entry && entry.tagName === 'link' && 'rel' in entry && entry.rel) {
      childKeys.add(`link:${entry.rel}`);
    }
  }

  const parentMeta = matches.flatMap((match) => match?.meta ?? []);
  const filtered = parentMeta.filter((entry) => {
    if ('title' in entry) return !childKeys.has('title');
    if ('name' in entry && entry.name) return !childKeys.has(`name:${entry.name}`);
    if ('property' in entry && entry.property) return !childKeys.has(`property:${entry.property}`);
    if ('tagName' in entry && entry.tagName === 'link' && 'rel' in entry && entry.rel) {
      return !childKeys.has(`link:${entry.rel}`);
    }
    return true;
  });

  return [...filtered, ...childMeta];
}

type PageSeoOptions = {
  description: string;
  /** Pathname including leading slash, e.g. `/annual-fund` or `/`. */
  path: string;
  title: string;
  ogDescription?: string;
  ogTitle?: string;
};

/** Title, description, canonical, and Open Graph / Twitter overrides for a public page. */
export function pageSeoMeta(
  matches: ({meta?: MetaDescriptor[]} | undefined)[],
  options: PageSeoOptions,
): MetaDescriptor[] {
  const canonical =
    options.path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${options.path}`;
  const ogTitle = options.ogTitle ?? options.title;
  const ogDescription = options.ogDescription ?? options.description;

  return mergeParentMeta(matches, [
    {title: options.title},
    {content: options.description, name: 'description'},
    {content: ogTitle, property: 'og:title'},
    {content: ogDescription, property: 'og:description'},
    {content: canonical, property: 'og:url'},
    {content: 'summary_large_image', name: 'twitter:card'},
    {content: ogTitle, name: 'twitter:title'},
    {content: ogDescription, name: 'twitter:description'},
    {href: canonical, rel: 'canonical', tagName: 'link'},
  ]);
}
