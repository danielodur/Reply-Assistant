import { useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import { desktopNoDragStyle } from '../../components/DesktopWindowDragRegion';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import { isPasswordValid } from '../passwordRules';
import { getSupabaseClient } from '../supabaseClient';

type ChangePasswordScreenProps = {
  copy: AppTranslations;
  onDone: () => void;
  onBack: () => void;
};

export default function ChangePasswordScreen({
  copy,
  onDone,
  onBack,
}: ChangePasswordScreenProps) {
  const a = copy.auth;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const nextErrors: Record<string, string> = {};
    if (!isPasswordValid(password)) nextErrors.password = a.errors.weakPassword;
    if (password !== confirmPassword) nextErrors.confirmPassword = a.errors.passwordMismatch;
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setFieldErrors({ form: error.message || a.errors.generic });
      return;
    }

    setDone(true);
  };

  return (
    <AuthLayout
      title={a.changePasswordTitle}
      subtitle={done ? a.passwordUpdated : a.changePasswordSubtitle}
      copy={copy}
      topRightAction={
        done ? null : (
          <button
            type="button"
            className="rounded-full border border-[#edd7e0] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#b04a70] transition hover:border-[#e88ab0] hover:text-[#9a3d62]"
            onClick={onBack}
            style={desktopNoDragStyle()}
          >
            {copy.settings.cancel}
          </button>
        )
      }
    >
      {done ? (
        <button
          type="button"
          className="w-full rounded-full bg-[#d05e8a] px-4 py-2.5 text-[13px] font-semibold text-white"
          onClick={onDone}
        >
          {copy.settings.done}
        </button>
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <AuthPasswordField
            id="change-password"
            label={a.newPasswordLabel}
            autoComplete="new-password"
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
            showStrength
            weakPasswordLabel={a.weakPasswordHint}
            strongPasswordLabel={a.strongPasswordHint}
          />
          <AuthPasswordField
            id="change-password-confirm"
            label={a.confirmPasswordLabel}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={value => {
              setConfirmPassword(value);
              if (fieldErrors.confirmPassword || fieldErrors.form) {
                setFieldErrors(prev => {
                  const next = { ...prev };
                  delete next.confirmPassword;
                  delete next.form;
                  return next;
                });
              }
            }}
            error={fieldErrors.confirmPassword}
            showPasswordLabel={a.showPassword}
            hidePasswordLabel={a.hidePassword}
            matchAgainst={password}
            passwordMatchLabel={a.passwordsMatchHint}
            passwordMismatchLabel={a.errors.passwordMismatch}
          />
          {fieldErrors.form ? <p className="mb-3 text-[12px] text-[#c15480]">{fieldErrors.form}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#d05e8a] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b84f79] disabled:opacity-60"
          >
            {submitting ? a.working : a.changePasswordAction}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
