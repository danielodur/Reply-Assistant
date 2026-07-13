import { useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import AuthFooterLink from '../components/AuthFooterLink';
import AuthEmailField from '../components/AuthEmailField';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import { isValidEmail, normalizeEmail } from '../passwordRules';
import { getSupabaseClient } from '../supabaseClient';

type SignInScreenProps = {
  copy: AppTranslations;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onVerifyEmail: (email: string) => void;
};

export default function SignInScreen({
  copy,
  onSignUp,
  onForgotPassword,
  onVerifyEmail,
}: SignInScreenProps) {
  const a = copy.auth;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setFieldErrors({ email: a.errors.required });
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setFieldErrors({ email: a.errors.invalidEmail });
      return;
    }
    if (!password) {
      setFieldErrors({ password: a.errors.required });
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setSubmitting(false);

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('email not confirmed')) {
        setFieldErrors({ form: a.errors.emailNotConfirmed });
        onVerifyEmail(normalizedEmail);
        return;
      }
      setFieldErrors({ form: a.errors.invalidCredentials });
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      onVerifyEmail(normalizedEmail);
    }
  };

  return (
    <AuthLayout title={a.signInTitle} subtitle={a.signInSubtitle} copy={copy} showHelp>
      <form noValidate onSubmit={handleSubmit}>
        <AuthEmailField
          id="sign-in-email"
          label={a.emailLabel}
          autoComplete="email"
          value={email}
          invalidEmailLabel={a.errors.invalidEmail}
          onChange={value => {
            setEmail(value);
            if (fieldErrors.email || fieldErrors.form) {
              setFieldErrors(prev => {
                const next = { ...prev };
                delete next.email;
                delete next.form;
                return next;
              });
            }
          }}
          error={fieldErrors.email}
        />
        <AuthPasswordField
          id="sign-in-password"
          label={a.passwordLabel}
          autoComplete="current-password"
          value={password}
          onChange={value => {
            setPassword(value);
            if (fieldErrors.password || fieldErrors.form) {
              setFieldErrors(prev => {
                const next = { ...prev };
                delete next.password;
                delete next.form;
                return next;
              });
            }
          }}
          error={fieldErrors.password}
          showPasswordLabel={a.showPassword}
          hidePasswordLabel={a.hidePassword}
        />
        {fieldErrors.form ? <p className="mb-3 text-[12px] text-[#c15480]">{fieldErrors.form}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#d05e8a] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b84f79] active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? a.working : a.signInAction}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between text-[12px]">
        <button type="button" className="text-[#b04a70] hover:underline" onClick={onForgotPassword}>
          {a.forgotPassword}
        </button>
      </div>
      <AuthFooterLink
        prompt={a.dontHaveAccount}
        action={a.signUpLink}
        onClick={onSignUp}
      />
    </AuthLayout>
  );
}
