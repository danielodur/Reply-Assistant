import { useEffect, useMemo, useRef, useState } from 'react';
import { processUploads } from './uploadApi';
import type { UploadContextSummary } from './uploadTypes';
import { COMPOSER_UPLOAD_LIMIT, validateUploadFile } from './uploadValidation';

export function useComposerAttachments() {
  const [attachments, setAttachments] = useState<UploadContextSummary[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const attachmentsRef = useRef<UploadContextSummary[]>([]);

  const remainingSlots = Math.max(0, COMPOSER_UPLOAD_LIMIT - attachments.length);
  const attachedCount = attachments.length;
  const attachmentContext = useMemo(() => attachments.slice(0, COMPOSER_UPLOAD_LIMIT), [attachments]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(item => {
        if (item.localPreviewUrl) URL.revokeObjectURL(item.localPreviewUrl);
      });
    };
  }, []);

  const attachFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).slice(0, remainingSlots);
    if (!incoming.length) return false;

    const invalid = incoming.map(validateUploadFile).find(Boolean);
    if (invalid) {
      setError(invalid);
      return false;
    }

    setProcessing(true);
    setError('');
    try {
      const processed = await processUploads({ files: incoming, source: 'composer' });
      const accepted = processed.filter(item => item.status !== 'failed');
      if (!accepted.length) {
        setError(processed[0]?.warnings?.[0] ?? 'Unable to attach files');
        return false;
      }
      const withPreview = accepted.map((upload, index) => ({
        ...upload,
        localPreviewUrl: incoming[index]?.type.startsWith('image/')
          ? URL.createObjectURL(incoming[index])
          : undefined,
      }));
      setAttachments(prev => [...prev, ...withPreview].slice(0, COMPOSER_UPLOAD_LIMIT));
      return withPreview.length > 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to attach files');
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const removed = prev.find(item => item.id === id);
      if (removed?.localPreviewUrl) URL.revokeObjectURL(removed.localPreviewUrl);
      return prev.filter(item => item.id !== id);
    });
  };

  const clearAttachments = () => {
    attachments.forEach(item => {
      if (item.localPreviewUrl) URL.revokeObjectURL(item.localPreviewUrl);
    });
    setAttachments([]);
    setError('');
  };

  return {
    attachments,
    attachmentContext,
    attachedCount,
    remainingSlots,
    processing,
    error,
    attachFiles,
    removeAttachment,
    clearAttachments,
  };
}
