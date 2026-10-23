import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Build isolated copies so invalid fixtures never modify an author's working content.
const root = realpathSync(mkdtempSync(join(tmpdir(), 'zink-content-')));
const cli = resolve('node_modules/astro/bin/astro.mjs');
const base = `---\ntype: note\ntitle: Verification fixture\ndescription: A verification entry for checking the portal schema and generated static routes.\nstage: abstract\ncreated: 2026-10-21\ntopics: [portal]\n---\n\n## First heading\n\nA verification entry.\n\n## Second heading\n\nMore text.\n`;
function entry(id, body = base) {
  const folder = join(root, 'src/content/portal', id);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'index.md'), body);
}
function build(preview = false) {
  rmSync(join(root, '.astro'), { recursive: true, force: true });
  rmSync(join(root, 'dist'), { recursive: true, force: true });
  return spawnSync(process.execPath, [cli, 'build', '--root', root], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SHOW_DRAFTS: String(preview) },
  });
}
function succeeds(preview = false) {
  const r = build(preview);
  assert.equal(r.status, 0, r.stdout + r.stderr);
}
function latestCard() {
  return (
    readFileSync(join(root, 'dist/index.html'), 'utf8').match(
      /<article[^>]*aria-labelledby="latest-entry"[\s\S]*?<\/article>/,
    )?.[0] ?? ''
  );
}
try {
  for (const name of [
    'src',
    'public',
    'astro.config.mjs',
    'package.json',
    'tsconfig.json',
  ])
    cpSync(name, join(root, name), { recursive: true });
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  // Keep virtual Astro module paths inside this isolated root when sharing dependencies.
  const configPath = join(root, 'astro.config.mjs');
  writeFileSync(
    configPath,
    readFileSync(configPath, 'utf8').replace(
      'defineConfig({',
      'defineConfig({ vite: { resolve: { preserveSymlinks: true } },',
    ),
  );

  rmSync(join(root, 'src/content/portal'), { recursive: true, force: true });
  mkdirSync(join(root, 'src/content/portal'), { recursive: true });
  const cases = [
    ['topics', base, /reserved route/i],
    ['concepts', base, /reserved route/i],
    ['notes', base, /reserved route/i],
    ['miscellaneous', base, /reserved route/i],
    ['verification', base.replace('type: note', 'type: modal'), /type/],
    ['feed', base, /redirected old slug/i],
    ['Invalid_Slug', base, /kebab-case/i],
    ['verification', base.replace('type: note', 'type: unknown'), /type/],
    [
      'verification',
      base.replace('stage: abstract', 'stage: unknown'),
      /stage/,
    ],
    [
      'verification',
      base.replace('[portal]', '[unknown-topic]'),
      /unknown-topic/,
    ],
    [
      'verification',
      base.replace('type: note', 'type: experiment'),
      /epistemic/,
    ],
    [
      'verification',
      base.replace('type: note', 'type: experiment\nepistemic: "   "'),
      /epistemic/,
    ],
    [
      'verification',
      base.replace('created: 2026-10-21', 'created: invalid'),
      /created/,
    ],
    [
      'verification',
      base.replace(
        'created: 2026-10-21',
        'created: 2026-10-21\nupdated: 2026-01-01',
      ),
      /updated must not be earlier/,
    ],
    ['verification', base.replace('topics: [portal]', 'topics: []'), /topics/],
    [
      'verification',
      base.replace(
        'topics: [portal]',
        'topics: [portal]\ncover:\n  src: ./cover.png\n  alt: ""',
      ),
      /alt/,
    ],
  ];
  for (const [id, body, cause] of cases) {
    entry(id, body);
    if (body.includes('src: ./cover.png'))
      cpSync(
        'public/og-default.png',
        join(root, 'src/content/portal', id, 'cover.png'),
      );
    const r = build();
    assert.notEqual(r.status, 0, `${id} should fail`);
    assert.match(r.stdout + r.stderr, cause);
    rmSync(join(root, 'src/content/portal', id), { recursive: true });
    console.log(`Rejected: ${id} (${cause.source})`);
  }
  // Empty sections and an entirely empty portal must still generate navigation targets.
  succeeds();
  assert.equal(latestCard(), '');
  for (const section of [
    'notes',
    'experiments',
    'concepts',
    'miscellaneous',
    'vault',
  ])
    assert.ok(existsSync(join(root, 'dist', section, 'index.html')));
  for (let i = 1; i <= 21; i++) entry(`verification-${i}`);
  entry(
    'verification-draft',
    base
      .replace('stage: abstract', 'stage: accepted\ndraft: true')
      .replace('created: 2026-10-21', 'created: 2026-10-26'),
  );
  entry(
    'verification-newest',
    base.replace('created: 2026-10-21', 'created: 2026-10-22'),
  );
  entry(
    'verification-updated',
    base.replace(
      'created: 2026-10-21',
      'created: 2026-10-21\nupdated: 2026-10-23',
    ),
  );
  entry('verification-target', base.replace('type: note', 'type: concept'));
  entry(
    'verification-links',
    base + '\n[Real link](/verification-target/#first-heading)\n',
  );
  entry(
    'verification-code',
    base +
      '\n```md\n[Not a link](/verification-target/)\n```\n\n`[Not a link](/verification-target/)`\n\n![Not a link](/verification-target/)\n',
  );
  entry(
    'verification-image',
    base.replace(
      'topics: [portal]',
      'topics: [portal]\ncover:\n  src: ./cover.png\n  alt: A sample cover',
    ) + '\n![A sample body image](./cover.png)\n',
  );
  cpSync(
    'public/og-default.png',
    join(root, 'src/content/portal/verification-image/cover.png'),
  );
  succeeds();
  assert.match(latestCard(), /href="\/verification-updated\/"/);
  assert.match(latestCard(), /2026-10-23/);
  const imageHtml = readFileSync(
    join(root, 'dist/verification-image/index.html'),
    'utf8',
  );
  assert.match(imageHtml, /\.webp/);
  assert.match(imageHtml, /srcset=/);
  assert.match(imageHtml, /fetchpriority="high"/);
  assert.match(imageHtml, /alt="A sample body image"/);
  assert.ok(existsSync(join(root, 'dist/notes/2/index.html')));
  const target = readFileSync(
    join(root, 'dist/verification-target/index.html'),
    'utf8',
  ).split('aria-label="Connections"')[1];
  assert.ok(target.includes('href="/verification-links/"'));
  assert.ok(
    !target.split('Growing nearby')[0].includes('href="/verification-code/"'),
  );
  assert.ok(!existsSync(join(root, 'dist/verification-draft/index.html')));
  entry(
    'verification-newest',
    base.replace('created: 2026-10-21', 'created: 2026-10-25'),
  );
  succeeds();
  assert.match(latestCard(), /href="\/verification-newest\/"/);
  assert.match(latestCard(), /2026-10-25/);
  succeeds(true);
  assert.match(latestCard(), /href="\/verification-draft\/"/);
  assert.ok(existsSync(join(root, 'dist/verification-draft/index.html')));
  for (const name of readdirSync(join(root, 'dist'), {
    recursive: true,
  }).filter((p) => p.endsWith('.html'))) {
    assert.match(
      readFileSync(join(root, 'dist', name), 'utf8'),
      /name="robots" content="noindex, nofollow"/,
    );
  }
  console.log(
    'Passed: empty sections, pagination, backlinks, production drafts and preview noindex.',
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
