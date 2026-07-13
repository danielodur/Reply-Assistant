import type { ReplyVariant, ReplyVariantId } from './generatedReplyTypes';

type VariantSelectorProps = {
  variants: ReplyVariant[];
  selectedVariantId: ReplyVariantId;
  onSelect: (id: ReplyVariantId) => void;
};

export default function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {variants.map(variant => {
        const active = variant.id === selectedVariantId;
        return (
          <button
            key={variant.id}
            type="button"
            className={[
              'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition',
              active
                ? 'border-[#e88ab0] bg-[#fde9f2] text-[#b84f79]'
                : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2] hover:text-[#c15480]',
            ].join(' ')}
            onClick={() => onSelect(variant.id)}
          >
            {variant.title}
          </button>
        );
      })}
    </div>
  );
}
