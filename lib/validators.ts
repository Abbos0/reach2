export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const ALLOWED_FILE_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

export function getFileExtension(name: string): string {
  const trimmedName = name.trim();
  const extension = trimmedName.split('.').pop();
  return (extension ?? '').toLowerCase();
}

export function isAllowedExtension(name: string): boolean {
  return Object.hasOwn(ALLOWED_FILE_TYPES, getFileExtension(name));
}

export function isAllowedMimeType(mimeType: string): boolean {
  return Object.values(ALLOWED_FILE_TYPES).includes(mimeType.trim().toLowerCase());
}

export function validateFileDescriptor({
  name,
  mimeType,
  sizeBytes,
}: {
  name: string;
  mimeType: string;
  sizeBytes: number;
}): { ok: boolean; reason?: string; normalizedName?: string } {
  if (!name || !mimeType) {
    return { ok: false, reason: 'File metadata is incomplete' };
  }

  const normalizedName = name.trim();
  const expectedMimeType = ALLOWED_FILE_TYPES[getFileExtension(normalizedName)];

  if (/[\\/\u0000-\u001f]/.test(normalizedName) || normalizedName === '.' || normalizedName === '..') {
    return { ok: false, reason: 'File name is not allowed' };
  }

  if (!expectedMimeType || expectedMimeType !== mimeType.trim().toLowerCase()) {
    return { ok: false, reason: 'File type is not allowed' };
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: 'File exceeds the 20 MB limit' };
  }

  return { ok: true, normalizedName };
}
