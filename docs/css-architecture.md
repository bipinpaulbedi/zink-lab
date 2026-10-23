# CSS architecture

The portal combines cascade layers based on ITCSS, BEM component names, and Astro-scoped styles. It uses plain CSS and the existing spacing and type scales from Accessible Astro Components. It adds no dependencies. The visual design, theme palette, content model, and JavaScript budgets do not change.

## Files and precedence

`src/styles/global.css` is the shared entry point. `BaseLayout.astro` imports this file. The file contains only imports. For normal project declarations, later layers have higher priority. Selector specificity applies after layer precedence:

```css
@layer tokens, reset, base, layout, components, utilities;
```

| File or owner                               | Responsibility                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `styles/layers.css`                         | Defines the layer order. Import this file before rules in each independent CSS entry point.                     |
| `styles/tokens.css`                         | Defines semantic theme colors, font stacks, spacing, reading measure, shell geometry, radii, and motion.        |
| Existing library `space.css` and `font.css` | Supply fluid spacing and type scales. Import these files into `tokens` before the project tokens.               |
| `styles/base.css`                           | Contains the minimum box-sizing reset and native element defaults in `reset` / `base`.                          |
| `styles/layout.css`                         | Contains the reusable shell, main spacing, inline lists, and entry grids in `layout`.                           |
| `styles/patterns.css`                       | Contains shared typography, page introductions, section headings, text links, and empty states in `components`. |
| `styles/entry-card.css`                     | Contains the shared card block. `EntryCard.astro` and the topic index import this file explicitly.              |
| `styles/utilities.css`                      | Contains three small text utilities and rules for hidden elements and reduced motion.                           |
| `styles/vendor.css`                         | Contains the documented unlayered adapter for native button typography.                                         |
| `BaseLayout.astro`                          | Contains scoped styles for the header, navigation, wordmark, skip link, and footer.                             |
| `pages/index.astro`                         | Contains scoped styles for the hero, section cards, topic map, growth note, and homepage grid modifier.         |
| `pages/[slug].astro`                        | Contains entry prose styles, styles for Markdown, code, and tables, and the connection layout.                  |
| Component or route `<style>` blocks         | Contain styles for the theme toggle, metadata, video, series items, and search-filter layout.                   |

Each independent project stylesheet or scoped `<style>` imports `layers.css` before its `@layer components` block. Thus, the first stylesheet that Astro emits sets the same layer order. This order also applies if Astro emits CSS for a child component before CSS for the shell. Imports in global.css assign shared files to their layers. These shared files do not repeat the layer wrappers. `base.css` defines its two layers internally.

Keep media queries next to the rules that they control. The layout breakpoints stay at 850px and 560px. CSS custom properties do not work in media-query conditions. Keep these two values explicit. Do not add a preprocessor for these values.

## Naming and selectors

- Use descriptive kebab-case for blocks: `.section-card`, `.entry-card`, `.theme-toggle`.
- Use `block__element` for elements: `.section-card__title`, `.entry-card__meta`, `.site-header__link`. Do not connect element names in a chain such as `block__element__child`.
- Use `block--modifier` with the base class for modifiers: `growth-stage growth-stage--abstract`. Do not use a modifier alone.
- Use `l-` for reusable structural layouts: `.l-shell`, `.l-main`, `.l-inline-list`, `.l-entry-grid`.
- Use `u-` for utilities: `.u-small`, `.u-muted`, `.u-capitalize`. Add a utility only for a repeated need with a narrow definition.
- Use native attributes for state where available: `[aria-current]`, `[aria-pressed='true']`, and `[hidden]`. Use IDs for anchors and JavaScript hooks. Do not use IDs for styles.
- Use a single class in preference to a structural selector. You can use pseudo-classes and pseudo-elements for focus, hover, and stretched-link behavior. Use `:where()` if a structural match must add no specificity.
- Markdown has no component classes that the author supplies. Use a scoped root with explicit global descendants, for example `.entry-prose :global(h2)`. Do not use a bare global `h2`, `pre`, or `blockquote` rule for a requirement that applies only to entries.
- Use `:global()` only for rendered content, dynamically inserted elements such as the video iframe, and documented vendor adapters. Do not use it to bypass component ownership.

For example:

```astro
<style>
  @import '../../styles/layers.css';

  @layer components {
    .example-card__title {
      margin-block-end: var(--space-2);
      font-family: var(--font-ui);
    }
  }
</style>
```

The shared grid controls its columns and gaps. A page modifier sets `--grid-columns` and `--grid-gap`. It does not redefine `display`, repeat the grid template, or set styles for child cards. The mobile rule continues to give one column.

## Tokens and exceptions

Keep `light-dark()` colors in `tokens.css`. Keep the documented palette limit. Use `--font-ui`, `--font-body`, `--font-editorial`, and `--font-code` for font stacks. Use the existing fluid scales from the library where applicable. The fixed steps from `--space-1` through `--space-6` keep the existing geometry: 0.5, 1, 1.5, 2, 3, and 4rem, respectively. `--section-space` supplies the existing fluid section separation. You can keep local literal values for individual optical adjustments. Do not make every number a token. Do not add token variants that have no use.

Unlayered vendor CSS has higher priority than normal layered project declarations. Selector specificity does not change this priority. Thus, these three small adapters stay unlayered:

1. `vendor.css` restores native button typography after the global `font: inherit` reset from the package. This adapter excludes the library's `.badge` buttons. Its selector must have higher specificity than the vendor type selector, for any stylesheet order. The theme toggle supplies `--button-font-size` to avoid a conflict with that reset.
2. `GrowthStage.astro` adapts the existing Badge with `.growth-stage` and its modifiers. The vendor supplies the badge layout and size.
3. `search.astro` maps Pagefind's variables to project tokens. It also restores the inherited color-scheme after Pagefind's `all: initial`. The search-filter layout has a separate scope and layer.

Do not add ordinary UI rules to these adapters. The vendor continues to control Pagefind internals and the library's own classes. Do not edit package files. The only project `!important` rules enforce `[hidden]` and reduced motion. These rules also apply against unlayered vendor styles. Important declarations reverse layer precedence. Do not use them for routine overrides.

## Verification and future work

Run the checks that `AGENTS.md` requires: check, production build, and HTML validation. Also run browser tests for each stylesheet or template change. Browser tests cover both themes, keyboard access, mobile overflow, reduced motion, privacy, CSP, and CSS budgets. When you change cascade ownership, also compare representative desktop, tablet, and mobile rendering. Axe and valid HTML alone cannot show that the appearance stays the same. Run Lighthouse if changes can affect loading or layout.

Keep the small vendor adapters until a supported package API lets you put upstream styles in a layer with lower priority. Consider an Astro component for a shared pattern only if repeated markup gives a reason to use one. The project does not currently require a new linter, CSS framework, preprocessing pipeline, or complete utility set.
