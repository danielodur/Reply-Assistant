import { createContext, useContext } from 'react';
import type { ResolvedLanguage } from '../i18n/translations';

type AuthLanguageContextValue = {
  lang: ResolvedLanguage;
  toggleLanguage: () => void;
};

const AuthLanguageContext = createContext<AuthLanguageContextValue | null>(null);

export function AuthLanguageProvider({
  lang,
  toggleLanguage,
  children,
}: AuthLanguageContextValue & { children: React.ReactNode }) {
  return (
    <AuthLanguageContext.Provider value={{ lang, toggleLanguage }}>
      {children}
    </AuthLanguageContext.Provider>
  );
}

export function useAuthLanguage() {
  const context = useContext(AuthLanguageContext);
  if (!context) {
    throw new Error('useAuthLanguage must be used within AuthLanguageProvider');
  }
  return context;
}
