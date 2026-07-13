import { useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { ResolvedLanguage } from '../../i18n/translations';
import { emailRedirectTo } from '../authConfig';
import AuthFooterLink from '../components/AuthFooterLink';
import AuthField from '../components/AuthField';
import AuthEmailField from '../components/AuthEmailField';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import { isPasswordValid, isValidEmail, isValidFullName, normalizeEmail } from '../passwordRules';
import { getSupabaseClient } from '../supabaseClient';

type SignUpScreenProps = {
  copy: AppTranslations;
  lang: ResolvedLanguage;
  onSignIn: () => void;
  onVerifyEmail: (email: string) => void;
};

export default function SignUpScreen({
  copy,
  lang,
  onSignIn,
  onVerifyEmail,
}: SignUpScreenProps) {
  const a = copy.auth;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = name.trim().replace(/\s+/g, ' ');

    const nextErrors: Record<string, string> = {};
    if (!normalizedName) nextErrors.name = a.errors.required;
    else if (!isValidFullName(normalizedName)) nextErrors.name = a.errors.invalidFullName;
    if (!normalizedEmail) nextErrors.email = a.errors.required;
    else if (!isValidEmail(normalizedEmail)) nextErrors.email = a.errors.invalidEmail;
    if (!password) nextErrors.password = a.errors.required;
    else if (!isPasswordValid(password)) nextErrors.password = a.errors.weakPassword;
    if (!confirmPassword) nextErrors.confirmPassword = a.errors.required;
    else if (password !== confirmPassword) nextErrors.confirmPassword = a.errors.passwordMismatch;
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { display_name: normalizedName },
        emailRedirectTo: emailRedirectTo(lang),
      },
    });
    setSubmitting(false);

    if (error) {
      setFieldErrors({ form: error.message || a.errors.generic });
      return;
    }

    onVerifyEmail(normalizedEmail);
  };

  return (
    <AuthLayout title={a.signUpTitle} subtitle={a.signUpSubtitle} copy={copy} showHelp>
      <form noValidate onSubmit={handleSubmit}>
        <AuthField
          id="sign-up-name"
          label={a.nameLabel}
          autoComplete="name"
          value={name}
          onChange={value => {
            setName(value);
            if (fieldErrors.name || fieldErrors.form) {
              setFieldErrors(prev => {
                const next = { ...prev };
                delete next.name;
                delete next.form;
                return next;
              });
            }
          }}
          error={fieldErrors.name}
        />
        <AuthEmailField
          id="sign-up-email"
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
          id="sign-up-password"
          label={a.passwordLabel}
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
          id="sign-up-confirm"
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
          className="w-full rounded-full bg-[#d05e8a] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b84f79] active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? a.working : a.signUpAction}
        </button>
      </form>
      <AuthFooterLink
        prompt={a.alreadyHaveAccount}
        action={a.signInLink}
        onClick={onSignIn}
      />
    </AuthLayout>
  );
}
