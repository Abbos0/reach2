import { config } from './config';

export function createUploadPlan({
  fileName,
  mimeType,
  sizeBytes,
}: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  return {
    ok: true,
    uploadMode: 'browser-direct-upload',
    blobTokenConfigured: Boolean(config.BLOB_READ_WRITE_TOKEN),
    fileName,
    mimeType,
    sizeBytes,
    maxBytes: 20 * 1024 * 1024,
    note: 'Use browser direct upload to Vercel Blob and only send the resolved URL to the secure worker route.',
  };
}
