# Writing in the portal

These rules apply to all content under `src/content/`. The schema in `src/content.config.ts` enforces most rules. An invalid entry causes `npm run build` to fail and identify the field.

## Files

- Use one folder per entry: `src/content/portal/<slug>/index.md`. Put its images beside it. The entry uses `/<slug>/`, independent of section.
- The slug is permanent and uses kebab-case (`a-z`, `0-9`, single hyphens). Do not use a route name (`404`, `pagefind`, `recent`, `search`, `series`, `topics`). Do not use a section path (`notes`, `experiments`, `concepts`, `miscellaneous`, `vault`). Do not use a slug that `public/_redirects` already redirects.
- `topics.yaml` lists all permitted topics for entries. `series.yaml` lists multi-part series.

## Sections

`type` assigns an entry to one of five sections in `src/site.ts`. The section descriptions give the project's current interpretation. The summaries in that file give the same descriptions.

| `type` | List | Content |
| --- | --- | --- |
| `note` | `/notes/` | Short notes about observations, frequently with a `source` |
| `experiment` | `/experiments/` | Claims under test; `epistemic` is required |
| `concept` | `/concepts/` | Models to analyze a repeated type of problem |
| `miscellaneous` | `/miscellaneous/` | Mature content for discussion |
| `vault` | `/vault/` | Reference material, recorded talks, and entries that no longer receive updates |

## Frontmatter

| Field | Rule |
| --- | --- |
| `type` | Required: one of the five sections |
| `title` | Required: 1–90 characters |
| `description` | Required: 50–160 characters. Supplies the meta description and feed summary |
| `stage` | Required: `abstract` (initial, incomplete), `evolving` (revised and linked), or `accepted` (sufficiently complete, with continued maintenance) |
| `created` | Required: first-publication date, `YYYY-MM-DD` |
| `updated` | Date of the last significant revision. Must not precede `created` |
| `topics` | Required: 1–5 IDs from `topics.yaml` |
| `epistemic` | 1–160 characters after trimming, about confidence, effort, and sources. Required for an experiment; optional otherwise |
| `draft` | `true` prevents publication in production. Entries at any stage are published unless marked as drafts. Drafts are not published |
| `cover` | `src: ./cover.png` and nonempty `alt` text. Also supplies the Open Graph image |
| `canonicalUrl` | Only for an entry first published elsewhere |
| `source` | Target URL for a note or vault entry |
| `video` | An 11-character YouTube ID. The video appears above the body and loads only after a click |
| `series` | `id` from `series.yaml` and a `part` number |

## Terminology

Use “updated” for revisions and recency in all current and future entries. Preserve appropriate capitalization.

## Markdown

Use only plain Markdown. Do not use MDX or components. Avoid raw HTML. The CSP blocks inline `<script>`.

- Use `[text](/slug/)` or `[text](/slug/#heading)` to link to another entry. Use plain link labels without nested brackets. Only these simple inline link forms make "Linked from" backlinks; reference links do not. Keep code fences at the top level (not inside lists or blockquotes). Code spans, code blocks, and images do not make backlinks.
- Use a blockquote that starts with a bold phrase for a callout: `> **Heads up.** Text…`
- Use `![Alt text that says what it shows](./diagram.png)` for an image. Put the file beside `index.md`. Never leave the alt text empty. The build resizes images and makes WebP files.
- Specify a language for each code block. Put its file name in a first-line comment (`// astro.config.mjs`).
- Tables, task lists, footnotes, and strikethrough are supported. Start headings at `##`. The title is the page's `h1`. The table of contents uses `##` and `###` headings.

## Common changes

- **Create:** Make a new folder with `stage: abstract` and today's date for `created`. Add links to it from related entries.
- **Update:** Edit the entry. Set `updated` to today's date. When the entry is more complete, advance `stage`.
- **Move to another section:** Change `type`. The URL remains the same.
- **Rename or remove:** Add `/old-slug/   /new-slug/   301` at the top of the rules in `public/_redirects`, in the same change. For a removal, use the most closely related entry as the target. Never reuse the old slug.
- **New topic:** Add an `id`, `title`, and `description` to `topics.yaml`. The description must have a maximum of 200 characters.

Run `npm run build` to check the content. Do not use only `npm run check`, which does not detect unknown topics. Then use `npm run dev` to read the entry. Drafts are visible there.
