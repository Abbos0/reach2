import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isAllowedExtension,
  isAllowedMimeType,
  validateFileDescriptor,
} from '../lib/validators';

test('accepts standard document and media extensions', () => {
  assert.equal(isAllowedExtension('report.pdf'), true);
  assert.equal(isAllowedExtension('photo.jpg'), true);
  assert.equal(isAllowedExtension('video.mp4'), true);
});

test('rejects executable or dangerous extensions', () => {
  assert.equal(isAllowedExtension('script.exe'), false);
  assert.equal(isAllowedExtension('payload.php'), false);
  assert.equal(isAllowedExtension('archive.zip'), false);
});

test('validates MIME compatibility and size limits', () => {
  assert.equal(isAllowedMimeType('application/pdf'), true);
  assert.equal(isAllowedMimeType('text/plain'), false);

  const valid = validateFileDescriptor({
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 250_000,
  });

  assert.equal(valid.ok, true);

  const rejected = validateFileDescriptor({
    name: 'danger.php',
    mimeType: 'text/x-php',
    sizeBytes: 10_000_000,
  });

  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'File type is not allowed');
});

test('rejects mismatched MIME types and path-like names', () => {
  assert.equal(
    validateFileDescriptor({ name: 'invoice.pdf', mimeType: 'image/png', sizeBytes: 1000 }).ok,
    false,
  );
  assert.equal(
    validateFileDescriptor({ name: '../invoice.pdf', mimeType: 'application/pdf', sizeBytes: 1000 }).ok,
    false,
  );
});
