import { useEffect, useState } from 'react';
import type { UploadContextSummary } from './uploadTypes';
import { processUploads } from './uploadApi';
import { PROFILE_UPLOAD_LIMIT, validateUploadFile } from './uploadValidation';
import { domainIncludesContacts, onDataReset } from '../config/resetAppData';

const CONTACT_UPLOADS_KEY = 'replyAssistantContactUploads';
const CONTACT_UPLOADS_EVENT = 'replyAssistantContactUploadsChanged';

type ContactUploadMap = Record<string, UploadContextSummary[]>;

function loadContactUploads(): ContactUploadMap {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONTACT_UPLOADS_KEY) || '{}') as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const next: ContactUploadMap = {};
    let changed = false;
    Object.entries(parsed as ContactUploadMap).forEach(([contactId, uploads]) => {
      const normalized = Array.isArray(uploads) ? uploads.slice(0, PROFILE_UPLOAD_LIMIT) : [];
      next[contactId] = normalized;
      if (!Array.isArray(uploads) || uploads.length !== normalized.length) changed = true;
    });
    if (changed) {
      localStorage.setItem(CONTACT_UPLOADS_KEY, JSON.stringify(next));
    }
    return next;
  } catch {
    return {};
  }
}

export function useContactUploads() {
  const [uploadsByContact, setUploadsByContact] = useState<ContactUploadMap>(loadContactUploads);
  const [processingContactId, setProcessingContactId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const reload = () => setUploadsByContact(loadContactUploads());
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONTACT_UPLOADS_KEY) reload();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(CONTACT_UPLOADS_EVENT, reload);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CONTACT_UPLOADS_EVENT, reload);
    };
  }, []);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesContacts(domains)) {
        setUploadsByContact(loadContactUploads());
      }
    });
  }, []);

  const saveMap = (next: ContactUploadMap) => {
    localStorage.setItem(CONTACT_UPLOADS_KEY, JSON.stringify(next));
    setUploadsByContact(next);
    window.dispatchEvent(new Event(CONTACT_UPLOADS_EVENT));
  };

  const attachFiles = async (contactId: string, fileList: FileList | File[]) => {
    const current = uploadsByContact[contactId] ?? [];
    const remaining = Math.max(0, PROFILE_UPLOAD_LIMIT - current.length);
    const incoming = Array.from(fileList).slice(0, remaining);
    if (!incoming.length) return;
    const invalid = incoming.map(validateUploadFile).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    setProcessingContactId(contactId);
    setError('');
    try {
      const processed = await processUploads({ files: incoming, source: 'contact', contactId });
      const accepted = processed.filter(item => item.status !== 'failed');
      if (!accepted.length) {
        setError(processed[0]?.warnings?.[0] ?? 'Unable to attach files');
        return;
      }
      saveMap({
        ...uploadsByContact,
        [contactId]: [...current, ...accepted].slice(0, PROFILE_UPLOAD_LIMIT),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to attach files');
    } finally {
      setProcessingContactId(null);
    }
  };

  const removeUpload = (contactId: string, uploadId: string) => {
    saveMap({
      ...uploadsByContact,
      [contactId]: (uploadsByContact[contactId] ?? []).filter(item => item.id !== uploadId),
    });
  };

  return { uploadsByContact, processingContactId, error, attachFiles, removeUpload, setUploadsByContact: saveMap };
}
