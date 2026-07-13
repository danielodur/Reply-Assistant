export const BUSINESS_CONTEXT_STORAGE_KEY = 'replyAssistantBusinessContext';

export type BusinessContext = {
  /** Personal sender name for signature lines */
  yourName: string;
  /** Company or brand name */
  companyName: string;
  /** Personal sender role/title for signature lines */
  yourPosition: string;
  /** Industry / product vertical (e.g. "SaaS", "E-commerce") */
  industry: string;
  /** Typical products or services offered */
  productsServices: string;
  /** Desired brand voice or communication style */
  brandVoice: string;
  /** Common objections or FAQs the team regularly handles */
  commonObjections: string;
  /** Any hard "never say" rules or escalation policies */
  doNotSay: string;
};

export type BusinessContextKey = keyof BusinessContext;

const DEFAULT_CONTEXT: BusinessContext = {
  yourName: '',
  companyName: '',
  yourPosition: '',
  industry: '',
  productsServices: '',
  brandVoice: '',
  commonObjections: '',
  doNotSay: '',
};

export function loadBusinessContext(): BusinessContext {
  try {
    const raw = localStorage.getItem(BUSINESS_CONTEXT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONTEXT };
    const parsed = JSON.parse(raw) as Partial<BusinessContext>;
    return {
      yourName: parsed.yourName ?? '',
      companyName: parsed.companyName ?? '',
      yourPosition: parsed.yourPosition ?? '',
      industry: parsed.industry ?? '',
      productsServices: parsed.productsServices ?? '',
      brandVoice: parsed.brandVoice ?? '',
      commonObjections: parsed.commonObjections ?? '',
      doNotSay: parsed.doNotSay ?? '',
    };
  } catch {
    return { ...DEFAULT_CONTEXT };
  }
}

export function saveBusinessContext(context: BusinessContext): void {
  localStorage.setItem(BUSINESS_CONTEXT_STORAGE_KEY, JSON.stringify(context));
}
