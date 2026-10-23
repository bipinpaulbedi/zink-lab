// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bipinpaulbedi.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.endsWith('/search/') })],
  env: {
    schema: {
      // true only in preview builds; the Workers Builds preview command sets it
      SHOW_DRAFTS: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
    },
  },
  markdown: {
    // Sätteri remains the default processor: no `processor` override or plugins
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false, // CSS selects the theme with light-dark()
    },
  },
  image: {
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [640, 960, 1200],
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        'frame-src https://www.youtube-nocookie.com',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: {
        resources: ["'self'"], // Keep this. Otherwise, insertScriptResource() on a page removes it.
        // SHA-256 of the inline script in src/components/ThemeInit.astro. Any CSP violation causes CI failure.
        hashes: ['sha256-WFV5CGAhIjttYr+w3I/IwiROnjgt2MLXBxmNb9oMRwg='],
      },
      styleDirective: {
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'unsafe-inline'", kind: 'attribute' }, // Shiki's style attributes only (Astro 7.1+)
        ],
      },
    },
  },
});
