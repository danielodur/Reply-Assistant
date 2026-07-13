import { useEffect, useState } from 'react';
import type { UploadContextSummary } from './uploadTypes';
import { processUploads } from './uploadApi';
import { PROFILE_UPLOAD_LIMIT, validateUploadFile } from './uploadValidation';
import { domainIncludesWorkContext, onDataReset } from '../config/resetAppData';

const BUSINESS_UPLOADS_KEY = 'replyAssistantBusinessUploads';
const BUSINESS_UPLOADS_EVENT = 'replyAssistantBusinessUploadsChanged';

function loadBusinessUploads(): UploadContextSummary[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BUSINESS_UPLOADS_KEY) || '[]') as unknown;
    const normalized = Array.isArray(parsed) ? (parsed as UploadContextSummary[]).slice(0, PROFILE_UPLOAD_LIMIT) : [];
    if (Array.isArray(parsed) && parsed.length !== normalized.length) {
      localStorage.setItem(BUSINESS_UPLOADS_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

export function useBusinessUploads() {
  const [uploads, setUploads] = useState<UploadContextSummary[]>(loadBusinessUploads);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const reload = () => setUploads(loadBusinessUploads());
    const onStorage = (event: StorageEvent) => {
      if (event.key === BUSINESS_UPLOADS_KEY) reload();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(BUSINESS_UPLOADS_EVENT, reload);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(BUSINESS_UPLOADS_EVENT, reload);
    };
  }, []);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesWorkContext(domains)) {
        setUploads(loadBusinessUploads());
      }
    });
  }, []);

  const saveUploads = (next: UploadContextSummary[]) => {
    const limited = next.slice(0, PROFILE_UPLOAD_LIMIT);
    localStorage.setItem(BUSINESS_UPLOADS_KEY, JSON.stringify(limited));
    setUploads(limited);
    window.dispatchEvent(new Event(BUSINESS_UPLOADS_EVENT));
  };

  const attachFiles = async (fileList: FileList | File[]) => {
    const remaining = Math.max(0, PROFILE_UPLOAD_LIMIT - uploads.length);
    const incoming = Array.from(fileList).slice(0, remaining);
    if (!incoming.length) return;
    const invalid = incoming.map(validateUploadFile).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const processed = await processUploads({ files: incoming, source: 'business-context' });
      const accepted = processed.filter(item => item.status !== 'failed');
      if (!accepted.length) {
        setError(processed[0]?.warnings?.[0] ?? 'Unable to attach files');
        return;
      }
      saveUploads([...uploads, ...accepted]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to attach files');
    } finally {
      setProcessing(false);
    }
  };

  const removeUpload = (id: string) => {
    saveUploads(uploads.filter(item => item.id !== id));
  };

  return { uploads, processing, error, attachFiles, removeUpload, setUploads: saveUploads };
}
