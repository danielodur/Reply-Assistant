type StoredSnippet = {
  id: string;
  title: string;
  text: string;
};

const SNIPPET_STORAGE_KEY = 'replyAssistantSnippets';

function parseStoredSnippets(raw: string | null): StoredSnippet[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredSnippet[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(item => ({
        id: String(item?.id ?? '').trim(),
        title: String(item?.title ?? '').trim(),
        text: String(item?.text ?? '').trim(),
      }))
      .filter(item => item.id.length > 0 && item.text.length > 0);
  } catch {
    return [];
  }
}

function buildSnippetTitle(text: string): string {
  const firstLine = text.split('\n').find(line => line.trim().length > 0)?.trim() ?? '';
  if (!firstLine) return 'Saved reply';

  return firstLine.length > 32 ? `${firstLine.slice(0, 32)}...` : firstLine;
}

export function saveGeneratedReplyAsSnippet(replyText: string): boolean {
  const text = String(replyText ?? '').trim();
  if (!text) return false;

  const existing = parseStoredSnippets(localStorage.getItem(SNIPPET_STORAGE_KEY));
  const hasDuplicate = existing.some(item => item.text === text);
  if (hasDuplicate) return false;

  const snippet: StoredSnippet = {
    id: `custom-${Date.now()}`,
    title: buildSnippetTitle(text),
    text,
  };

  const next = [
    ...existing,
    snippet,
  ];

  localStorage.setItem(SNIPPET_STORAGE_KEY, JSON.stringify(next));
  return true;
}