# AGENTS.md

This is a static website. This checkout contains the Astro portal implementation; the commands and file locations below describe it. Astro 7 builds each page from plain Markdown. An assets-only Cloudflare Worker serves the files. There is no server code. `docs/architecture.md` contains the decisions and reasons for the rules below. Before you change a recorded decision, read the applicable section.

## Commands

- `npm ci`: installs the exact versions in the lockfile. Install scripts never run (`.npmrc`).
- `npm run dev`: starts the Astro development server on http://localhost:4321 with drafts visible.
- `npm run build`: runs `astro build`, then makes the Pagefind index in `dist/`. Drafts are not included.
- `SHOW_DRAFTS=true npm run build`: makes a preview build with drafts and `noindex` on each page.
- `npm run preview`: serves `dist/` with `wrangler dev` on http://localhost:8788. Uses production routing, `_headers`, and `_redirects`.
- `npm run check`: runs `astro check`, then `prettier --check .`
- `npm run format`: Prettier writes formatted files. It never reformats `src/content` or `docs/architecture.md`.
- `npm run test:links`: checks built local links and anchors; compares live sitemap URLs when `LIVE_SITE_URL` is set.
- `npm run test:content`: runs isolated build fixtures for schema rejection, draft visibility, images, pagination, and backlinks.
- `npm run test:html`: runs html-validate on `dist/`. Run the build first.
- `npm run test:e2e`: builds a temporary site copy with current content and feature fixtures, then runs the `tests/` Playwright and axe suite with `wrangler dev` in both themes. Requires port 8788 to be free; leaves working content and production `dist/` unchanged.
- `npm run test:perf`: runs Lighthouse mobile tests. Each category must be ≥ 0.95 (`scripts/lighthouse.mjs`).

**Done means:** `npm run check && npm run build && npm run test:html` must pass. After changes to templates, styles, scripts, headers, or redirects, `npm run test:e2e` must also pass. Always run the build. `astro check` accepts an unknown topic. Only `astro build` rejects it.

## File locations

- `src/content.config.ts`: contains the schema, reserved route names (`ROUTES`), and redirected slugs from `public/_redirects`.
- `src/site.ts`: contains the five portal sections (`SECTIONS`) and repository URL. The schema, navigation, section lists, and reserved slugs all use `SECTIONS`.
- `src/styles/global.css`: imports the shared CSS layers. `docs/css-architecture.md` defines BEM names, `l-` layouts, `u-` utilities, component-local styles, and vendor adapters. Read it before changing CSS ownership or layer order.
- `src/lib/portal.ts`: contains the draft filter, entry URLs, last-updated sequence, backlinks, and related entries.
- `src/pages/[slug].astro`: supplies the route for all entries. `src/pages/[section]/[...page].astro`: supplies all five section lists.
- `src/content/`: contains entries, `topics.yaml`, and `series.yaml`. `src/content/AGENTS.md` contains the authoring rules.
- `astro.config.mjs`: contains the CSP, Shiki themes, image layout, and `SHOW_DRAFTS` environment field.
- `public/_headers`, `public/_redirects`: contain host rules. `wrangler.jsonc`: defines the Worker, which has no `main` script.

## Hard rules

Before you break a rule, get human agreement. Record the change as an ADR in `docs/architecture.md`.

- **Dependencies:** The project has 14 direct packages, four more than the brief's target of 10. Do not add, replace, or remove a package. Versions are pinned exactly. Dependabot proposes updates. Do not bypass `.npmrc` (`ignore-scripts`, `min-release-age=7`, `engine-strict`).
- **Static only:** Do not use an adapter, `export const prerender = false`, a Worker script, a `functions/` directory, or an `experimental.*` flag.
- **Markdown only:** Entries use `.md`. Do not use MDX, a `markdown.processor` override, or remark, rehype, or Sätteri plugins (ADR-3).
- **JavaScript:** Use no JavaScript by default. The permitted scripts are theme initialization (inline with a hash), theme toggle, copy button, and video loader. Include the copy button only in entries with code. Include the video loader only in entries with `video`. Each entry page has a maximum of 1.5 KB of inline script and no `<script src>`. Load Pagefind's UI only on `/search/`.
- **CSS:** Use a maximum of 15 KB gzip of render-blocking CSS per page (provisional estimate: 11.0 KB on entries and lists). Do not use a CSS framework or compiler. Use `light-dark()` tokens for colors.
- **Privacy:** The public site must use no first-party cookies or analytics scripts, and make no third-party requests before explicit video activation. Load the `youtube-nocookie.com` player only after a click; third-party player requests and storage after activation are outside this guarantee. Cloudflare Access authentication on private previews is separate.
- **Security:** `security.csp` in `astro.config.mjs` supplies CSP hashes in a meta tag. `public/_headers` supplies additional CSP rules. Never permit `'unsafe-inline'` scripts. Only `/search/` adds exceptions to its own policy. The project has no secrets. Never add a secret.
- **Accessibility:** Meet WCAG 2.2 AA in light and dark themes. Use one `h1` per page, landmarks, visible focus, and native links and buttons. Do not use color as the only means to give information. Stage badges show text.
- **URLs never break:** Each entry uses `/<slug>/` with a trailing slash. If you rename or remove an entry, add a 301 line to `public/_redirects` in the same change. Never delete a redirect line. The schema rejects a redirected slug.
- **UI library:** Use only `Badge` and `Pagination` from Accessible Astro Components. Do not use `Card`, `DarkMode`, `SkipLink`, `Video`, or `Notification`. The default image for Card uses `placehold.co`, which causes a third-party request.

## Terminology

Use “updated” consistently for revisions and recency in documentation, interface labels, code examples, and future content. Preserve appropriate capitalization.

## Common changes

- **Theme initialization script** (`src/components/ThemeInit.astro`): `astro.config.mjs` lists the SHA-256 hash of its exact text under `scriptDirective.hashes`. After you edit the script, print the new hash. Replace the old hash in the same change:

  ```sh
  node -e "const s=require('fs').readFileSync('src/components/ThemeInit.astro','utf8').match(/<script is:inline>([\s\S]*?)<\/script>/)[1];console.log('sha256-'+require('crypto').createHash('sha256').update(s).digest('base64'))"
  ```

- **Other scripts:** Astro calculates hashes for the `<script>` tags that it processes. For an `is:inline` script, add its hash with the same method. Prefer processed scripts.
- **Sections:** Edit `SECTIONS` in `src/site.ts`. `path` is the plural, kebab-case list URL. A new path becomes a reserved slug. An existing entry with that slug causes build failure. If you rename a key, its entries must use the new `type` value. If you rename a `path`, its list moves. Add a 301 redirect for the old list URL.
- **New page route:** Add its first path segment to `ROUTES` in `src/content.config.ts`. This prevents an entry from using that segment.
- **Upgrades:** When CI passes, merge Dependabot's grouped weekly PRs. For an Astro major upgrade, use one PR and the official "Upgrade to vX" guide. Make no other changes in that PR. Keep TypeScript on 6.x until `@astrojs/check` accepts 7.
- **Documentation:** If a change makes this file or `src/content/AGENTS.md` incorrect, update the applicable file in the same change.

## Deployment

Workers Builds deploys from GitHub. `main` deploys to production (`npm run build && npx wrangler deploy`). Each other branch receives a Worker Preview with drafts (`SHOW_DRAFTS=true npm run build && npx wrangler preview`). Cloudflare Access protects these previews. CI has no Cloudflare token. Never run `wrangler deploy`, `wrangler preview`, or `wrangler rollback` yourself.

## Known behavior

- Each build shows a Shiki/CSP warning. This is expected. The `style-src-attr` scope in `astro.config.mjs` permits Shiki's style attributes.
- After changing section keys in `src/site.ts`, restart `npm run dev`. Astro loads the content schema separately and can retain old section types in the running server. A production build does not refresh that server. If an active server has stale types, edit `src/content.config.ts` or restart the server to reload its content schema.
- `wrangler preview` is open beta in Wrangler 4.149.0. If it fails, do not substitute `wrangler versions upload` automatically. Version URLs use a different workflow; follow the protected fallback procedure in `docs/architecture.md`. Do not upload drafts until Access protection for Version URLs is verified.
- Use Node 26.x (`.node-version` = 26; `engines.node` = `>=26.0.0 <27`) and npm 11.10 or later for `min-release-age`. Verify the bundled npm version before installing dependencies.

## Guideline

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
