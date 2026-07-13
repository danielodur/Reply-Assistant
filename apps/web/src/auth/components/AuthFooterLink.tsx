type AuthFooterLinkProps = {
  prompt?: string;
  action: string;
  onClick: () => void;
  align?: 'left' | 'center';
};

export default function AuthFooterLink({
  prompt,
  action,
  onClick,
  align = 'left',
}: AuthFooterLinkProps) {
  return (
    <p className={['mt-4 text-[12px] text-[#6a5a5f]', align === 'center' ? 'text-center' : ''].join(' ')}>
      {prompt ? `${prompt} ` : null}
      <button type="button" className="font-semibold text-[#b04a70] hover:underline" onClick={onClick}>
        {action}
      </button>
    </p>
  );
}
