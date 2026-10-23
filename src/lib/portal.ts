import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from 'astro:env/server';

export type Entry = CollectionEntry<'portal'>;
export type Stage = Entry['data']['stage'];

/** Drafts render in `astro dev` and preview builds (SHOW_DRAFTS=true). They never render in production. */
export const showDrafts = import.meta.env.DEV || SHOW_DRAFTS;

export async function getPortal(): Promise<Entry[]> {
  return getCollection('portal', ({ data }) => showDrafts || !data.draft);
}

export const entryUrl = (entry: Entry) => `/${entry.id}/`;
export const lastUpdated = (entry: Entry) =>
  entry.data.updated ?? entry.data.created;
export const byUpdated = (a: Entry, b: Entry) =>
  lastUpdated(b).valueOf() - lastUpdated(a).valueOf();

// Backlinks support simple inline links with plain labels and trailing-slash URLs.
// Keep code fences at the top level; nested code blocks and raw HTML are outside this subset.
const internalLink =
  /(?<!!|\\)\[[^\[\]\n]+\]\(\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(?:#[^)\s]*)?\)/g;

export function linksFrom(entry: Entry): string[] {
  let fence: string | undefined;
  const lines = (entry.body ?? '').split('\n').map((line) => {
    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)\s*$/)?.[1];
      if (closing && closing[0] === fence[0] && closing.length >= fence.length)
        fence = undefined;
      return '';
    }
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (opening && !(opening[1]![0] === '`' && opening[2]!.includes('`'))) {
      fence = opening[1];
      return '';
    }
    return /^(?: {4}|\t)/.test(line) ? '' : line;
  });
  let prose = lines.join('\n');
  // A code span closes only at a backtick run of the same length.
  const runs = [...prose.matchAll(/`+/g)];
  for (let i = 0; i < runs.length; i++) {
    const open = runs[i]!;
    const closeIndex = runs.findIndex(
      (run, j) => j > i && run[0].length === open[0].length,
    );
    if (closeIndex < 0) continue;
    const end = runs[closeIndex]!.index! + runs[closeIndex]![0].length;
    const start = open.index!;
    prose = prose.slice(0, start) + ' '.repeat(end - start) + prose.slice(end);
    i = closeIndex;
  }
  return [...new Set([...prose.matchAll(internalLink)].map((m) => m[1]!))];
}

export function backlinks(portal: Entry[]): Map<string, Entry[]> {
  const inbound = new Map<string, Entry[]>();
  for (const from of portal) {
    for (const to of linksFrom(from)) {
      if (to !== from.id) inbound.set(to, [...(inbound.get(to) ?? []), from]);
    }
  }
  return inbound;
}

/** Entries with the most shared topics, then by latest revision. `skip` prevents repeated backlinks. */
export function related(
  entry: Entry,
  portal: Entry[],
  skip: Entry[] = [],
  limit = 4,
): Entry[] {
  const mine = new Set(entry.data.topics.map((t) => t.id));
  return portal
    .filter((other) => other.id !== entry.id && !skip.includes(other))
    .map((other) => ({
      other,
      shared: other.data.topics.filter((t) => mine.has(t.id)).length,
    }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || byUpdated(a.other, b.other))
    .slice(0, limit)
    .map(({ other }) => other);
}
