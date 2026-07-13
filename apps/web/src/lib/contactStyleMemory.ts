const STORAGE_PREFIX = 'replyAssistantContactStyle:';
const MAX_SAMPLES = 3;
const MAX_SAMPLE_LEN = 480;
const MIN_SAMPLE_LEN = 8;

type StyleStore = { samples: string[] };

function loadStore(contactId: string): StyleStore {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + contactId);
    if (!raw) return { samples: [] };
    const parsed = JSON.parse(raw) as { samples?: unknown };
    const samples = Array.isArray(parsed.samples)
      ? parsed.samples.map(s => String(s).trim()).filter(Boolean)
      : [];
    return { samples };
  } catch {
    return { samples: [] };
  }
}

/** Remember final text when the user edits away from the model draft; folded into the next request via snippet memory. */
export function appendContactStyleFromEdit(contactId: string, editedText: string): void {
  const slice = editedText.trim().slice(0, MAX_SAMPLE_LEN);
  if (slice.length < MIN_SAMPLE_LEN) return;

  const { samples } = loadStore(contactId);
  const next = [slice, ...samples.filter(s => s !== slice)].slice(0, MAX_SAMPLES);
  try {
    localStorage.setItem(STORAGE_PREFIX + contactId, JSON.stringify({ samples: next }));
  } catch {
    // ignore quota
  }
}

export function styleHintsAsSnippetMemory(contactId: string): { title: string; text: string }[] {
  const { samples } = loadStore(contactId);
  if (!samples.length) return [];
  return [
    {
      title: 'Phrasing you preferred (from your edits)',
      text: samples.slice(0, MAX_SAMPLES).join('\n---\n'),
    },
  ];
}

/** Returns up to MAX_SAMPLES raw voice samples for the contact — used by
 *  Phase 21a `buildVoiceProfile` to derive openers/sign-offs/cadence. */
export function getContactStyleSamples(contactId: string): string[] {
  return loadStore(contactId).samples.slice(0, MAX_SAMPLES);
}
