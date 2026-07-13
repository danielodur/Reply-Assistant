import "dotenv/config";
import cors from "cors";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { contactThreadSection } from "./contactThreadPrompt.js";
import {
  generationContextSection,
  recentReplyMemorySection,
  snippetMemorySection,
} from "./memoryPrompt.js";
import {
  buildQuickActions,
  normalizeGenerateRequest,
  validateGenerateRequest,
} from "./generateContract.js";
import { buildInsight, buildVariants } from "./replyIntelligence.js";
import { buildCrossLanguageFragment } from "./crossLanguageFragment.js";
import { buildTranslateDraftFragment } from "./translateDraftFragment.js";
import { buildVoiceProfileFragment } from "./voiceProfileFragment.js";
import { syncEmailContactContexts } from "./email/emailSyncService.js";
import { syncTelegramContactContexts } from "./telegram/telegramSyncService.js";
import {
  ingestDingTalkWebhook,
  syncDingTalkContactContexts,
} from "./dingtalk/dingTalkSyncService.js";
import {
  ingestWeChatWebhook,
  syncWeChatContactContexts,
} from "./wechat/weChatSyncService.js";
import {
  ingestWhatsAppWebhook,
  syncWhatsAppContactContexts,
} from "./whatsapp/whatsAppSyncService.js";
import {
  buildOAuthAuthorizationUrl,
  exchangeOAuthCode,
} from "./email/oauthFlow.js";
import uploadRoutes from "./ocr/ocrRoutes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "120mb" }));
app.use("/api/uploads", uploadRoutes);

const SUPPORTED_PROVIDERS = ["deepseek", "openai", "zhipu", "qwen", "moonshot"];
const SUPABASE_LOG_TABLE_CANDIDATES = [
  "ai_generation_logs",
  "reply_generation_logs",
];
const SUPABASE_EMAIL_SYNC_TABLE = "email_sync_runs";

// ---------------------------------------------------------------------------
// Startup env validation
// ---------------------------------------------------------------------------
function validateEnvAtStartup() {
  const preferredProvider = String(
    process.env.AI_PROVIDER || "deepseek",
  ).toLowerCase();

  const providerEnvMap = {
    deepseek: "DEEPSEEK_API_KEY",
    openai: "OPENAI_API_KEY",
    zhipu: "ZHIPU_API_KEY",
    qwen: "QWEN_API_KEY",
    moonshot: "MOONSHOT_API_KEY",
  };

  const configuredProviders = SUPPORTED_PROVIDERS.filter((p) => {
    const key = providerEnvMap[p];
    return key && String(process.env[key] || "").trim().length > 0;
  });

  if (configuredProviders.length === 0) {
    console.warn(
      "[startup] WARNING: No AI providers are configured. " +
        "Set at least one of DEEPSEEK_API_KEY, OPENAI_API_KEY, ZHIPU_API_KEY, QWEN_API_KEY, or MOONSHOT_API_KEY.",
    );
  } else {
    console.log(
      `[startup] Configured providers: ${configuredProviders.join(", ")}`,
    );
    if (!configuredProviders.includes(preferredProvider)) {
      console.warn(
        `[startup] WARNING: AI_PROVIDER is set to "${preferredProvider}" but that provider is not configured. ` +
          `Falling back to: ${configuredProviders[0]}.`,
      );
    } else {
      console.log(`[startup] Preferred provider: ${preferredProvider}`);
    }
  }

  if (!isSupabaseConfigured()) {
    console.log("[startup] Supabase logging is disabled (env vars not set).");
  }
}

function isSupabaseConfigured() {
  const url = String(process.env.SUPABASE_URL || "").trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !key) return false;
  if (
    url.includes("YOUR_PROJECT_REF") ||
    key.includes("YOUR_SUPABASE_SERVICE_ROLE_KEY")
  )
    return false;
  return true;
}

const supabase = isSupabaseConfigured()
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
  : null;

function normalizeBaseUrl(url) {
  return String(url ?? "")
    .trim()
    .replace(/\/+$/, "");
}

function getProviderConfig(provider) {
  const map = {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      baseUrl: normalizeBaseUrl(
        process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
      ),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o",
      baseUrl: normalizeBaseUrl(
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      ),
    },
    zhipu: {
      apiKey: process.env.ZHIPU_API_KEY,
      model: process.env.ZHIPU_MODEL || "glm-4",
      baseUrl: normalizeBaseUrl(
        process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
      ),
    },
    qwen: {
      apiKey: process.env.QWEN_API_KEY,
      model: process.env.QWEN_MODEL || "qwen-max",
      baseUrl: normalizeBaseUrl(
        process.env.QWEN_BASE_URL ||
          "https://dashscope.aliyuncs.com/compatible-mode/v1",
      ),
    },
    moonshot: {
      apiKey: process.env.MOONSHOT_API_KEY,
      model: process.env.MOONSHOT_MODEL || "moonshot-v1-8k",
      baseUrl: normalizeBaseUrl(
        process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1",
      ),
    },
  };

  return map[provider] || null;
}

function getProviderOrder(preferredProvider) {
  const preferred = String(preferredProvider || "deepseek").toLowerCase();
  const ordered = [preferred, ...SUPPORTED_PROVIDERS];
  return [...new Set(ordered)].filter((provider) =>
    SUPPORTED_PROVIDERS.includes(provider),
  );
}

function isProviderConfigured(provider) {
  const config = getProviderConfig(provider);
  return Boolean(config?.apiKey && config?.model && config?.baseUrl);
}

function extractOutput(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }

  return "";
}

function businessContextSection(context) {
  if (!context || typeof context !== "object") return "None";

  const fields = [
    ["Sender Name", context.yourName],
    ["Company", context.companyName],
    ["Sender Position", context.yourPosition],
    ["Industry", context.industry],
    ["Products/Services", context.productsServices],
    ["Brand Voice", context.brandVoice],
    ["Common Objections", context.commonObjections],
    ["Do Not Say", context.doNotSay],
  ];

  const nonEmpty = fields
    .map(([label, value]) => `${label}: ${String(value || "").trim()}`)
    .filter((line) => !line.endsWith(": "));

  return nonEmpty.length > 0 ? nonEmpty.join("\n") : "None";
}

function isImportantMessageRequest(request) {
  const formality = Number(request?.tone?.formality ?? 3);
  const textType = String(request?.textType || "")
    .trim()
    .toLowerCase();
  const rawInput = String(request?.rawInput || "")
    .trim()
    .toLowerCase();

  if (formality >= 4) return true;

  const importantTextTypes = new Set([
    "formal-professional",
    "longer-detailed",
    "persuasive",
  ]);

  if (importantTextTypes.has(textType)) return true;
  if (textType.includes("email")) return true;
  if (/\b(email|official|formal|important)\b/.test(rawInput)) return true;

  return false;
}

function buildDesiredSignatureLines(request) {
  const ctx = request?.businessContext || {};
  const name = String(ctx.yourName || "").trim();
  const position = String(ctx.yourPosition || "").trim();
  const company = String(ctx.companyName || "").trim();

  if (!name) return [];

  const isImportant = isImportantMessageRequest(request);
  const lines = [name];

  if (isImportant && position) {
    lines.push(position);
  }
  if (company) {
    lines.push(company);
  }

  return lines;
}

function replaceKnownPlaceholders(text, request) {
  let result = String(text || "");
  const ctx = request?.businessContext || {};
  const name = String(ctx.yourName || "").trim();
  const position = String(ctx.yourPosition || "").trim();
  const company = String(ctx.companyName || "").trim();

  const namePatterns = [
    /\[(?:\s*your\s*)?name\s*\]/gi,
    /\{\{\s*(?:your\s*)?name\s*\}\}/gi,
    /<\s*(?:your\s*)?name\s*>/gi,
  ];

  const positionPatterns = [
    /\[(?:\s*your\s*)?position\s*\]/gi,
    /\{\{\s*(?:your\s*)?position\s*\}\}/gi,
    /<\s*(?:your\s*)?position\s*>/gi,
  ];

  const companyPatterns = [
    /\[(?:\s*(?:your\s*)?(?:company|company\s*name|brand)\s*)\]/gi,
    /\{\{\s*(?:your\s*)?(?:company|company\s*name|brand)\s*\}\}/gi,
    /<\s*(?:your\s*)?(?:company|company\s*name|brand)\s*>/gi,
  ];

  if (name) {
    for (const pattern of namePatterns) {
      result = result.replace(pattern, name);
    }
  }

  if (position) {
    for (const pattern of positionPatterns) {
      result = result.replace(pattern, position);
    }
  }

  if (company) {
    for (const pattern of companyPatterns) {
      result = result.replace(pattern, company);
    }
  }

  return result;
}

function ensureSignatureBlock(text, request) {
  const signatureLines = buildDesiredSignatureLines(request);
  if (signatureLines.length === 0) {
    return String(text || "").trim();
  }

  const signOffPattern =
    /^(best regards|regards|sincerely|thanks|thank you|best|warm regards|kind regards),?$/i;
  const placeholderPattern =
    /^\s*[\[{<]\s*(?:your\s*)?(?:name|position|company(?:\s*name)?|brand)\s*[\]}>]\s*$/i;

  function hasAnySignatureReference(value) {
    const normalized = String(value || "").toLowerCase();
    return signatureLines.some((line) =>
      normalized.includes(line.toLowerCase()),
    );
  }

  function stripTrailingSignatureTail(value) {
    const lines = String(value || "").split(/\r?\n/);
    const trimmedLines = lines.map((line) => line.trim());

    for (let i = trimmedLines.length - 1; i >= 0; i -= 1) {
      if (!signOffPattern.test(trimmedLines[i])) continue;

      const tail = trimmedLines.slice(i + 1).filter(Boolean);
      const hasSignatureTail =
        tail.some((line) => hasAnySignatureReference(line)) ||
        tail.some((line) => placeholderPattern.test(line));

      if (hasSignatureTail) {
        return lines.slice(0, i).join("\n").trim();
      }
    }

    let cutIndex = lines.length;
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const trimmed = trimmedLines[i];
      if (!trimmed) {
        if (cutIndex !== lines.length) {
          cutIndex = i;
        }
        continue;
      }

      if (
        hasAnySignatureReference(trimmed) ||
        placeholderPattern.test(trimmed)
      ) {
        cutIndex = i;
        continue;
      }

      break;
    }

    if (cutIndex < lines.length) {
      return lines.slice(0, cutIndex).join("\n").trim();
    }

    return String(value || "").trim();
  }

  function collapseDuplicateTrailingSignOffs(value) {
    const lines = String(value || "").split(/\r?\n/);
    const start = Math.max(0, lines.length - 12);
    const signOffIndexes = [];

    for (let i = start; i < lines.length; i += 1) {
      if (signOffPattern.test(lines[i].trim())) {
        signOffIndexes.push(i);
      }
    }

    if (signOffIndexes.length <= 1) {
      return String(value || "").trim();
    }

    const keepIndex = signOffIndexes[signOffIndexes.length - 1];
    for (const index of signOffIndexes) {
      if (index !== keepIndex) {
        lines[index] = "";
      }
    }

    return lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const processed = String(text || "")
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;

      const shouldDropName =
        signatureLines.length > 0 &&
        /^\[(?:\s*your\s*)?name\s*\]$/i.test(trimmed);
      const shouldDropPosition =
        signatureLines.some(
          (item) =>
            item.toLowerCase() ===
            String(request?.businessContext?.yourPosition || "")
              .trim()
              .toLowerCase(),
        ) && /^\[(?:\s*your\s*)?position\s*\]$/i.test(trimmed);
      const shouldDropCompany =
        signatureLines.some(
          (item) =>
            item.toLowerCase() ===
            String(request?.businessContext?.companyName || "")
              .trim()
              .toLowerCase(),
        ) &&
        /^\[(?:\s*(?:your\s*)?(?:company|company\s*name|brand)\s*)\]$/i.test(
          trimmed,
        );

      return !(shouldDropName || shouldDropPosition || shouldDropCompany);
    })
    .join("\n")
    .trim();

  const hasAllSignatureLines = signatureLines.every((line) =>
    processed.toLowerCase().includes(line.toLowerCase()),
  );

  if (hasAllSignatureLines) {
    return processed;
  }

  const hasAnyExistingSignature = hasAnySignatureReference(processed);
  const normalizedBody = hasAnyExistingSignature
    ? stripTrailingSignatureTail(processed)
    : processed;

  const isImportant = isImportantMessageRequest(request);
  const signOff = isImportant ? "Best regards," : "Best,";
  const hasSignOff =
    /(best regards|regards|sincerely|thanks|thank you|best|warm regards|kind regards),?\s*$/i.test(
      normalizedBody,
    );

  const finalizedWithSingleSignOff = hasSignOff
    ? `${normalizedBody}\n\n${signatureLines.join("\n")}`
    : `${normalizedBody}\n\n${signOff}\n\n${signatureLines.join("\n")}`;

  return collapseDuplicateTrailingSignOffs(finalizedWithSingleSignOff);
}

function postProcessGeneratedOutput(output, request) {
  const replaced = replaceKnownPlaceholders(output, request);
  return ensureSignatureBlock(replaced, request);
}

function postProcessVariants(variants, request) {
  return variants.map((variant) => ({
    ...variant,
    message: postProcessGeneratedOutput(variant.message, request),
  }));
}

function buildSignatureInstruction(request) {
  const ctx = request.businessContext || {};
  const name = String(ctx.yourName || "").trim();
  const position = String(ctx.yourPosition || "").trim();
  const company = String(ctx.companyName || "").trim();
  const formality = Number(request.tone?.formality ?? 3);

  if (!name) {
    return "Do NOT add any sign-off, signature, or closing line at the end. End the message body directly.";
  }

  // Formal/important threshold: formality >= 4
  const isFormal = formality >= 4;

  if (isFormal) {
    // Important/formal: Name + Position + Company (all available)
    const lines = [name];
    if (position) lines.push(position);
    if (company) lines.push(company);
    return `End the message with a professional sign-off followed by a line break, then the sender signature on separate lines:\n${lines.join("\n")}\nDo NOT write [Your Name], [Your Position], or any bracket placeholders.`;
  } else {
    // Casual/friendly: Name + Company only
    const lines = [name];
    if (company) lines.push(company);
    return `End the message with a warm sign-off followed by a line break, then the sender signature on separate lines:\n${lines.join("\n")}\nDo NOT write [Your Name] or any bracket placeholders.`;
  }
}

function buildFormatInstruction(request) {
  const rawInput = String(request?.rawInput || "").toLowerCase();
  const hasListIntent =
    /\b(list|bullet|bullets|points|options|steps|requirements|details)\b/.test(rawInput) ||
    /清单|列表|要点|几点|步骤|要求|明细/.test(rawInput);
  const hasTableIntent =
    /\b(table|spreadsheet|excel|csv|sheet|rows?|columns?|quotation|quote sheet|price list)\b/.test(rawInput) ||
    /表格|电子表格|excel|报价单|报价表|清单表|行|列/.test(rawInput);

  if (hasTableIntent && !hasListIntent) {
    return [
      "Format intent: The contact appears to need structured table/spreadsheet information.",
      "If a spreadsheet/table is already provided in User Input, preserve its meaning and do not rewrite random table values.",
      "Write the reply around the table or attachment naturally, and do not force unrelated bullet lists.",
    ].join(" ");
  }

  if (hasListIntent && !hasTableIntent) {
    return [
      "Format intent: The contact appears to need a simple list.",
      "Use a short, clean numbered or bulleted list in the reply.",
      "Do NOT invent a table, spreadsheet, attachment, rows, or columns unless the contact explicitly asked for one.",
    ].join(" ");
  }

  return [
    "Format intent: Choose the simplest format that matches the contact's request.",
    "Use a list for list-style requests, use table/spreadsheet wording only for clear table or attachment requests, and never force a spreadsheet when normal bullets are enough.",
  ].join(" ");
}

function attachmentContextSection(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return "No attachment context provided.";
  }

  return attachments
    .map((item, index) => {
      const confidence = Math.round(Number(item.confidence || 0) * 100);
      const lines = [
        `Attachment ${index + 1}: ${item.filename}`,
        `Type: ${item.extension || item.mimeType || "unknown"}`,
        `Status: ${item.status}`,
        `Confidence: ${confidence}%`,
      ];
      if (item.summary) lines.push(`Summary: ${item.summary}`);
      if (item.extractedText && item.extractedText !== item.summary) {
        lines.push(`Extracted text: ${item.extractedText}`);
      }
      if (Array.isArray(item.warnings) && item.warnings.length) {
        lines.push(`Warnings: ${item.warnings.join("; ")}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function buildMessages(request) {
  const crossLanguageFragment = buildCrossLanguageFragment(request.crossLanguage);
  const translateDraftFragment = buildTranslateDraftFragment(request.generationContext);
  const voiceProfileFragment = buildVoiceProfileFragment(request.voiceProfile);
  const system = [
    "You are Reply Assistant, a professional sales communication copilot.",
    translateDraftFragment
      ? "Translate the draft per the translation task below."
      : "Generate one polished, practical message that is ready to send.",
    "Keep the response concise, specific, and action-oriented.",
    "CRITICAL: Never use bracket placeholders like [Your Name], [Your Position], [Name], or similar. Always use the real values from Business Context.",
    "Use memory carefully: preserve continuity from recent replies, reuse snippet ideas only when they fit, and adapt everything to the current request instead of sounding templated.",
    "Respect the requested format: lists stay as lists; tables/spreadsheets are used only when the contact clearly asks for rows, columns, Excel, CSV, pricing sheets, or attachment-style data.",
    "Do not include explanations or analysis unless explicitly requested.",
    translateDraftFragment,
    crossLanguageFragment,
    voiceProfileFragment,
  ]
    .filter(Boolean)
    .join(" ");

  const user = [
    `Mode: ${request.mode}`,
    `Recipient: ${request.recipient}`,
    `Text Type: ${request.textType}`,
    `Language: ${request.language}`,
    `Tone: formality ${request.tone?.formality ?? 3}/5, warmth ${request.tone?.warmth ?? 3}/5, urgency ${request.tone?.urgency ?? 3}/5, confidence ${request.tone?.confidence ?? 3}/5`,
    "Business Context:",
    businessContextSection(request.businessContext),
    "Contact Thread Context:",
    contactThreadSection(request.contactThread),
    "Recent Reply Memory:",
    recentReplyMemorySection(request.recentReplies),
    "Reusable Snippets:",
    snippetMemorySection(request.snippetMemory),
    "Generation Context:",
    generationContextSection(request.generationContext),
    "Attachment Context:",
    attachmentContextSection(request.attachmentContext),
    "User Input:",
    request.rawInput,
    "Attachment rule: use attachment context only when relevant. Do not invent values that are not present in extracted text or summaries. If attachment confidence is low or text extraction is unavailable, ask the user to verify instead of claiming details.",
    buildFormatInstruction(request),
    buildSignatureInstruction(request),
    "Return only the final message body.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

async function callProvider(provider, request) {
  const config = getProviderConfig(provider);
  if (!config || !config.apiKey || !config.model || !config.baseUrl) {
    throw new Error(`Provider ${provider} is missing required configuration`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.6,
        messages: buildMessages(request),
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        typeof data?.error?.message === "string"
          ? data.error.message
          : response.statusText;
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }

    const rawOutput = extractOutput(data);
    if (!rawOutput) {
      throw new Error("Provider returned an empty response");
    }

    const output = postProcessGeneratedOutput(rawOutput, request);
    const variants = postProcessVariants(
      buildVariants(output, request),
      request,
    );
    const insight = buildInsight(request);

    return {
      output,
      variants,
      insight,
      providerUsed: provider,
      modelUsed: String(data?.model || config.model),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveUserIdFromRequest(req) {
  if (!supabase) return null;

  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) return null;

  return data.user.id;
}

const SUPPORT_ISSUE_IDS = new Set([
  "account-auth",
  "contacts-memory",
  "reply-generation",
  "email-sync",
  "desktop-app",
  "notifications",
  "billing-account",
  "data-privacy",
  "other",
]);

function isValidSupportEmail(email) {
  const trimmed = String(email || "").trim();
  return trimmed.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isValidSupportFullName(name) {
  const trimmed = String(name || "").trim();
  return trimmed.length >= 2 && trimmed.length <= 80;
}

function validateSupportRequestBody(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const displayName = String(body.displayName || "").trim();
  if (!isValidSupportFullName(displayName)) {
    return { ok: false, error: "Invalid display name" };
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!isValidSupportEmail(email)) {
    return { ok: false, error: "Invalid email" };
  }

  const issueCategory = String(body.issueCategory || "").trim();
  if (!SUPPORT_ISSUE_IDS.has(issueCategory)) {
    return { ok: false, error: "Invalid issue category" };
  }

  const message = String(body.message || "").trim();
  if (message.length < 10) {
    return { ok: false, error: "Message is too short" };
  }
  if (message.length > 200) {
    return { ok: false, error: "Message is too long" };
  }

  const phoneNumberRaw = body.phoneNumber == null ? "" : String(body.phoneNumber).trim();
  const phoneNumber = phoneNumberRaw || null;

  const appVersion =
    body.appVersion == null || body.appVersion === ""
      ? null
      : String(body.appVersion).slice(0, 64);
  const platform =
    body.platform == null || body.platform === ""
      ? null
      : String(body.platform).slice(0, 64);

  return {
    ok: true,
    value: {
      displayName,
      email,
      phoneNumber,
      issueCategory,
      message,
      appVersion,
      platform,
    },
  };
}

async function persistGenerationLog(payload) {
  if (!supabase) return;

  const record = {
    created_at: new Date().toISOString(),
    user_id: payload?.userId ?? null,
    mode: payload?.mode ?? null,
    recipient: payload?.recipient ?? null,
    text_type: payload?.textType ?? null,
    language: payload?.language ?? null,
    tone: payload?.tone ?? null,
    business_context: payload?.businessContext ?? null,
    raw_input: payload?.rawInput ?? null,
    output: payload?.output ?? null,
    provider_used: payload?.providerUsed ?? null,
    model_used: payload?.modelUsed ?? null,
    attempts: payload?.attempts ?? [],
    success: Boolean(payload?.success),
    error_message: payload?.errorMessage ?? null,
    latency_ms: payload?.latencyMs ?? null,
    cross_language: payload?.crossLanguage ?? null,
  };

  const failures = [];

  for (const table of SUPABASE_LOG_TABLE_CANDIDATES) {
    const { error } = await supabase.from(table).insert(record);
    if (!error) {
      return;
    }

    failures.push({
      table,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  console.warn("Supabase log insert failed for all candidate tables", failures);
}

function toEmailDomain(email) {
  const value = String(email || "")
    .trim()
    .toLowerCase();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return null;
  return value.slice(at + 1);
}

async function persistEmailSyncRunLog(payload) {
  if (!supabase) return;

  const syncConfig =
    payload?.syncConfig && typeof payload.syncConfig === "object"
      ? payload.syncConfig
      : {};
  const contacts = Array.isArray(payload?.contacts) ? payload.contacts : [];
  const contactsWithEmail = contacts.filter((contact) =>
    Boolean(String(contact?.email || "").trim()),
  );

  const summary =
    payload?.summary && typeof payload.summary === "object"
      ? payload.summary
      : {};

  const record = {
    created_at: new Date().toISOString(),
    provider: String(syncConfig.provider || "imap")
      .trim()
      .toLowerCase(),
    mailbox: String(syncConfig.mailbox || "INBOX").trim() || "INBOX",
    username_domain: toEmailDomain(syncConfig.username),
    since_days: Number.isFinite(Number(syncConfig.sinceDays))
      ? Number(syncConfig.sinceDays)
      : null,
    max_messages: Number.isFinite(Number(syncConfig.maxMessages))
      ? Number(syncConfig.maxMessages)
      : null,
    contacts_count: contacts.length,
    contacts_with_email_count: contactsWithEmail.length,
    fetched_messages: Number.isFinite(Number(summary.fetchedMessages))
      ? Number(summary.fetchedMessages)
      : 0,
    matched_messages: Number.isFinite(Number(summary.matchedMessages))
      ? Number(summary.matchedMessages)
      : 0,
    updated_contacts: Number.isFinite(Number(summary.updatedContacts))
      ? Number(summary.updatedContacts)
      : 0,
    success: Boolean(payload?.success),
    error_message: payload?.errorMessage ?? null,
    latency_ms: Number.isFinite(Number(payload?.latencyMs))
      ? Number(payload.latencyMs)
      : null,
  };

  const { error } = await supabase
    .from(SUPABASE_EMAIL_SYNC_TABLE)
    .insert(record);
  if (error) {
    console.warn("Supabase email sync log insert failed", {
      table: SUPABASE_EMAIL_SYNC_TABLE,
      message: error.message || "unknown_error",
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

app.get("/health", (_req, res) => {
  const preferredProvider = String(
    process.env.AI_PROVIDER || "deepseek",
  ).toLowerCase();
  const configuredProviders = SUPPORTED_PROVIDERS.filter(isProviderConfigured);

  res.json({
    status: "ok",
    preferredProvider,
    configuredProviders,
    supabaseLogging: Boolean(supabase),
  });
});

/**
 * GET /api/status
 * Fast provider availability snapshot — no live AI calls.
 * Returns the preferred provider, which providers have credentials configured,
 * and whether Supabase logging is active.
 */
app.get("/api/status", (_req, res) => {
  const preferredProvider = String(
    process.env.AI_PROVIDER || "deepseek",
  ).toLowerCase();
  const configuredProviders = SUPPORTED_PROVIDERS.filter(isProviderConfigured);

  res.json({
    preferredProvider,
    configuredProviders,
    supabaseLogging: Boolean(supabase),
    checkedAt: new Date().toISOString(),
  });
});

app.get("/api/diagnostics/providers", async (req, res) => {
  const preferredProvider = String(
    process.env.AI_PROVIDER || "deepseek",
  ).toLowerCase();
  const providersToCheck = getProviderOrder(preferredProvider);
  const diagnosticsInput =
    typeof req.query.input === "string" && req.query.input.trim().length > 0
      ? req.query.input.trim()
      : "Write one concise, friendly follow-up sentence after sharing pricing.";

  const diagnosticRequest = {
    mode: "reply",
    recipient: "existing-client",
    textType: "diagnostic",
    language: "English",
    tone: { formality: 3, warmth: 4, urgency: 2, confidence: 3 },
    businessContext: null,
    rawInput: diagnosticsInput,
    mirrorMode: false,
  };

  const results = [];

  for (const provider of providersToCheck) {
    if (!isProviderConfigured(provider)) {
      results.push({
        provider,
        configured: false,
        status: "skipped",
        reason: "missing_config",
      });
      continue;
    }

    const startedAt = Date.now();

    try {
      const response = await callProvider(provider, diagnosticRequest);
      results.push({
        provider,
        configured: true,
        status: "ok",
        modelUsed: response.modelUsed,
        latencyMs: Date.now() - startedAt,
        sampleOutput: response.output.slice(0, 180),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown_error";
      results.push({
        provider,
        configured: true,
        status: "failed",
        reason,
        latencyMs: Date.now() - startedAt,
      });
    }
  }

  return res.json({
    preferredProvider,
    checkedAt: new Date().toISOString(),
    results,
  });
});

app.post("/api/email/oauth/url", async (req, res) => {
  try {
    const authUrl = buildOAuthAuthorizationUrl(req.body);
    return res.json({ ok: true, authUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build OAuth URL";
    return res.status(400).json({ ok: false, error: message });
  }
});

app.post("/api/email/oauth/token", async (req, res) => {
  try {
    const token = await exchangeOAuthCode(req.body);
    return res.json({ ok: true, token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to exchange OAuth code";
    return res.status(400).json({ ok: false, error: message });
  }
});

app.post("/api/email/sync", async (req, res) => {
  const startedAt = Date.now();

  try {
    const result = await syncEmailContactContexts(req.body);
    if (!result.ok) {
      void persistEmailSyncRunLog({
        syncConfig: req.body?.syncConfig,
        contacts: req.body?.contacts,
        summary: result.summary,
        success: false,
        errorMessage: result.error || "Email sync validation failed",
        latencyMs: Date.now() - startedAt,
      });
      return res.status(400).json(result);
    }

    void persistEmailSyncRunLog({
      syncConfig: req.body?.syncConfig,
      contacts: req.body?.contacts,
      summary: result.summary,
      success: true,
      errorMessage: null,
      latencyMs: Date.now() - startedAt,
    });

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email sync failed";
    void persistEmailSyncRunLog({
      syncConfig: req.body?.syncConfig,
      contacts: req.body?.contacts,
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
      success: false,
      errorMessage: message,
      latencyMs: Date.now() - startedAt,
    });
    return res.status(500).json({
      ok: false,
      error: message,
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    });
  }
});

app.post("/api/telegram/sync", async (req, res) => {
  const startedAt = Date.now();

  try {
    const result = await syncTelegramContactContexts(req.body);
    if (!result.ok) {
      void persistEmailSyncRunLog({
        syncConfig: { ...(req.body?.syncConfig || {}), provider: "telegram" },
        contacts: req.body?.contacts,
        summary: result.summary,
        success: false,
        errorMessage: result.error || "Telegram sync validation failed",
        latencyMs: Date.now() - startedAt,
      });
      return res.status(400).json(result);
    }

    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "telegram" },
      contacts: req.body?.contacts,
      summary: result.summary,
      success: true,
      errorMessage: null,
      latencyMs: Date.now() - startedAt,
    });

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Telegram sync failed";
    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "telegram" },
      contacts: req.body?.contacts,
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
      success: false,
      errorMessage: message,
      latencyMs: Date.now() - startedAt,
    });
    return res.status(500).json({
      ok: false,
      error: message,
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    });
  }
});

app.post("/api/dingtalk/webhook", async (req, res) => {
  try {
    const result = await ingestDingTalkWebhook(req.body);
    if (!result.ok) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DingTalk webhook ingest failed";
    return res.status(500).json({ ok: false, error: message, ingested: 0 });
  }
});

app.post("/api/dingtalk/sync", async (req, res) => {
  const startedAt = Date.now();

  try {
    const result = await syncDingTalkContactContexts(req.body);
    if (!result.ok) {
      void persistEmailSyncRunLog({
        syncConfig: { ...(req.body?.syncConfig || {}), provider: "dingtalk" },
        contacts: req.body?.contacts,
        summary: result.summary,
        success: false,
        errorMessage: result.error || "DingTalk sync validation failed",
        latencyMs: Date.now() - startedAt,
      });
      return res.status(400).json(result);
    }

    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "dingtalk" },
      contacts: req.body?.contacts,
      summary: result.summary,
      success: true,
      errorMessage: null,
      latencyMs: Date.now() - startedAt,
    });

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DingTalk sync failed";
    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "dingtalk" },
      contacts: req.body?.contacts,
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
      success: false,
      errorMessage: message,
      latencyMs: Date.now() - startedAt,
    });
    return res.status(500).json({
      ok: false,
      error: message,
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    });
  }
});

app.post("/api/wechat/webhook", async (req, res) => {
  try {
    const result = await ingestWeChatWebhook(req.body);
    if (!result.ok) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WeChat webhook ingest failed";
    return res.status(500).json({ ok: false, error: message, ingested: 0 });
  }
});

app.post("/api/wechat/sync", async (req, res) => {
  const startedAt = Date.now();

  try {
    const result = await syncWeChatContactContexts(req.body);
    if (!result.ok) {
      void persistEmailSyncRunLog({
        syncConfig: { ...(req.body?.syncConfig || {}), provider: "wechat" },
        contacts: req.body?.contacts,
        summary: result.summary,
        success: false,
        errorMessage: result.error || "WeChat sync validation failed",
        latencyMs: Date.now() - startedAt,
      });
      return res.status(400).json(result);
    }

    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "wechat" },
      contacts: req.body?.contacts,
      summary: result.summary,
      success: true,
      errorMessage: null,
      latencyMs: Date.now() - startedAt,
    });

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WeChat sync failed";
    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "wechat" },
      contacts: req.body?.contacts,
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
      success: false,
      errorMessage: message,
      latencyMs: Date.now() - startedAt,
    });
    return res.status(500).json({
      ok: false,
      error: message,
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    });
  }
});

app.get("/api/whatsapp/webhook", (req, res) => {
  const mode = String(req.query["hub.mode"] || "");
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = String(req.query["hub.challenge"] || "");
  const expected = String(process.env.WHATSAPP_VERIFY_TOKEN || "").trim();

  if (mode === "subscribe" && expected && token === expected) {
    return res.status(200).send(challenge);
  }

  return res
    .status(403)
    .json({ ok: false, error: "Webhook verification failed" });
});

app.post("/api/whatsapp/webhook", async (req, res) => {
  try {
    const result = await ingestWhatsAppWebhook(req.body);
    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WhatsApp webhook ingest failed";
    return res.status(500).json({ ok: false, error: message, ingested: 0 });
  }
});

app.post("/api/whatsapp/sync", async (req, res) => {
  const startedAt = Date.now();

  try {
    const result = await syncWhatsAppContactContexts(req.body);
    if (!result.ok) {
      void persistEmailSyncRunLog({
        syncConfig: { ...(req.body?.syncConfig || {}), provider: "whatsapp" },
        contacts: req.body?.contacts,
        summary: result.summary,
        success: false,
        errorMessage: result.error || "WhatsApp sync validation failed",
        latencyMs: Date.now() - startedAt,
      });
      return res.status(400).json(result);
    }

    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "whatsapp" },
      contacts: req.body?.contacts,
      summary: result.summary,
      success: true,
      errorMessage: null,
      latencyMs: Date.now() - startedAt,
    });

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WhatsApp sync failed";
    void persistEmailSyncRunLog({
      syncConfig: { ...(req.body?.syncConfig || {}), provider: "whatsapp" },
      contacts: req.body?.contacts,
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
      success: false,
      errorMessage: message,
      latencyMs: Date.now() - startedAt,
    });
    return res.status(500).json({
      ok: false,
      error: message,
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    });
  }
});

app.get("/api/product-announcements", async (req, res) => {
  if (!supabase) {
    return res.json({ ok: true, announcements: [] });
  }

  const localeRaw = String(req.query.locale || "en").toLowerCase();
  const locale = localeRaw.startsWith("zh") ? "zh" : "en";
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("product_announcements")
    .select("id, title, body, published_at, expires_at")
    .eq("is_active", true)
    .eq("locale", locale)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false });

  if (error) {
    if (String(error.message || "").includes("product_announcements")) {
      return res.json({ ok: true, announcements: [] });
    }
    return res.status(500).json({ error: error.message || "Could not load announcements" });
  }

  const announcements = (Array.isArray(data) ? data : [])
    .filter((row) => {
      if (!row?.expires_at) return true;
      return new Date(row.expires_at).getTime() > Date.now();
    })
    .map((row) => ({
      id: String(row.id),
      title: String(row.title || "").trim(),
      body: String(row.body || "").trim(),
      publishedAt: row.published_at ? Date.parse(String(row.published_at)) : Date.now(),
    }))
    .filter((row) => row.title.length > 0 && row.body.length > 0);

  return res.json({ ok: true, announcements });
});

app.post("/api/support/request", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Support requests are not configured" });
  }

  const userId = await resolveUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const validation = validateSupportRequestBody(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const { value } = validation;
  const { data, error } = await supabase
    .from("support_requests")
    .insert({
      user_id: userId,
      display_name: value.displayName,
      email: value.email,
      phone_number: value.phoneNumber,
      issue_category: value.issueCategory,
      message: value.message,
      app_version: value.appVersion,
      platform: value.platform,
    })
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: error.message || "Could not submit support request" });
  }

  return res.json({ ok: true, id: data.id });
});

app.post("/api/account/delete", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Account deletion is not configured" });
  }

  const userId = await resolveUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return res.status(500).json({ error: error.message || "Could not delete account" });
  }

  return res.json({ ok: true });
});

app.post("/api/generate", async (req, res) => {
  const startedAt = Date.now();
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const request = normalizeGenerateRequest(req.body);
  const validation = validateGenerateRequest(request);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const userId = await resolveUserIdFromRequest(req);
  const preferredProvider = String(
    request.preferredProvider || process.env.AI_PROVIDER || "deepseek",
  ).toLowerCase();
  const providersToTry = getProviderOrder(preferredProvider);
  const attempts = [];

  for (const provider of providersToTry) {
    const configured = isProviderConfigured(provider);

    if (!configured) {
      attempts.push({ provider, status: "skipped", reason: "missing_config" });
      continue;
    }

    try {
      const result = await callProvider(provider, request);
      attempts.push({ provider, status: "ok" });

      void persistGenerationLog({
        ...request,
        userId,
        output: result.output,
        variants: result.variants,
        insight: result.insight,
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
        attempts,
        success: true,
        latencyMs: Date.now() - startedAt,
      });

      return res.json({
        output: result.output,
        variants: result.variants,
        insight: result.insight,
        quickActions: buildQuickActions(result.insight),
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
        attempts,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown_error";
      attempts.push({ provider, status: "failed", reason });
    }
  }

  void persistGenerationLog({
    ...request,
    userId,
    output: null,
    providerUsed: null,
    modelUsed: null,
    attempts,
    success: false,
    errorMessage: "All configured providers failed",
    latencyMs: Date.now() - startedAt,
  });

  return res.status(502).json({
    error: "All configured providers failed",
    attempts,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  validateEnvAtStartup();
});
