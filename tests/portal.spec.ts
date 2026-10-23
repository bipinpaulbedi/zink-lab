import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = process.env.E2E_ROOT ?? process.cwd();
const entryPaths = readdirSync(join(root, 'src/content/portal'))
  .filter(
    (id) =>
      !/^draft: true$/m.test(
        readFileSync(join(root, `src/content/portal/${id}/index.md`), 'utf8'),
      ),
  )
  .map((id) => `/${id}/`);
const routes = [
  '/',
  ...entryPaths,
  '/notes/',
  '/experiments/',
  '/concepts/',
  '/miscellaneous/',
  '/vault/',
  '/topics/',
  '/topics/e2e-astro/',
  '/series/e2e-series/',
  '/recent/',
  '/search/',
  '/missing-entry/',
];

for (const route of routes) {
  test(`${route} accessibility, privacy, security and budgets`, async ({
    page,
    context,
    request,
  }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (req) => requests.push(req.url()));
    page.on('pageerror', (err) => errors.push(err.message));
    await page.addInitScript(() => {
      (window as unknown as { cspViolations: string[] }).cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) =>
        (window as unknown as { cspViolations: string[] }).cspViolations.push(
          `${e.violatedDirective}: ${e.blockedURI}`,
        ),
      );
    });
    const response = (await page.goto(route))!;
    await page.waitForLoadState('networkidle');
    expect(response.status()).toBe(route === '/missing-entry/' ? 404 : 200);
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['strict-transport-security']).toContain(
      'max-age=63072000',
    );
    expect(response.headers()['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(response.headers()['permissions-policy']).toContain('camera=()');
    expect(response.headers()['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(
      requests.filter((url) => new URL(url).origin !== 'http://localhost:8788'),
    ).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(
      await page.evaluate(
        () => (window as unknown as { cspViolations: string[] }).cspViolations,
      ),
    ).toEqual([]);
    expect(errors).toEqual([]);
    const scripts = await page
      .locator('script:not([type="application/ld+json"])')
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          src: n.getAttribute('src'),
          text: n.textContent ?? '',
        })),
      );
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    if (route !== '/search/') expect(policy).not.toContain('wasm-unsafe-eval');
    for (const script of scripts.filter((s) => !s.src)) {
      expect(policy).toContain(
        `sha256-${createHash('sha256').update(script.text).digest('base64')}`,
      );
    }
    if (entryPaths.includes(route)) {
      expect(scripts.filter((s) => s.src)).toEqual([]);
      expect(
        scripts.reduce((sum, s) => sum + Buffer.byteLength(s.text), 0),
      ).toBeLessThanOrEqual(1536);
    }
    if (route !== '/search/')
      expect(requests.some((url) => url.includes('/pagefind/'))).toBe(false);
    const styles = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLLinkElement).href));
    let cssBytes = 0;
    for (const url of styles) {
      const stylesheet = await request.get(url);
      expect(stylesheet.ok()).toBe(true);
      if (url.includes('/_astro/'))
        expect(stylesheet.headers()['cache-control']).toContain('immutable');
      cssBytes += gzipSync(await stylesheet.body()).byteLength;
    }
    cssBytes += gzipSync(
      (await page.locator('style').allTextContents()).join('\n'),
    ).byteLength;
    expect(cssBytes).toBeLessThanOrEqual(15 * 1024);
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to content' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
}

test('theme toggle supports keyboard and survives navigation', async ({
  page,
}) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Mode' });
  const pressed = await toggle.getAttribute('aria-pressed');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute(
    'aria-pressed',
    String(pressed !== 'true'),
  );
  await page.goto('/topics/');
  await expect(toggle).toHaveAttribute(
    'aria-pressed',
    String(pressed !== 'true'),
  );
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', pressed!);
});

test('search returns entries and filters by section, stage and topic', async ({
  page,
}) => {
  await page.goto('/search/');
  await page.getByRole('searchbox').fill('static');
  await expect(page.locator('pagefind-results a').first()).toBeVisible();
  for (const [label, value] of [
    ['Section', 'Vault'],
    ['Growth stage', 'abstract'],
    ['Topic', 'E2E Cloudflare'],
  ] as const) {
    await page.getByRole('combobox', { name: label }).click();
    await page.getByRole('option', { name: new RegExp(value, 'i') }).click();
    await page.keyboard.press('Escape');
  }
  await expect(page.locator('pagefind-results')).toContainText(
    'A small reference for static hosting',
  );
  await expect(
    page.locator('pagefind-results a[href="/static-hosting-reference/"]'),
  ).toHaveCount(1);
  await page.getByRole('searchbox').fill('nonexistentzzzzzz');
  await expect(page.locator('pagefind-summary')).toContainText(/no results/i);
});

for (const { label, path, entry, title, query } of [
  {
    label: 'Concepts',
    path: '/concepts/',
    entry: '/revisit-the-assumptions/',
    title: 'Revisit the assumptions, not just the code',
    query: 'assumptions',
  },
  {
    label: 'Miscellaneous',
    path: '/miscellaneous/',
    entry: '/content-can-move-urls-can-stay/',
    title: 'Content can move. Its URL can stay.',
    query: 'stable',
  },
  {
    label: 'Notes',
    path: '/notes/',
    entry: '/a-place-for-unfinished-ideas/',
    title: 'A place for unfinished ideas',
    query: 'unfinished',
  },
] as const) {
  test(`${label} navigation, entry labels and search filters stay connected`, async ({
    page,
  }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', {
      name: 'Primary',
      exact: true,
    });
    const sectionLink = navigation.getByRole('link', {
      name: label,
      exact: true,
    });
    await expect(sectionLink).toHaveAttribute('href', path);
    await expect(
      page.locator('.section-card__link').filter({ hasText: label }),
    ).toHaveAttribute('href', path);
    await sectionLink.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(sectionLink).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(label);
    await page.getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`${entry}$`));
    await expect(page.locator('[data-pagefind-filter="section"]')).toHaveText(
      label,
    );
    await expect(
      page.locator('[data-pagefind-filter="section"]'),
    ).toHaveAttribute('href', path);
    await page.goto('/search/');
    await page.getByRole('searchbox').fill(query);
    await expect(page.locator('pagefind-results a').first()).toBeVisible();
    await page.getByRole('combobox', { name: 'Section' }).click();
    await page.getByRole('option', { name: new RegExp(`^${label},`) }).click();
    await page.getByRole('heading', { level: 1 }).click();
    await expect(page.locator('pagefind-summary')).toContainText(/^1 result\b/);
    await expect(
      page.locator(`pagefind-results a[href="${entry}"]`),
    ).toHaveCount(1);
  });
}

test('copy code and activate video only on request', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (value: string) => {
          (window as unknown as { copied: string }).copied = value;
        },
      },
    }),
  );
  await page.goto('/static-hosting-reference/');
  await page.getByRole('button', { name: 'Copy code' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toContain("output: 'static'");
  await expect(page.locator('iframe')).toHaveCount(0);
  // Block the remote player after observing its activation URL; third-party playback is outside the privacy guarantee.
  let activated = false;
  await page.route('https://www.youtube-nocookie.com/**', (route) => {
    activated = true;
    return route.fulfill({
      status: 200,
      body: '<html><body>Player test</body></html>',
    });
  });
  await page.getByRole('button', { name: /Play video/ }).click();
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    /^https:\/\/www.youtube-nocookie.com\/embed\//,
  );
  await expect.poll(() => activated).toBe(true);
});

test('content metadata, backlinks and series are rendered', async ({
  page,
}) => {
  await page.goto('/testing-the-smallest-script/');
  await expect(page.getByText('Epistemic note.')).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'On this page' }),
  ).toBeVisible();
  await expect(
    page.getByRole('complementary', { name: 'Connections' }),
  ).toContainText('A place for unfinished ideas');
  await expect(
    page.getByRole('link', { name: 'See how this grew' }),
  ).toHaveAttribute('href', /\/commits\/main\/src\/content\/portal\//);
  await page.goto('/series/e2e-series/');
  await expect(
    page.getByRole('link', { name: 'A small reference for static hosting' }),
  ).toBeVisible();
});

test('production excludes drafts, preserves redirects and serves permanent URLs', async ({
  request,
}) => {
  const redirects = readFileSync(join(root, 'public/_redirects'), 'utf8')
    .split('\n')
    .filter((line) => /^\//.test(line))
    .map((line) => line.trim().split(/\s+/));
  expect(redirects.length).toBeGreaterThan(0);
  for (const [path, target, status] of redirects) {
    expect(status).toBe('301');
    const r = await request.get(path!, { maxRedirects: 0 });
    expect(r.status()).toBe(301);
    expect(r.headers()['location']).toBe(target);
  }
  expect((await request.get('/draft-workbench/')).status()).toBe(404);
  const feed = await (await request.get('/rss.xml')).text();
  expect(feed).not.toContain('Draft workbench');
  expect((feed.match(/<item>/g) ?? []).length).toBe(entryPaths.length);
  for (const path of entryPaths)
    expect((await request.get(path)).status()).toBe(200);
  const sitemap = readFileSync(join(root, 'dist/sitemap-0.xml'), 'utf8');
  expect(sitemap).toContain('/concepts/');
  expect(sitemap).toContain('/miscellaneous/');
  expect(sitemap).not.toContain('/modals/');
  expect(sitemap).not.toContain('/catch-all/');
  expect(sitemap).toContain('/notes/');
  expect(sitemap).not.toContain('/signals/');
  expect(sitemap).not.toContain('/search/');
  expect(sitemap).not.toContain('/draft-workbench/');
});

test('native navigation and video fallback work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await page.goto('http://localhost:8788/static-hosting-reference/');
  await expect(page.getByRole('button', { name: 'Mode' })).toBeHidden();
  await expect(
    page.getByRole('link', { name: /Watch .* on YouTube/ }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Primary', exact: true })
    .getByRole('link', { name: 'Topics' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Topic map', exact: true }),
  ).toBeVisible();
  await context.close();
});

test('narrow viewport and reduced motion remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/static-hosting-reference/', '/search/']) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator('body')
        .evaluate((el) => getComputedStyle(el).animationDuration),
    ).toBe('1e-05s');
  }
});

test('shared typography and homepage grids survive component CSS ordering', async ({
  page,
}) => {
  // These routes load different combinations of unlayered vendor styles.
  for (const route of ['/', '/topics/', '/search/']) {
    await page.goto(route);
    const toggle = page.getByRole('button', { name: 'Mode' });
    const font = await page
      .getByRole('navigation', { name: 'Primary', exact: true })
      .evaluate((el) => getComputedStyle(el).fontFamily);
    await expect(toggle).toHaveCSS('font-family', font);
    await expect(toggle).toHaveCSS('font-size', '12px');
  }
  for (const [width, columns] of [
    [1440, 3],
    [768, 2],
    [390, 1],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const grids = await page
      .locator('.section-grid, .l-entry-grid')
      .evaluateAll((els) =>
        els.map(
          (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
        ),
      );
    expect(grids.every((count) => count === columns)).toBe(true);
  }
});
