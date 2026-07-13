import { useCallback } from 'react';
import { computeGhostSuffix, tryCompleteWithGhostAtTab } from '../lib/typingAssist';

/**
 * Dictionary-backed ghost completion (end of text only) + Tab to accept.
 * Pass `null` to disable.
 */
export function useTypingAssist(bankKey: string | null) {
  const ghostSuffix = useCallback(
    (text: string, caret: number) => (bankKey == null ? '' : computeGhostSuffix(text, caret, bankKey)),
    [bankKey],
  );

  const tabComplete = useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
      text: string,
      caret: number,
    ): { next: string; nextCaret: number } | null =>
      bankKey == null ? null : tryCompleteWithGhostAtTab(e, text, caret, bankKey),
    [bankKey],
  );

  return { ghostSuffix, tabComplete };
}
