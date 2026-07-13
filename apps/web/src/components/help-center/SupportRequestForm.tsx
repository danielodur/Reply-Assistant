import { useMemo, useState } from 'react';
import { isValidEmail, isValidFullName, normalizeEmail } from '../../auth/emailValidation';
import { useAuth } from '../../auth/AuthProvider';
import type { AppTranslations } from '../../i18n/translations';
import { useAppSettings } from '../../hooks/useAppSettings';
import InternationalPhoneField from '../settings/InternationalPhoneField';
import { SUPPORT_ISSUE_IDS } from './supportIssueCategories';
import { submitSupportRequest } from './supportRequestApi';

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 200;

type SupportRequestFormProps = {
  copy: AppTranslations;
};

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  issue?: string;
  message?: string;
  form?: string;
};

export default function SupportRequestForm({ copy }: SupportRequestFormProps) {
  const cs = copy.customerService;
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const language = settings.defaultLanguage;

  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [phoneE164, setPhoneE164] = useState('');
  const [phoneHasDigits, setPhoneHasDigits] = useState(false);
  const [issueCategory, setIssueCategory] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const messageCount = message.length;

  const issueOptions = useMemo(
    () => SUPPORT_ISSUE_IDS.map(id => ({ id, label: cs.issueCategories[id] })),
    [cs.issueCategories],
  );

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();

    if (!trimmedName || !isValidFullName(trimmedName)) {
      errors.name = cs.errorNameRequired;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      errors.email = cs.errorEmailInvalid;
    }

    if (phoneHasDigits && !phoneE164.trim()) {
      errors.phone = cs.errorPhoneInvalid;
    }

    if (!issueCategory) {
      errors.issue = cs.errorIssueRequired;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length < MESSAGE_MIN) {
      errors.message = cs.errorMessageRequired;
    } else if (trimmedMessage.length > MESSAGE_MAX) {
      errors.message = cs.errorMessageTooLong;
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      let appVersion: string | undefined;
      if (window.desktopApp?.getAppVersion) {
        appVersion = await window.desktopApp.getAppVersion();
      }

      await submitSupportRequest({
        displayName: name.trim(),
        email: normalizeEmail(email),
        phoneNumber: phoneE164.trim() || undefined,
        issueCategory: issueCategory as typeof SUPPORT_ISSUE_IDS[number],
        message: message.trim(),
        appVersion,
        platform: window.desktopApp?.platform,
      });

      setSubmittedAt(new Date().toLocaleString());
    } catch (error) {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      setFieldErrors({
        form: offline ? cs.formErrorOffline : cs.formErrorGeneric,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedAt) {
    return (
      <div
        className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-4"
        role="status"
        aria-live="polite"
      >
        <p className="text-[13px] font-semibold text-emerald-800">{cs.formSuccessTitle}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-emerald-700">
          {cs.formSuccessBody.replace('{{time}}', submittedAt)}
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-[12px] font-semibold text-slate-900">{cs.stillNeedHelpTitle}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{cs.stillNeedHelpBody}</p>
      </div>

      <label className="block">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
          {cs.formNameLabel}
        </span>
        <input
          type="text"
          value={name}
          onChange={event => {
            setName(event.currentTarget.value);
            if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
          }}
          className={[
            'mt-1 w-full rounded-[10px] border bg-white px-3 py-2 text-[12px] text-slate-800 outline-none',
            fieldErrors.name ? 'border-[#e88ab0]' : 'border-[#edd7e0]',
          ].join(' ')}
          autoComplete="name"
        />
        {fieldErrors.name ? (
          <p className="mt-1 text-[11px] text-[#c15480]" role="alert">{fieldErrors.name}</p>
        ) : null}
      </label>

      <InternationalPhoneField
        valueE164={phoneE164}
        onChangeE164={setPhoneE164}
        language={language}
        copy={copy.accountSettings}
        fieldLabel={cs.formPhoneLabel}
        error={fieldErrors.phone}
        onClearError={() => setFieldErrors(prev => ({ ...prev, phone: undefined }))}
        onNationalDigitsChange={setPhoneHasDigits}
      />

      <label className="block">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
          {cs.formEmailLabel}
        </span>
        <input
          type="email"
          value={email}
          onChange={event => {
            setEmail(event.currentTarget.value);
            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
          }}
          className={[
            'mt-1 w-full rounded-[10px] border bg-white px-3 py-2 text-[12px] text-slate-800 outline-none',
            fieldErrors.email ? 'border-[#e88ab0]' : 'border-[#edd7e0]',
          ].join(' ')}
          autoComplete="email"
        />
        {fieldErrors.email ? (
          <p className="mt-1 text-[11px] text-[#c15480]" role="alert">{fieldErrors.email}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
          {cs.formIssueLabel}
        </span>
        <select
          value={issueCategory}
          onChange={event => {
            setIssueCategory(event.currentTarget.value);
            if (fieldErrors.issue) setFieldErrors(prev => ({ ...prev, issue: undefined }));
          }}
          className={[
            'mt-1 w-full rounded-[10px] border bg-white px-3 py-2 text-[12px] text-slate-800 outline-none',
            fieldErrors.issue ? 'border-[#e88ab0]' : 'border-[#edd7e0]',
          ].join(' ')}
        >
          <option value="">{cs.formIssuePlaceholder}</option>
          {issueOptions.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        {fieldErrors.issue ? (
          <p className="mt-1 text-[11px] text-[#c15480]" role="alert">{fieldErrors.issue}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
          {cs.formMessageLabel}
        </span>
        <textarea
          value={message}
          maxLength={MESSAGE_MAX}
          rows={4}
          onChange={event => {
            setMessage(event.currentTarget.value);
            if (fieldErrors.message) setFieldErrors(prev => ({ ...prev, message: undefined }));
          }}
          className={[
            'mt-1 w-full resize-none rounded-[10px] border bg-white px-3 py-2 text-[12px] text-slate-800 outline-none',
            fieldErrors.message ? 'border-[#e88ab0]' : 'border-[#edd7e0]',
          ].join(' ')}
        />
        <p className="mt-1 text-[10px] text-slate-400">
          {cs.formMessageCounter.replace('{{count}}', String(messageCount)).replace('{{max}}', String(MESSAGE_MAX))}
        </p>
        {fieldErrors.message ? (
          <p className="mt-1 text-[11px] text-[#c15480]" role="alert">{fieldErrors.message}</p>
        ) : null}
      </label>

      {fieldErrors.form ? (
        <p className="text-[11px] text-[#c15480]" role="alert">{fieldErrors.form}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#E85C8B] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition hover:bg-[#d04f7c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? cs.formSubmitting : cs.formSubmit}
      </button>
    </form>
  );
}
