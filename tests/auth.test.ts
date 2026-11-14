import assert from 'node:assert/strict';
import test from 'node:test';

import { hashSessionToken, readSessionToken } from '../lib/auth';

test('reads only a well-formed admin session cookie', () => {
  const token = 'a'.repeat(43);
  const request = new Request('https://reach2.example/api/private', {
    headers: { cookie: `theme=dark; reach2_session=${token}` },
  });

  assert.equal(readSessionToken(request), token);
  assert.equal(readSessionToken(new Request('https://reach2.example')), null);
  assert.equal(
    readSessionToken(new Request('https://reach2.example', { headers: { cookie: 'reach2_session=invalid' } })),
    null,
  );
});

test('stores a digest instead of the bearer session token', () => {
  const token = 'session-token';

  assert.equal(hashSessionToken(token), hashSessionToken(token));
  assert.notEqual(hashSessionToken(token), token);
});