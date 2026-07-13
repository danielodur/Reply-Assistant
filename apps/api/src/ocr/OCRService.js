import { getCachedOcrResult, setCachedOcrResult } from "./ocrCache.js";
import { AliyunOCRProvider } from "./AliyunOCRProvider.js";
import { GoogleVisionProvider } from "./GoogleVisionProvider.js";
import { AzureComputerVisionProvider } from "./AzureComputerVisionProvider.js";

const CONFIDENCE_READY = 0.85;

export class OCRService {
  constructor(providers = [
    new AliyunOCRProvider(),
    new GoogleVisionProvider(),
    new AzureComputerVisionProvider(),
  ]) {
    this.providers = providers;
  }

  async extractText({ buffer, mimeType, filename, hash }) {
    const cached = getCachedOcrResult(hash);
    if (cached) return cached;

    const warnings = [];
    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        warnings.push(`${provider.name} not configured`);
        continue;
      }
      try {
        const result = await provider.extractText({ buffer, mimeType, filename });
        const normalized = {
          text: String(result?.text || "").trim(),
          confidence: Number.isFinite(Number(result?.confidence)) ? Number(result.confidence) : 0,
          provider: provider.name,
          warnings: [...warnings, ...(Array.isArray(result?.warnings) ? result.warnings : [])],
        };
        if (normalized.confidence >= CONFIDENCE_READY || normalized.text) {
          setCachedOcrResult(hash, normalized);
          return normalized;
        }
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : `${provider.name} failed`);
      }
    }

    const unavailable = {
      text: "",
      confidence: 0,
      provider: "",
      warnings: warnings.length ? warnings : ["No OCR provider is configured"],
    };
    setCachedOcrResult(hash, unavailable);
    return unavailable;
  }
}
