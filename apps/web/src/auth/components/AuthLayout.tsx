import { useState, type ReactNode } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import { useAuthLanguage } from '../AuthLanguageContext';
import AuthHelpButton from './AuthHelpButton';
import AuthHelpSheet from './AuthHelpSheet';
import AuthLanguageToggle from './AuthLanguageToggle';
import AuthLogo from './AuthLogo';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  copy?: AppTranslations;
  showHelp?: boolean;
  topRightAction?: ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  copy,
  showHelp = false,
  topRightAction,
}: AuthLayoutProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const { lang, toggleLanguage } = useAuthLanguage();

  return (
    <div className="relative flex h-full min-h-[650px] w-full items-center justify-center bg-gradient-to-b from-[#fffafb] to-[#f8f4f6] px-2.5 py-6">
      <div className="relative w-full rounded-[18px] border border-[#f0dbe3] bg-white px-6 py-7 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <AuthLanguageToggle currentLanguage={lang} onToggle={toggleLanguage} />
        {topRightAction ? (
          <div className="absolute right-4 top-4">{topRightAction}</div>
        ) : null}
        {showHelp && copy ? (
          <AuthHelpButton label={copy.auth.needHelp} onClick={() => setHelpOpen(true)} />
        ) : null}
        <AuthLogo />
        <h1 className="mt-3 text-center text-[20px] font-semibold tracking-[0.01em] text-[#231f20]">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-center text-[13px] leading-relaxed text-[#6a5a5f]">{subtitle}</p>
        ) : null}
        <div className="mt-5">{children}</div>
      </div>
      {showHelp && copy ? (
        <AuthHelpSheet copy={copy} open={helpOpen} onClose={() => setHelpOpen(false)} />
      ) : null}
    </div>
  );
}
