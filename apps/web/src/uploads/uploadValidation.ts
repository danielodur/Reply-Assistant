import type { UploadKind } from './uploadTypes';

export const COMPOSER_UPLOAD_LIMIT = 3;
export const PROFILE_UPLOAD_LIMIT = 3;
export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;
export const SUPPORTED_UPLOAD_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'heic', 'heif', 'csv', 'xlsx', 'pdf', 'docx', 'pptx'];

const EXTENSION_KIND: Record<string, UploadKind> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
  bmp: 'image',
  tif: 'image',
  tiff: 'image',
  heic: 'image',
  heif: 'image',
  csv: 'spreadsheet',
  xlsx: 'spreadsheet',
  pdf: 'pdf',
  docx: 'document',
  pptx: 'presentation',
};

export function getFileExtension(filename: string): string {
  const clean = filename.toLowerCase().trim();
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot + 1) : '';
}

export function getUploadKind(filename: string): UploadKind | null {
  return EXTENSION_KIND[getFileExtension(filename)] ?? null;
}

export function validateUploadFile(file: File): string | null {
  const isStandardImage = file.type.startsWith('image/');
  const hasKnownExtension = Boolean(getUploadKind(file.name));
  if (file.size === 0 && !hasKnownExtension && !isStandardImage) {
    return 'Choose a supported file, not a folder';
  }
  if (!hasKnownExtension && !isStandardImage) {
    return 'Unsupported file type';
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'File is larger than 15 MB';
  }
  return null;
}
