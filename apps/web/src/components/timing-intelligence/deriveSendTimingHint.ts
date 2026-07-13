import type { ContactMessageEntry } from '../../config/contactThreads';

/**
 * Phase 19 — Send-timing hint.
 *
 * Pure derivation of the contact's dominant inbound hour-of-day band from
 * their message timestamps. The intuition: the time of day they tend to
 * write to us is also the time of day they're likely to read our reply.
 * That's a much weaker claim than "send at this exact minute", so we keep
 * the report at the hour level and only surface it when we are *out of*
 * the band — otherwise the user is already in the right window and the
 * hint would just be noise.
 *
 * Returns `null` when:
 *  - Sample size is too small to claim a pattern
 *  - The dominant band is wide / shallow (no clear winner)
 *  - The user's current local hour already sits inside the band
 *
 * No timezone inference. The current local hour comes from the caller so
 * the function stays pure and testable.
 */

export const MIN_TIMING_SAMPLES = 4;
/** Dominant band counts must exceed this share of the total to count. */
export const DOMINANT_SHARE_THRESHOLD = 0.45;

export type SendTimingHint = {
  /** Hour-of-day (0..23) that's the centre of the recommended band. */
  recommendedHour: number;
  /** Band half-width — recommendedHour ± bandHalfWidth covers the cluster. */
  bandHalfWidth: number;
  /** Number of inbound messages contributing. */
  sampleSize: number;
};

function inboundHours(messages: readonly ContactMessageEntry[]): number[] {
  const hours: number[] = [];
  for (const msg of messages) {
    if (msg.direction !== 'inbound') continue;
    const d = new Date(msg.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    hours.push(d.getHours());
  }
  return hours;
}

function dominantBand(hours: readonly number[]): { centre: number; halfWidth: number; share: number } | null {
  if (hours.length === 0) return null;

  // Score each centre 0..23 by the count of samples within ±2 hours (5-hour
  // band) with wrap-around. Among ties (same count), pick the centre whose
  // total circular distance to the samples is smallest — that's the true
  // centre of mass, not an arbitrary first hit.
  let best = { centre: 0, count: 0, totalDist: Number.POSITIVE_INFINITY };
  for (let centre = 0; centre < 24; centre += 1) {
    let count = 0;
    let totalDist = 0;
    for (const h of hours) {
      const raw = Math.abs(h - centre);
      const dist = Math.min(raw, 24 - raw);
      if (dist <= 2) {
        count += 1;
        totalDist += dist;
      }
    }
    if (count > best.count || (count === best.count && totalDist < best.totalDist)) {
      best = { centre, count, totalDist };
    }
  }

  if (best.count === 0) return null;
  return { centre: best.centre, halfWidth: 2, share: best.count / hours.length };
}

function isInsideBand(currentHour: number, centre: number, halfWidth: number): boolean {
  const raw = Math.abs(currentHour - centre);
  const dist = Math.min(raw, 24 - raw);
  return dist <= halfWidth;
}

export function deriveSendTimingHint(
  messages: readonly ContactMessageEntry[] | null | undefined,
  currentHour: number,
): SendTimingHint | null {
  if (!messages) return null;
  const hours = inboundHours(messages);
  if (hours.length < MIN_TIMING_SAMPLES) return null;

  const band = dominantBand(hours);
  if (!band) return null;
  if (band.share < DOMINANT_SHARE_THRESHOLD) return null;

  if (isInsideBand(currentHour, band.centre, band.halfWidth)) {
    // Already in the right window — no hint needed.
    return null;
  }

  return {
    recommendedHour: band.centre,
    bandHalfWidth: band.halfWidth,
    sampleSize: hours.length,
  };
}
