import crypto from "node:crypto";
import express from "express";
import { OCRService } from "./OCRService.js";

const router = express.Router();
const MAX_FILES = 5;
const MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff", "heic", "heif"]);
const SUPPORTED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, "csv", "xlsx", "pdf", "docx", "pptx"]);

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function extensionOf(filename) {
  const clean = asString(filename).toLowerCase();
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1) : "";
}

function sourceLimit(source) {
  return source === "composer" || source === "business-context" || source === "contact" ? 3 : 3;
}

function summarizeText(text, max = 900) {
  const compact = asString(text).replace(/\s+/g, " ");
  return compact.length > max ? `${compact.slice(0, max - 3)}...` : compact;
}

function csvToText(buffer) {
  return buffer.toString("utf8").replace(/\r/g, "").split("\n").slice(0, 30).join("\n");
}

function kindFromExtension(extension) {
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (extension === "csv" || extension === "xlsx") return "spreadsheet";
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "document";
  if (extension === "pptx") return "presentation";
  return "document";
}

async function processFile(file, source, contactId, ocrService) {
  const filename = asString(file?.filename) || "attachment";
  const mimeType = asString(file?.mimeType) || "application/octet-stream";
  const sizeBytes = Number(file?.sizeBytes) || 0;
  const extension = extensionOf(filename);
  const buffer = Buffer.from(asString(file?.dataBase64), "base64");
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const createdAt = Date.now();

  if (!SUPPORTED_EXTENSIONS.has(extension) && !mimeType.startsWith("image/")) {
    return {
      id: `upload-${hash || createdAt}`,
      source,
      contactId,
      filename,
      extension,
      mimeType,
      sizeBytes,
      hash,
      status: "failed",
      summary: "",
      extractedText: "",
      confidence: 0,
      createdAt,
      warnings: ["Unsupported file type. Choose a relevant image, spreadsheet, PDF, document, or presentation."],
    };
  }

  if (!buffer.length || sizeBytes > MAX_BYTES || buffer.length > MAX_BYTES) {
    return {
      id: `upload-${hash || createdAt}`,
      source,
      contactId,
      filename,
      extension,
      mimeType,
      sizeBytes,
      hash,
      status: "failed",
      summary: "",
      extractedText: "",
      confidence: 0,
      createdAt,
      warnings: ["File is empty or larger than 15 MB"],
    };
  }

  if (extension === "csv" || mimeType.includes("csv")) {
    const extractedText = csvToText(buffer);
    return {
      id: `upload-${hash}`,
      source,
      contactId,
      filename,
      extension,
      mimeType,
      sizeBytes,
      hash,
      status: "ready",
      summary: summarizeText(extractedText, 500),
      extractedText: summarizeText(extractedText, 2000),
      structuredPreview: summarizeText(extractedText, 500),
      confidence: 1,
      provider: "local-csv-parser",
      createdAt,
      expiresAt: createdAt + 30 * 24 * 60 * 60 * 1000,
      warnings: [],
    };
  }

  if (IMAGE_EXTENSIONS.has(extension) || mimeType.startsWith("image/")) {
    const ocr = await ocrService.extractText({ buffer, mimeType, filename, hash });
    const status = ocr.text
      ? ocr.confidence >= 0.85 ? "ready" : "needs-review"
      : "needs-review";
    return {
      id: `upload-${hash}`,
      source,
      contactId,
      filename,
      extension,
      mimeType,
      sizeBytes,
      hash,
      status,
      summary: summarizeText(ocr.text, 500),
      extractedText: summarizeText(ocr.text, 2000),
      confidence: ocr.confidence,
      provider: ocr.provider,
      createdAt,
      expiresAt: createdAt + 30 * 24 * 60 * 60 * 1000,
      warnings: ocr.warnings,
    };
  }

  return {
    id: `upload-${hash}`,
    source,
    contactId,
    filename,
    extension,
    mimeType,
    sizeBytes,
    hash,
    status: "needs-review",
    summary: `${kindFromExtension(extension).toUpperCase()} attached. Text extraction for this file type needs a parser/OCR provider before it can ground replies.`,
    extractedText: "",
    confidence: 0,
    provider: "",
    createdAt,
    expiresAt: createdAt + 30 * 24 * 60 * 60 * 1000,
    warnings: ["No local parser is configured for this file type yet"],
  };
}

router.post("/process", async (req, res) => {
  const source = asString(req.body?.source) || "composer";
  const contactId = asString(req.body?.contactId) || undefined;
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  const limit = Math.min(sourceLimit(source), MAX_FILES);
  const ocrService = new OCRService();

  try {
    const uploads = [];
    for (const file of files.slice(0, limit)) {
      uploads.push(await processFile(file, source, contactId, ocrService));
    }
    res.json({ uploads });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to process uploads",
    });
  }
});

export default router;
