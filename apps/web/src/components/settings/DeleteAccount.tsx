import { useState } from 'react';
import MiniScreenFrame from '../MiniScreenFrame';
import { useAuth } from '../../auth/AuthProvider';
import { requestAccountDeletion } from '../../auth/deleteAccountApi';
import type { AppTranslations } from '../../i18n/translations';

type DeleteAccountProps = {
  onClose: () => void;
  onDeleted: () => void;
  copy: AppTranslations;
};

export default function DeleteAccount({ onClose, onDeleted, copy }: DeleteAccountProps) {
  const { signOut } = useAuth();
  const da = copy.deleteAccount;

  const [acknowledged, setAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!acknowledged || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await requestAccountDeletion();
      await signOut();
      onDeleted();
    } catch (error) {
      const message = error instanceof Error ? error.message : da.errorGeneric;
      const offline = /failed|fetch|network|HTTP/i.test(message);
      setErrorMessage(offline ? da.errorOffline : da.errorGeneric);
      setIsDeleting(false);
    }
  };

  return (
    <MiniScreenFrame
      label={da.frameLabel}
      title={da.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd]"
    >
      <div className="px-5 py-5">
        <div className="overflow-hidden rounded-[16px] border border-[#f0dbe3] bg-[#fff5f9] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="text-[12px] leading-relaxed text-slate-700">{da.body}</p>

          <label className="mt-4 flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={event => setAcknowledged(event.currentTarget.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#e7aac2] text-[#E85C8B] focus:ring-[#ef96b7]"
            />
            <span className="text-[11px] leading-relaxed text-slate-700">{da.acknowledgeLabel}</span>
          </label>

          {errorMessage ? (
            <p className="mt-3 text-[11px] text-[#c15480]" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!acknowledged || isDeleting}
            onClick={() => void handleDelete()}
            className="mt-4 w-full rounded-full bg-[#E85C8B] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(232,92,139,0.24)] transition disabled:cursor-not-allowed disabled:bg-[#f0b8cc] disabled:shadow-none"
          >
            {isDeleting ? da.working : da.confirmButton}
          </button>
        </div>
      </div>
    </MiniScreenFrame>
  );
}
