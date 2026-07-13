import { useCallback, useMemo, useState } from 'react';
import { getTranslations, resolveLanguage, type AppLanguage } from '../i18n/translations';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from './AuthProvider';
import { AuthLanguageProvider } from './AuthLanguageContext';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';

export type AuthRoute =
  | 'sign-in'
  | 'sign-up'
  | 'forgot-password'
  | 'verify-email'
  | 'change-password';

type AuthShellProps = {
  pendingVerification?: boolean;
  initialRoute?: AuthRoute;
  onClose?: () => void;
};

export default function AuthShell({
  pendingVerification = false,
  initialRoute,
  onClose,
}: AuthShellProps) {
  const { settings, set } = useAppSettings();
  const { user } = useAuth();
  const [route, setRoute] = useState<AuthRoute>(
    initialRoute ?? (pendingVerification ? 'verify-email' : 'sign-in'),
  );
  const [pendingEmail, setPendingEmail] = useState(() => user?.email ?? '');
  const verifyEmail = pendingEmail || user?.email || '';

  const lang = resolveLanguage(settings.defaultLanguage as AppLanguage);
  const copy = useMemo(
    () => getTranslations(settings.defaultLanguage as AppLanguage),
    [settings.defaultLanguage],
  );

  const toggleLanguage = useCallback(() => {
    set('defaultLanguage', lang === 'zh' ? 'en' : 'zh');
  }, [lang, set]);

  const navigate = (next: AuthRoute) => setRoute(next);

  const goToVerifyEmail = (email: string) => {
    setPendingEmail(email);
    navigate('verify-email');
  };

  let screen;
  switch (route) {
    case 'sign-up':
      screen = (
        <SignUpScreen
          copy={copy}
          lang={lang}
          onSignIn={() => navigate('sign-in')}
          onVerifyEmail={goToVerifyEmail}
        />
      );
      break;
    case 'forgot-password':
      screen = (
        <ForgotPasswordScreen
          copy={copy}
          lang={lang}
          onBack={() => navigate('sign-in')}
          onSignIn={() => navigate('sign-in')}
        />
      );
      break;
    case 'verify-email':
      screen = (
        <VerifyEmailScreen
          copy={copy}
          lang={lang}
          email={verifyEmail}
          onBack={() => navigate('sign-in')}
        />
      );
      break;
    case 'change-password':
      screen = (
        <ChangePasswordScreen
          copy={copy}
          onDone={() => onClose?.()}
          onBack={() => onClose?.()}
        />
      );
      break;
    case 'sign-in':
    default:
      screen = (
        <SignInScreen
          copy={copy}
          onSignUp={() => navigate('sign-up')}
          onForgotPassword={() => navigate('forgot-password')}
          onVerifyEmail={goToVerifyEmail}
        />
      );
  }

  return (
    <AuthLanguageProvider lang={lang} toggleLanguage={toggleLanguage}>
      {screen}
    </AuthLanguageProvider>
  );
}
