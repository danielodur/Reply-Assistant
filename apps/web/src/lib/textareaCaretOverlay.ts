type OverlayPosition = {
  left: number;
  top: number;
};

export function estimateReminderBubbleWidth(label: string): number {
  const text = String(label || '').trim();
  const estimated = 38 + text.length * 6.2;
  return Math.min(220, Math.max(76, estimated));
}

/** Nudge chip left so the correction text lines up with the word’s first letter. */
const CHIP_TEXT_INSET = 6;

const MIRROR_STYLE_PROPS = [
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-transform',
  'text-indent',
  'text-rendering',
  'padding',
  'border',
  'box-sizing',
  'tab-size',
] as const;

function parsePx(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Position for a floating chip under the anchored word, in coordinates relative to the
 * textarea’s padding edge (same origin as `position:absolute` siblings aligned to the textarea box).
 *
 * - Horizontal: aligns chip so its suggestion text roughly shares the same column as the word start.
 * - Vertical: just under the word (iOS-style): small uniform gap, not overlapping glyphs, not a full line below.
 */
export function measureTextareaOverlayPosition(
  textarea: HTMLTextAreaElement,
  text: string,
  anchorStartIndex: number,
  anchorIndex: number,
  bubbleWidth: number,
  /**
   * Extra gap below the line box bottom. Kept small — line-height already includes half-leading.
   */
  yGap = 4,
  minTop = 2,
): OverlayPosition {
  const safeAnchorStart = Math.max(0, Math.min(anchorStartIndex, text.length));
  const safeAnchorEnd = Math.max(safeAnchorStart, Math.min(anchorIndex, text.length));
  const styles = window.getComputedStyle(textarea);
  const fontSize = parsePx(styles.fontSize, 14);
  const lineHeight = parsePx(styles.lineHeight, fontSize * 1.4);
  /** Pull the chip up slightly: rect.bottom is the line box, not the glyph bottom (cf. tall line-height). */
  const leadingSlack = Math.max(0, lineHeight - fontSize) * 0.28;

  const mirror = document.createElement('div');
  const anchorSpan = document.createElement('span');
  anchorSpan.textContent = text.slice(safeAnchorStart, safeAnchorEnd);

  mirror.style.position = 'fixed';
  mirror.style.left = '-9999px';
  mirror.style.top = '0';
  mirror.style.visibility = 'hidden';
  mirror.style.pointerEvents = 'none';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordBreak = 'break-word';
  mirror.style.overflowWrap = 'break-word';
  mirror.style.width = `${textarea.clientWidth}px`;

  MIRROR_STYLE_PROPS.forEach(prop => {
    mirror.style.setProperty(prop, styles.getPropertyValue(prop));
  });

  mirror.append(document.createTextNode(text.slice(0, safeAnchorStart)));
  mirror.appendChild(anchorSpan);
  mirror.append(document.createTextNode(text.slice(safeAnchorEnd)));
  document.body.appendChild(mirror);

  const anchorRect = anchorSpan.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  let lineBottom = anchorRect.bottom;
  const lineTop = anchorRect.top;
  if (lineBottom <= lineTop + 0.5 || !Number.isFinite(lineBottom)) {
    lineBottom = lineTop + lineHeight;
  }

  const rawTop = lineBottom - mirrorRect.top - textarea.scrollTop + yGap - leadingSlack;

  const wordStartLeft = anchorRect.left - mirrorRect.left - textarea.scrollLeft;
  let rawLeft = wordStartLeft - CHIP_TEXT_INSET;

  mirror.remove();

  const edgePad = 3;
  let left = rawLeft;
  if (left < edgePad) left = edgePad;
  if (left + bubbleWidth > textarea.clientWidth - edgePad) {
    left = Math.max(edgePad, textarea.clientWidth - bubbleWidth - edgePad);
  }

  const contentTop = Math.max(minTop, rawTop);

  return {
    left: left + textarea.clientLeft + textarea.offsetLeft,
    top: contentTop + textarea.clientTop + textarea.offsetTop,
  };
}
