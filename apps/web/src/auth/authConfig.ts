const DEFAULT_AUTH_SITE = 'https://reply-assistant.netlify.app';

function authSiteBase(): string {
  const raw = String(import.meta.env.VITE_AUTH_SITE_URL || DEFAULT_AUTH_SITE).trim();
  return raw.replace(/\/$/, '');
}

export const NETLIFY_AUTH_CALLBACK = `${authSiteBase()}/auth/callback.html`;
export const NETLIFY_AUTH_RESET = `${authSiteBase()}/auth/reset-password.html`;
export const AUTH_DEEP_LINK_BASE = 'reply-assistant://auth/callback';

export function emailRedirectTo(lang: 'en' | 'zh' = 'en'): string {
  return `${NETLIFY_AUTH_CALLBACK}?lang=${lang}`;
}

export function passwordResetRedirectTo(lang: 'en' | 'zh' = 'en'): string {
  return `${NETLIFY_AUTH_RESET}?lang=${lang}`;
}
