import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { createServer } from 'node:net';

const server = spawn('npm', ['run', 'preview'], {
  stdio: 'pipe',
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
});
let chrome;
const reportDir = await mkdtemp(join(tmpdir(), 'zink-lighthouse-'));
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Wrangler did not become ready')),
      30000,
    );
    server.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Wrangler exited: ${code}`));
    });
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Ready on')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.stderr.on('data', (chunk) => process.stderr.write(chunk));
  });
  const socket = createServer();
  await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  chrome = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
  for (const path of ['/', '/static-hosting-reference/']) {
    const result = await lighthouse(`http://localhost:8788${path}`, {
      port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    if (!result) throw new Error('Lighthouse returned no result');
    await writeFile(
      join(reportDir, path === '/' ? 'home.json' : 'entry.json'),
      result.report,
    );
    for (const [name, category] of Object.entries(result.lhr.categories)) {
      console.log(`${path} ${name}: ${category.score}`);
      if (category.score === null || category.score < 0.95) {
        const failures = category.auditRefs
          .map((ref) => result.lhr.audits[ref.id])
          .filter((audit) => audit && audit.score !== null && audit.score < 1);
        console.error(
          JSON.stringify(
            failures.map((a) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              details: a.details,
            })),
            null,
            2,
          ),
        );
        process.exitCode = 1;
      }
    }
  }
  console.log(`Reports: ${reportDir}`);
} finally {
  await chrome?.close();
  server.kill('SIGTERM');
  // Reports remain available for inspection; Chrome removes its own temporary profile.
  if (!chrome) await rm(reportDir, { recursive: true, force: true });
}
