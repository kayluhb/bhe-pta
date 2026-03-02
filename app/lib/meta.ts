import type {MetaDescriptor} from 'react-router';

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
  }

  const parentMeta = matches.flatMap((match) => match?.meta ?? []);
  const filtered = parentMeta.filter((entry) => {
    if ('title' in entry) return !childKeys.has('title');
    if ('name' in entry && entry.name) return !childKeys.has(`name:${entry.name}`);
    if ('property' in entry && entry.property) return !childKeys.has(`property:${entry.property}`);
    return true;
  });

  return [...filtered, ...childMeta];
}
