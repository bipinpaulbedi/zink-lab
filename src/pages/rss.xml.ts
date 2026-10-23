import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { entryUrl, getPortal } from '../lib/portal';
import { SECTIONS } from '../site';
export const GET: APIRoute = async ({ site }) =>
  rss({
    title: 'bipin paul bedi',
    description: 'thoughts, stories and ideas; in progress.',
    site: site!,
    items: (await getPortal())
      .sort((a, b) => b.data.created.valueOf() - a.data.created.valueOf())
      .map((e) => ({
        title: e.data.title,
        description: e.data.description,
        pubDate: e.data.created,
        link: entryUrl(e),
        categories: [SECTIONS[e.data.type].label, e.data.stage],
      })),
  });
