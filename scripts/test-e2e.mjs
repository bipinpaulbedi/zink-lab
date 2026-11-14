import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Exercise optional features without adding test content to the published site.
const root = realpathSync(mkdtempSync(join(tmpdir(), 'zink-e2e-')));
try {
  for (const name of [
    'src',
    'public',
    'scripts',
    'astro.config.mjs',
    'package.json',
    'tsconfig.json',
    'wrangler.jsonc',
  ])
    cpSync(name, join(root, name), { recursive: true });
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  writeFileSync(
    join(root, 'src/data/goodreads_library_export.csv'),
    'Book Id,Title,Author,Exclusive Shelf,My Rating,Date Read\n' +
      '1,A reader’s first book,Fixture Author,read,5,2026/10/01\n' +
      '2,A very long book title about understanding systems and following ideas across disciplines,Another Author,read,3,2025/03/01\n' +
      '3,An undated book,A Third Author,read,0,\n',
  );
  // Exercise a configured single-post embed without publishing fixture content.
  const sitePath = join(root, 'src/site.ts');
  writeFileSync(
    sitePath,
    readFileSync(sitePath, 'utf8').replace(
      /export const X_POST_URL: string =\s*'[^']*';/,
      "export const X_POST_URL: string = 'https://x.com/bipinpaulbedi/status/1234567890';",
    ),
  );
  const configPath = join(root, 'astro.config.mjs');
  writeFileSync(
    configPath,
    readFileSync(configPath, 'utf8').replace(
      'defineConfig({',
      'defineConfig({ vite: { resolve: { preserveSymlinks: true } },',
    ),
  );
  appendFileSync(
    join(root, 'src/content/topics.yaml'),
    '\n- id: e2e-astro\n  title: E2E Astro\n  description: Browser verification fixtures.\n- id: e2e-cloudflare\n  title: E2E Cloudflare\n  description: Static hosting verification fixtures.\n',
  );
  appendFileSync(
    join(root, 'src/content/series.yaml'),
    '\n- id: e2e-series\n  title: Browser verification\n  description: A series for isolated browser verification.\n',
  );
  for (const [id, type, title, extra, body] of [
    [
      'static-hosting-reference',
      'vault',
      'A small reference for static hosting',
      'video: aqz-KE-bpKQ\nseries:\n  id: e2e-series\n  part: 1',
      "```js\n// astro.config.mjs\nexport default { output: 'static' };\n```",
    ],
    [
      'revisit-the-assumptions',
      'concept',
      'Revisit the assumptions, not just the code',
      '',
      'Check assumptions before changing the code.',
    ],
    [
      'content-can-move-urls-can-stay',
      'miscellaneous',
      'Content can move. Its URL can stay.',
      '',
      'Keep a stable URL when moving content.',
    ],
    [
      'a-place-for-unfinished-ideas',
      'note',
      'A place for unfinished ideas',
      '',
      'An unfinished idea links to [an experiment](/testing-the-smallest-script/).',
    ],
    [
      'testing-the-smallest-script',
      'experiment',
      'Testing the smallest script',
      'epistemic: Verified with isolated browser fixtures.',
      'An experiment with metadata and incoming links.',
    ],
    [
      'draft-workbench',
      'note',
      'Draft workbench',
      'draft: true',
      'Private draft.',
    ],
  ]) {
    const folder = join(root, 'src/content/portal', id);
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      join(folder, 'index.md'),
      `---\ntype: ${type}\ntitle: ${title}\ndescription: An isolated browser fixture for checking navigation and static portal features.\nstage: abstract\ncreated: 2026-10-21\ntopics: [e2e-astro, e2e-cloudflare]\n${extra}\n---\n\n## First heading\n\n${body}\n\n## Second heading\n\nMore verification text.\n`,
    );
  }
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, SHOW_DRAFTS: 'false' },
  });
  if (build.status !== 0) process.exitCode = build.status ?? 1;
  else {
    const tests = spawnSync(
      process.execPath,
      [
        resolve('node_modules/@playwright/test/cli.js'),
        'test',
        ...process.argv.slice(2),
      ],
      {
        stdio: 'inherit',
        env: { ...process.env, E2E_ROOT: root },
      },
    );
    process.exitCode = tests.status ?? 1;
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
