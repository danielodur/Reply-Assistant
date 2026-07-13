export const PENDING_CAPTURE_DRAFT_KEY = 'replyAssistantPendingCaptureDraft';

export type PendingCaptureDraft = {
  text: string;
  createdAt: number;
};

export function savePendingCaptureDraft(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  localStorage.setItem(PENDING_CAPTURE_DRAFT_KEY, JSON.stringify({
    text: trimmed,
    createdAt: Date.now(),
  }));
}

export function consumePendingCaptureDraft(): PendingCaptureDraft | null {
  try {
    const raw = localStorage.getItem(PENDING_CAPTURE_DRAFT_KEY);
    localStorage.removeItem(PENDING_CAPTURE_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingCaptureDraft>;
    if (typeof parsed.text !== 'string' || !parsed.text.trim()) return null;
    if (typeof parsed.createdAt !== 'number' || !Number.isFinite(parsed.createdAt)) return null;

    return {
      text: parsed.text.trim(),
      createdAt: parsed.createdAt,
    };
  } catch {
    localStorage.removeItem(PENDING_CAPTURE_DRAFT_KEY);
    return null;
  }
}
