import { interpolate } from '../../i18n/translations';
import type { BusinessContext } from '../../config/businessContext';
import type { WorkMode } from './types';

type GeneratedOutputTemplate = {
  replyContext: string;
  internalContext: string;
  summaryLine: string;
  footer: string;
};

function isImportantMessage(textType: string, formality?: number) {
  if ((formality ?? 3) >= 4) return true;
  const normalizedType = String(textType || '').trim().toLowerCase();
  return ['formal-professional', 'longer-detailed', 'persuasive'].includes(normalizedType);
}

export function applyBusinessIdentityToGeneratedMessage(
  rawMessage: string,
  options: {
    businessContext: BusinessContext;
    textType: string;
    formality?: number;
  },
) {
  const message = String(rawMessage || '').trim();
  if (!message) return message;

  const name = options.businessContext.yourName?.trim();
  const position = options.businessContext.yourPosition?.trim();
  const company = options.businessContext.companyName?.trim();

  let output = message;

  if (name) {
    output = output
      .replace(/\[(?:\s*your\s*)?name\s*\]/gi, name)
      .replace(/\{\{\s*(?:your\s*)?name\s*\}\}/gi, name)
      .replace(/<\s*(?:your\s*)?name\s*>/gi, name);
  }

  if (position) {
    output = output
      .replace(/\[(?:\s*your\s*)?position\s*\]/gi, position)
      .replace(/\{\{\s*(?:your\s*)?position\s*\}\}/gi, position)
      .replace(/<\s*(?:your\s*)?position\s*>/gi, position);
  }

  if (company) {
    output = output
      .replace(/\[(?:\s*(?:your\s*)?(?:company|company\s*name|brand)\s*)\]/gi, company)
      .replace(/\{\{\s*(?:your\s*)?(?:company|company\s*name|brand)\s*\}\}/gi, company)
      .replace(/<\s*(?:your\s*)?(?:company|company\s*name|brand)\s*>/gi, company);
  }

  if (!name) {
    return output.trim();
  }

  const important = isImportantMessage(options.textType, options.formality);
  const signatureLines = [name, ...(important && position ? [position] : []), ...(company ? [company] : [])];
  const signOffPattern = /^(best regards|regards|sincerely|thanks|thank you|best|warm regards|kind regards),?$/i;
  const placeholderPattern = /^\s*[\[{<]\s*(?:your\s*)?(?:name|position|company(?:\s*name)?|brand)\s*[\]}>]\s*$/i;

  const hasAnySignatureReference = (value: string) => {
    const normalized = String(value || '').toLowerCase();
    return signatureLines.some(line => normalized.includes(line.toLowerCase()));
  };

  const stripTrailingSignatureTail = (value: string) => {
    const lines = String(value || '').split(/\r?\n/);
    const trimmedLines = lines.map(line => line.trim());

    for (let index = trimmedLines.length - 1; index >= 0; index -= 1) {
      if (!signOffPattern.test(trimmedLines[index])) continue;

      const tail = trimmedLines.slice(index + 1).filter(Boolean);
      const hasSignatureTail =
        tail.some(line => hasAnySignatureReference(line)) ||
        tail.some(line => placeholderPattern.test(line));

      if (hasSignatureTail) {
        return lines.slice(0, index).join('\n').trim();
      }
    }

    let cutIndex = lines.length;
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const trimmed = trimmedLines[index];
      if (!trimmed) {
        if (cutIndex !== lines.length) {
          cutIndex = index;
        }
        continue;
      }

      if (hasAnySignatureReference(trimmed) || placeholderPattern.test(trimmed)) {
        cutIndex = index;
        continue;
      }

      break;
    }

    if (cutIndex < lines.length) {
      return lines.slice(0, cutIndex).join('\n').trim();
    }

    return String(value || '').trim();
  };

  const collapseDuplicateTrailingSignOffs = (value: string) => {
    const lines = String(value || '').split(/\r?\n/);
    const start = Math.max(0, lines.length - 12);
    const signOffIndexes: number[] = [];

    for (let index = start; index < lines.length; index += 1) {
      if (signOffPattern.test(lines[index].trim())) {
        signOffIndexes.push(index);
      }
    }

    if (signOffIndexes.length <= 1) {
      return String(value || '').trim();
    }

    const keepIndex = signOffIndexes[signOffIndexes.length - 1];
    for (const index of signOffIndexes) {
      if (index !== keepIndex) {
        lines[index] = '';
      }
    }

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  output = output
    .replace(/^\s*\[(?:\s*your\s*)?(?:name|position|company(?:\s*name)?|brand)\s*\]\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lower = output.toLowerCase();
  const hasAllSignatureLines = signatureLines.every(line => lower.includes(line.toLowerCase()));
  if (hasAllSignatureLines) {
    return output;
  }

  const hasAnyExistingSignature = hasAnySignatureReference(output);
  const normalizedBody = hasAnyExistingSignature
    ? stripTrailingSignatureTail(output)
    : output;

  const signOff = important ? 'Best regards,' : 'Best,';
  const hasClosing = /(best regards|regards|sincerely|thanks|thank you|best|warm regards|kind regards),?\s*$/i.test(normalizedBody);

  const finalizedWithSingleSignOff = hasClosing
    ? `${normalizedBody}\n\n${signatureLines.join('\n')}`
    : `${normalizedBody}\n\n${signOff}\n\n${signatureLines.join('\n')}`;

  return collapseDuplicateTrailingSignOffs(finalizedWithSingleSignOff);

}

export function buildVariantOutput(
  rawInput: string,
  options: {
    mode: WorkMode;
    recipient: string;
    tone: string;
    language: string;
    textType: string;
    template: GeneratedOutputTemplate;
    senderName?: string;
    senderPosition?: string;
    senderCompany?: string;
    formality?: number;
  },
) {
  const normalized = rawInput.replace(/\s+/g, ' ').trim();
  const contextLine = options.mode === 'reply' ? options.template.replyContext : options.template.internalContext;

  const base = `${contextLine} ${interpolate(options.template.summaryLine, {
    tone: options.tone,
    recipient: options.recipient,
    language: options.language,
    textType: options.textType,
  })}`;

  const name = options.senderName?.trim();
  const position = options.senderPosition?.trim();
  const company = options.senderCompany?.trim();
  const isFormal = (options.formality ?? 3) >= 4;

  let signatureLines: string[] = [];
  if (name) {
    signatureLines.push(name);
    if (isFormal && position) signatureLines.push(position);
    if (company) signatureLines.push(company);
  }

  const signature = signatureLines.length > 0
    ? `\n\n${options.template.footer}\n\n${signatureLines.join('\n')}`
    : `\n\n${options.template.footer}`;

  return `${base}\n\n${normalized}${signature}`;
}
