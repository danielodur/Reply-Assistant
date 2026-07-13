import type { UploadContextSummary, UploadProcessRequestFile, UploadSource } from './uploadTypes';

function getUploadEndpoints(): string[] {
  const endpointCandidates = window.desktopApp?.isElectron
    ? ['http://localhost:4011/api/uploads/process', 'http://localhost:4000/api/uploads/process', '/api/uploads/process']
    : ['/api/uploads/process', 'http://localhost:4000/api/uploads/process'];

  return [...new Set(endpointCandidates)];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',').pop() || '' : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

async function buildRequestFiles(files: File[]): Promise<UploadProcessRequestFile[]> {
  return Promise.all(files.map(async file => ({
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    dataBase64: await fileToBase64(file),
  })));
}

export async function processUploads(params: {
  files: File[];
  source: UploadSource;
  contactId?: string;
}): Promise<UploadContextSummary[]> {
  const requestFiles = await buildRequestFiles(params.files);
  const endpoints = getUploadEndpoints();
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: params.source,
          contactId: params.contactId,
          files: requestFiles,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data
          ? String((data as { error?: unknown }).error)
          : `HTTP ${response.status}`;
        throw new Error(message);
      }
      const uploads = data && typeof data === 'object' && Array.isArray((data as { uploads?: unknown }).uploads)
        ? (data as { uploads: UploadContextSummary[] }).uploads
        : null;
      if (!uploads) throw new Error('Upload API returned no summaries');
      return uploads;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');
    }
  }

  throw lastError ?? new Error('Upload failed');
}
