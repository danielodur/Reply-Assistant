import { useState } from 'react';
import type { AppTranslations, ResolvedLanguage } from '../../i18n/translations';
import { passwordResetRedirectTo } from '../authConfig';
import AuthFooterLink from '../components/AuthFooterLink';
import AuthEmailField from '../components/AuthEmailField';
import AuthLayout from '../components/AuthLayout';
import { useResendCooldown } from '../hooks/useResendCooldown';
import { interpolate } from '../../i18n/translations';
import { isValidEmail, normalizeEmail } from '../passwordRules';
import { getSupabaseClient } from '../supabaseClient';

type ForgotPasswordScreenProps = {
  copy: AppTranslations;
  lang: ResolvedLanguage;
  onBack: () => void;
  onSignIn: () => void;
};

export default function ForgotPasswordScreen({
  copy,
  lang,
  onBack,
  onSignIn,
}: ForgotPasswordScreenProps) {
  const a = copy.auth;
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [message, setMessage] = useState('');
  const { canResend, countdownLabel, restart } = useResendCooldown();

  const sendReset = async (): Promise<boolean> => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setFieldError(a.errors.required);
      return false;
    }
    if (!isValidEmail(normalizedEmail)) {
      setFieldError(a.errors.invalidEmail);
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return false;

    setSubmitting(true);
    setFieldError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: passwordResetRedirectTo(lang),
    });
    setSubmitting(false);

    if (resetError) {
      setFieldError(resetError.message || a.errors.generic);
      return false;
    }

    setSent(true);
    restart();
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendReset();
  };

  const handleResend = async () => {
    if (!canResend) return;
    const ok = await sendReset();
    if (ok) {
      setMessage(a.resendSuccess);
    }
  };

  return (
    <AuthLayout
      title={a.forgotPasswordTitle}
      subtitle={sent ? a.resetEmailSent : a.forgotPasswordSubtitle}
      copy={copy}
      showHelp
    >
      {sent ? (
        <>
          {canResend ? (
            <button
              type="button"
              disabled={submitting}
              className="w-full rounded-full bg-[#d05e8a] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b84f79] disabled:opacity-60"
              onClick={() => void handleResend()}
            >
              {submitting ? a.working : a.resendResetLink}
            </button>
          ) : (
            <p className="text-center text-[12px] text-[#9a8a90]">
              {interpolate(a.resendIn, { time: countdownLabel })}
            </p>
          )}
          {message ? <p className="mt-3 text-center text-[12px] text-emerald-600">{message}</p> : null}
          {fieldError ? <p className="mt-3 text-center text-[12px] text-[#c15480]">{fieldError}</p> : null}
          <AuthFooterLink action={a.backToSignIn} onClick={onBack} align="center" />
        </>
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <AuthEmailField
            id="forgot-email"
            label={a.emailLabel}
            autoComplete="email"
            value={email}
            invalidEmailLabel={a.errors.invalidEmail}
            onChange={value => {
              setEmail(value);
              if (fieldError) setFieldError('');
            }}
            error={fieldError}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#d05e8a] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b84f79] disabled:opacity-60"
          >
            {submitting ? a.working : a.resetPassword}
          </button>
        </form>
      )}
      {!sent ? (
        <>
          <AuthFooterLink action={a.backToSignIn} onClick={onBack} />
          <AuthFooterLink prompt={a.alreadyHaveAccount} action={a.signInLink} onClick={onSignIn} />
        </>
      ) : null}
    </AuthLayout>
  );
}
