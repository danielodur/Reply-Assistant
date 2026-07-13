import type { ActionInboxRiskLevel } from './types';

function getUrgencyScore(followUp: string): number {
  const normalized = followUp.toLowerCase();

  if (normalized.includes('immediately') || normalized.includes('asap') || normalized.includes('today')) {
    return 1;
  }
  if (normalized.includes('24') || normalized.includes('tomorrow') || normalized.includes('next day')) {
    return 0.85;
  }
  if (normalized.includes('week')) {
    return 0.55;
  }
  return 0.4;
}

function getRiskScore(riskLevel: ActionInboxRiskLevel): number {
  if (riskLevel === 'high') return 1;
  if (riskLevel === 'medium') return 0.65;
  return 0.35;
}

export function computePriority(riskLevel: ActionInboxRiskLevel, followUp: string): number {
  const risk = getRiskScore(riskLevel);
  const urgency = getUrgencyScore(followUp);
  return Math.round((risk * 0.62 + urgency * 0.38) * 100);
}
