import { useCallback, useEffect, useState } from 'react';

export type AiProvider = 'deepseek' | 'openai' | 'zhipu' | 'qwen' | 'moonshot';

export const SUPPORTED_AI_PROVIDERS: AiProvider[] = [
  'deepseek',
  'openai',
  'zhipu',
  'qwen',
  'moonshot',
];

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  zhipu: 'Zhipu (GLM)',
  qwen: 'Qwen',
  moonshot: 'Moonshot',
};

const STORAGE_KEY = 'replyAssistantAiProvider';
const DEFAULT_PROVIDER: AiProvider = 'deepseek';

function loadProvider(): AiProvider {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (SUPPORTED_AI_PROVIDERS as string[]).includes(raw)) {
      return raw as AiProvider;
    }
    return DEFAULT_PROVIDER;
  } catch {
    return DEFAULT_PROVIDER;
  }
}

export function useAiProviderSettings() {
  const [provider, setProviderState] = useState<AiProvider>(loadProvider);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, provider);
    } catch {
      // ignore storage errors in restricted environments
    }
  }, [provider]);

  const setProvider = useCallback((p: AiProvider) => {
    if ((SUPPORTED_AI_PROVIDERS as string[]).includes(p)) {
      setProviderState(p);
    }
  }, []);

  return { provider, setProvider };
}
