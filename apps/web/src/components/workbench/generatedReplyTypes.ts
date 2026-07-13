export type ReplyVariantId = 'safe' | 'assertive' | 'strategic';

export type ReplyVariant = {
  id: ReplyVariantId;
  title: string;
  message: string;
  rationale: string;
};

export type ReplyInsight = {
  intent: string;
  intentLabel: string;
  riskLevel: 'low' | 'medium' | 'high';
  nextAction: string;
  followUp: string;
  subjectLine?: string;
};

export type ReplyQuickAction = {
  id: string;
  label: string;
};

export type GenerateApiResponse = {
  output: string;
  variants?: ReplyVariant[];
  insight?: ReplyInsight;
  quickActions?: ReplyQuickAction[];
  providerUsed?: string;
  modelUsed?: string;
};

export function isGenerateApiResponse(data: unknown): data is GenerateApiResponse {
  if (!data || typeof data !== 'object') return false;
  const output = (data as { output?: unknown }).output;
  return typeof output === 'string' && output.trim().length > 0;
}
