export type UploadSource = 'composer' | 'business-context' | 'contact';
export type UploadKind = 'image' | 'spreadsheet' | 'pdf' | 'document' | 'presentation';
export type UploadStatus = 'pending' | 'processing' | 'ready' | 'needs-review' | 'failed';

export type UploadContextSummary = {
  id: string;
  source: UploadSource;
  contactId?: string;
  filename: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  hash: string;
  status: UploadStatus;
  summary: string;
  extractedText: string;
  structuredPreview?: string;
  confidence: number;
  provider?: string;
  createdAt: number;
  expiresAt?: number;
  warnings?: string[];
  localPreviewUrl?: string;
};

export type UploadProcessRequestFile = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
};
