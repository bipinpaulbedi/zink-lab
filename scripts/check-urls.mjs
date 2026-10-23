import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const redirects = readFileSync('public/_redirects', 'utf8')
  .split('\n')
  .map((line) => line.trim().split(/\s+/))
  .filter(([from, , status]) => from?.startsWith('/') && status === '301');
const targetFile = (path) =>
  path === '/'
    ? 'dist/index.html'
    : join('dist', path.endsWith('/') ? `${path}index.html` : path);
const moved = (path) => redirects.find(([from]) => from === path)?.[1];
function resolveFile(path) {
  const target = moved(path) ?? path;
  const file = targetFile(target);
  assert.ok(existsSync(file), `Missing local URL: ${path}`);
  return file;
}
const htmlFiles = readdirSync('dist', { recursive: true }).filter((file) =>
  file.endsWith('.html'),
);
for (const path of htmlFiles) {
  const html = readFileSync(join('dist', path), 'utf8');
  for (const [, href] of html.matchAll(/\bhref="([^"\n]*)"/g)) {
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const url = new URL(
      href.replaceAll('&amp;', '&'),
      new URL(
        path.endsWith('index.html') ? path.slice(0, -10) : path,
        'https://local.invalid/',
      ),
    );
    if (url.origin !== 'https://local.invalid') continue;
    const file = resolveFile(decodeURIComponent(url.pathname));
    if (url.hash && file.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1)).replaceAll(
        '"',
        '&quot;',
      );
      assert.ok(
        readFileSync(file, 'utf8').includes(`id="${id}"`),
        `Missing anchor: ${href} in ${path}`,
      );
    }
  }
}
console.log(`Local links and anchors passed (${htmlFiles.length} HTML files).`);
if (process.env.LIVE_SITE_URL) {
  const origin = new URL(process.env.LIVE_SITE_URL).origin;
  async function sitemap(url) {
    const response = await fetch(url);
    assert.ok(
      response.ok,
      `Cannot read live sitemap: ${url} (${response.status})`,
    );
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
      m[1].replaceAll('&amp;', '&'),
    );
    for (const location of locations) {
      assert.equal(
        new URL(location).origin,
        origin,
        'Sitemap must stay on the configured site',
      );
      if (xml.includes('<sitemapindex')) await sitemap(location);
      else resolveFile(new URL(location).pathname);
    }
  }
  await sitemap(new URL('/sitemap-index.xml', origin));
  console.log('Every live sitemap URL is built or permanently redirected.');
} else
  console.log(
    'Live URL comparison awaits the confirmed SITE_URL repository variable.',
  );
