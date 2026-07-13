import { useState } from 'react';
import type { AppTranslations, ResolvedLanguage } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';
import { emailRedirectTo } from '../authConfig';
import AuthLayout from '../components/AuthLayout';
import { useResendCooldown } from '../hooks/useResendCooldown';
import { normalizeEmail } from '../passwordRules';
import { getSupabaseClient } from '../supabaseClient';

type VerifyEmailScreenProps = {
  copy: AppTranslations;
  lang: ResolvedLanguage;
  email: string;
  onBack: () => void;
};

export default function VerifyEmailScreen({
  copy,
  lang,
  email,
  onBack,
}: VerifyEmailScreenProps) {
  const a = copy.auth;
  const { canResend, countdownLabel, restart } = useResendCooldown();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!canResend || !normalizedEmail) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSubmitting(true);
    setError('');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo: emailRedirectTo(lang) },
    });
    setSubmitting(false);

    if (resendError) {
      setError(resendError.message || a.resendTooSoon);
      return;
    }

    setMessage(a.resendSuccess);
    restart();
  };

  const hasEmail = Boolean(normalizeEmail(email));

  return (
    <AuthLayout
      title={a.verifyEmailTitle}
      subtitle={hasEmail ? interpolate(a.verifyEmailSentTo, { email: normalizeEmail(email) }) : a.verifyEmailBody}
      copy={copy}
      showHelp
    >
      {hasEmail ? (
        <p className="mb-4 text-center text-[12px] leading-relaxed text-[#6a5a5f]">{a.verifyEmailBody}</p>
      ) : null}

      {canResend && hasEmail ? (
        <button
          type="button"
          disabled={submitting}
          className="w-full rounded-full bg-[#d05e8a] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b84f79] disabled:opacity-60"
          onClick={() => void handleResend()}
        >
          {submitting ? a.working : a.resendLink}
        </button>
      ) : !hasEmail ? (
        <p className="mb-4 text-center text-[12px] text-[#9a8a90]">{a.verifyEmailMissingEmail}</p>
      ) : (
        <p className="text-center text-[12px] text-[#9a8a90]">
          {interpolate(a.resendIn, { time: countdownLabel })}
        </p>
      )}

      {message ? <p className="mt-3 text-center text-[12px] text-emerald-600">{message}</p> : null}
      {error ? <p className="mt-3 text-center text-[12px] text-[#c15480]">{error}</p> : null}

      <button
        type="button"
        className="mt-4 w-full text-center text-[12px] font-semibold text-[#b04a70] hover:underline"
        onClick={onBack}
      >
        {a.backToSignIn}
      </button>
    </AuthLayout>
  );
}
