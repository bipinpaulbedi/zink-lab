import { test, expect } from '@playwright/test';
test('production security headers', async ({ request }) => {
  test.skip(
    !process.env.BASE_URL,
    'Set BASE_URL only after the production domain is confirmed.',
  );
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(response.headers()['strict-transport-security']).toContain(
    'max-age=63072000',
  );
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['content-security-policy']).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers()['referrer-policy']).toBe(
    'strict-origin-when-cross-origin',
  );
  expect(response.headers()['permissions-policy']).toContain('camera=()');
});
