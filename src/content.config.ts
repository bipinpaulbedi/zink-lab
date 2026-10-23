import { readFileSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SECTIONS, SECTION_IDS } from './site';

// After changing section keys in site.ts, restart astro dev to reload its content schema.
// All entries use /<slug>/. These routes and build folders share the same flat URL space.
// Kebab-case excludes file names such as rss.xml.
const ROUTES = ['404', 'pagefind', 'recent', 'search', 'series', 'topics'];
const RESERVED = [...ROUTES, ...Object.values(SECTIONS).map((s) => s.path)];
// Do not reuse a retired slug. A _redirects rule has priority over a page at the same path.
const RETIRED =
  readFileSync('./public/_redirects', 'utf8')
    .match(/^\/[a-z0-9-]+(?=\/?\s)/gm)
    ?.map((s) => s.slice(1)) ?? [];
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const portal = defineCollection({
  // src/content/portal/<slug>/index.md -> /<slug>/ in all sections. The slug is permanent.
  // A note can become an experiment. The section is data and is not part of the URL.
  loader: glob({
    base: './src/content/portal',
    pattern: '*/index.md',
    generateId: ({ entry }) => {
      const slug = entry.split('/')[0]!;
      if (
        !kebab.test(slug) ||
        RESERVED.includes(slug) ||
        RETIRED.includes(slug)
      ) {
        throw new Error(
          `"${slug}" is not a valid portal slug: use kebab-case, no reserved route (${RESERVED.join(', ')}), no redirected old slug`,
        );
      }
      return slug;
    },
  }),
  schema: ({ image }) =>
    z
      .object({
        type: z.enum(SECTION_IDS), // intercropping: one portal, five sections
        title: z.string().min(1).max(90),
        description: z.string().min(50).max(160),
        stage: z.enum(['abstract', 'evolving', 'accepted']), // completion stage, visible to readers
        created: z.coerce.date(), // first published
        updated: z.coerce.date().optional(), // last significant revision
        topics: z.array(reference('topics')).min(1).max(5), // topography: each topic must exist
        epistemic: z.string().trim().min(1).max(160).optional(), // confidence, effort, sources; required for experiments
        draft: z.boolean().default(false), // unpublished: preview builds only; notes are published
        cover: z.object({ src: image(), alt: z.string().min(1) }).optional(),
        canonicalUrl: z.url().optional(),
        source: z.url().optional(), // target URL for a note or vault entry
        video: z
          .string()
          .regex(/^[\w-]{11}$/)
          .optional(), // YouTube ID; player loads only after a click
        series: z
          .object({
            id: reference('series'),
            part: z.number().int().positive(),
          })
          .optional(),
      })
      .refine((d) => !d.updated || d.updated >= d.created, {
        message: 'updated must not be earlier than created',
        path: ['updated'],
      })
      .refine((d) => d.type !== 'experiment' || Boolean(d.epistemic), {
        message:
          'an experiment needs an epistemic note: confidence and conditions that would change it',
        path: ['epistemic'],
      }),
});

const topics = defineCollection({
  loader: file('./src/content/topics.yaml'),
  schema: z.object({ title: z.string(), description: z.string().max(200) }),
});

const series = defineCollection({
  loader: file('./src/content/series.yaml'),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { portal, topics, series };
