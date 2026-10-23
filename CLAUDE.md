@AGENTS.md

## Claude Code

- `docs/architecture.md` is organized into numbered sections. Read only the necessary section. Do not import it here.
- Before you change `astro.config.mjs`, `src/content.config.ts`, `src/site.ts`, `wrangler.jsonc`, or anything in `public/`, use plan mode. These files contain the CSP, schema, sections, and host rules.
- Before you add a dependency or break a hard rule, ask for permission. Propose the ADR text. Do not apply the change.
- Before you report that a change is complete, state which "Done means" commands you ran. Give their results.
- Put permanent project knowledge in `AGENTS.md`. Do not put it here. This lets all coding agents read it.