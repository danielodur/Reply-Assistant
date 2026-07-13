# Uploads And OCR Plan

Last updated: 2026-06-04

Canonical Claude Code / Codex planning file for upload attachments and OCR. Migrated in full from the now-removed root `UPLOADS.md` so the spec, invariants, and shipped status all live in `.codex/`.

This is a **shipped** spec. Frontend modules under `apps/web/src/uploads/*` and `apps/web/src/components/uploads/*`, and backend modules under `apps/api/src/ocr/*`, already implement the architecture below. Treat this file as the source of truth for behavior, limits, and rules — not as an open TODO list.

## Product Goal

Replace any manual table-creation flow with a low-friction upload flow. Users attach real files they received from clients or already have on their machine, and Reply Assistant uses extracted document context to produce more accurate replies without cluttering the composer.

The `+` button in the Floating Assistant composer is an attachment picker, not a table builder.

Core promise:

> Attach up to three relevant client or company files, let the app read the useful context, and generate a better grounded reply without asking the user to recreate tables by hand.

## UX Rules

- No clutter: the composer keeps one small `+` button.
- The `+` button opens a native file picker or a compact attachment picker.
- Users can attach up to 3 files per reply draft.
- The `+` button shows a tiny number badge when files are attached.
- Do not show file previews in the main composer.
- Show only compact file chips or a review list inside an existing modal/picker if needed.
- Supported visible type labels: `csv`, `xlsx`, `pdf`, `png`, `jpg`, `ppt`, `doc`.
- Do not make users manually create tables.
- If OCR or parsing confidence is low, flag the attachment for review instead of pretending the content is reliable.

## Supported Upload Locations

### 1. Composer Reply Attachments

Purpose: files received from a client or relevant to the reply being drafted.

Examples: client spreadsheets, receipts, brochures, catalogues, product images, PDF quotations, screenshots, PPT/PPTX decks.

Limits:

- Maximum **3** files attached to one composer draft.
- These attachments are temporary draft context unless the user saves the generated reply to a contact timeline.

Generation behavior:

- Extracted summaries are included in generation context.
- The model must treat attachment content as evidence, not as permission to invent missing values.
- If a file cannot be parsed, the reply must not claim its contents.

### 2. Business Context Attachments

Purpose: enrich the user's company self-introduction and company knowledge.

Examples: company brochure, product catalogue, company website screenshots, price list, service one-pager, presentation deck.

Limits:

- Maximum **5** business-context files.
- Store extracted summaries locally with business context.
- Do not upload or process files unless the user attaches them.

Generation behavior:

- Business attachment summaries become part of business context.
- The reply should use these summaries only when relevant to the current message.

### 3. Contact Company Attachments

Purpose: enrich what the app knows about the contact's workplace or company.

Examples: client brochure, client catalogue, client receipt or invoice, client company screenshots, product spec sheet.

Limits:

- Maximum **5** contact files per contact.
- Optional during contact creation.
- Editable later from the contact memory/detail area.

Generation behavior:

- Contact attachment summaries become part of contact thread context.
- The reply should distinguish user's company facts from contact/company facts.

## File Type Scope

Initial accepted extensions:

- Images: `.png`, `.jpg`, `.jpeg`, `.webp`
- Spreadsheets: `.csv`, `.xlsx`
- Documents: `.pdf`, `.docx`
- Presentations: `.pptx`

Deferred unless explicitly needed:

- Audio/video.
- Archives.
- Password-protected files.
- Very large spreadsheets.
- Scanned multi-page PDFs beyond provider limits.

Size policy:

- Suggested per-file max: **10 MB**.
- Suggested per-image max sent to OCR: compress or resize before OCR where possible.
- Reject oversized files with a plain message.

## Data Model

Frontend types live in `apps/web/src/uploads/uploadTypes.ts`.

Core types:

- `UploadSource`: `composer` | `business-context` | `contact`
- `UploadKind`: `image` | `spreadsheet` | `pdf` | `document` | `presentation`
- `UploadStatus`: `pending` | `processing` | `ready` | `needs-review` | `failed`
- `UploadContextSummary`:
  - `id`
  - `source`
  - `contactId?`
  - `filename`
  - `extension`
  - `mimeType`
  - `sizeBytes`
  - `hash`
  - `status`
  - `summary`
  - `extractedText`
  - `structuredPreview?`
  - `confidence`
  - `provider?`
  - `createdAt`
  - `expiresAt?`

Storage:

- Composer attachments: component state only.
- Business context attachments: localStorage key `replyAssistantBusinessUploads`.
- Contact attachments: stored inside contact threads or a parallel localStorage key keyed by contact id.
- **Do not store raw binary files in localStorage.** Store extracted summaries and hashes only.

## OCR And Parsing Architecture

Backend OCR modules:

- `apps/api/src/ocr/OCRService.js`
- `apps/api/src/ocr/AliyunOCRProvider.js`
- `apps/api/src/ocr/GoogleVisionProvider.js`
- `apps/api/src/ocr/AzureComputerVisionProvider.js`
- `apps/api/src/ocr/ocrCache.js`
- `apps/api/src/ocr/ocrRoutes.js`

Provider order:

1. **Aliyun OCR** — primary for China launch.
2. **Google Vision** — fallback and future primary outside China.
3. **Azure Computer Vision** — last fallback, optional until keys are provided.

Provider contract:

- `extractText({ buffer, mimeType, filename, languageHints })`
- Returns: `text`, `confidence`, `provider`, `pages?`, `warnings?`

Confidence thresholds:

- `confidence >= 0.85` → `ready`
- `0.65 <= confidence < 0.85` → `needs-review`
- `confidence < 0.65` → retry next provider if available, otherwise `failed` / `needs-review`

Caching:

- Hash files by **SHA-256**.
- Cache OCR results by file hash for at least **30 days**.
- Never call OCR again for the same hash unless the user explicitly retries.
- Cache `provider`, `confidence`, `extractedText`, `warnings`, `createdAt`, `expiresAt`.

Parsing strategy by file type:

- CSV/XLSX: use **local parsers first**, not OCR.
- PDFs: try **text extraction first**; use OCR only for scanned/image PDFs.
- Images: use OCR.
- PPTX/DOCX: use document parsers where practical; OCR only for image-heavy documents.

## API Contract

Upload processing endpoint: `POST /api/uploads/process`

Request (multipart form data):

- Up to 3 composer files, or one profile/contact upload batch.
- `source`: `composer` | `business-context` | `contact`
- `contactId?`

Response:

- `uploads`: `UploadContextSummary[]`

Generation attachment context — `/api/generate` accepts:

- `attachmentContext?: UploadContextSummary[]`

Frontend sends summaries only, never raw files. Backend normalizes to at most:

- 3 composer summaries
- 5 business summaries
- 5 contact summaries

Prompt wording rules:

- Use attachment context only when relevant.
- Do not invent values not present in extracted text.
- If extraction confidence is low, mention uncertainty or ask the user to verify.

If no provider keys are configured, return a clear `unavailable` / `needs-review` state. **Never fake OCR.**

## Frontend Modules

Logic (shipped):

- `apps/web/src/uploads/uploadTypes.ts`
- `apps/web/src/uploads/uploadValidation.ts`
- `apps/web/src/uploads/uploadApi.ts`
- `apps/web/src/uploads/useComposerAttachments.ts`
- `apps/web/src/uploads/useBusinessUploads.ts`
- `apps/web/src/uploads/useContactUploads.ts`

UI (shipped):

- `apps/web/src/components/uploads/AttachmentPicker.tsx`
- `apps/web/src/components/uploads/AttachmentReviewList.tsx`
- `apps/web/src/components/uploads/CompactUploadRow.tsx`
- `apps/web/src/components/uploads/ComposerAttachmentStrip.tsx`
- `apps/web/src/components/uploads/LastLearningFileRemovalDialog.tsx`

Composer behavior:

- `ComposerPanel` renders the attachment entry point (compact `+` with count badge).
- No `TableHelperModal` — the manual table flow was removed during this migration.
- Attachment-related copy uses EN + ZH keys at the same commit.

Business Context surface:

- Compact attachment row inside `BusinessContext`.
- Limit 5 files.
- Stores summaries / hashes / extracted text locally.
- Shows count or a compact review action, not previews.

Contact surface:

- Optional attachment upload during contact creation.
- Attachment management inside contact detail/memory area.
- Limit 5 files per contact.
- Summaries flow into contact generation context.

## Deprecated / Removed

The manual table-helper flow has been retired. The following were removed and must not be reintroduced unless the user explicitly approves a new spreadsheet flow:

- `apps/web/src/components/workbench/TableHelperModal.tsx`
- State: `isTableHelperOpen`, `PendingSpreadsheet`, `pendingSpreadsheet`
- Handlers: `handleDownloadTableCsv`, `handleInsertTable`, `handleOpenPendingSpreadsheet`
- The `onOpenTableHelper` prop (replaced by `onAttachFiles`)
- Table-helper translation keys (replaced by attachment keys)

Retained:

- Backend prompt guardrails that prevent invented tables.
- Any table/spreadsheet wording that helps the model respond to real spreadsheet attachments.

## Security And Privacy

- Files are user-selected only. **No background directory scanning.**
- No raw binary file persistence in localStorage.
- Do not send files to OCR until the user attaches them.
- Show clear errors for unsupported, oversized, or unreadable files.
- Cache OCR results by hash, **not by filename alone**.
- Avoid logging extracted sensitive document text.
- API keys remain backend-only:
  - `ALIYUN_OCR_*`
  - `GOOGLE_APPLICATION_CREDENTIALS` (or equivalent Google Vision env)
  - `AZURE_COMPUTER_VISION_*`

## Acceptance Checks

Composer:

- Clicking `+` opens file selection, not manual table creation.
- Up to 3 files can be attached.
- The `+` button shows a tiny count badge.
- File types are validated.
- Unsupported or oversized files show a calm error.
- No file previews clutter the composer.
- Generated reply includes useful attachment context when extraction succeeds.
- Low-confidence OCR is flagged for review.

Business context:

- User can attach up to 5 company files.
- Extracted summaries are saved locally.
- Business attachment summaries are included in generation context.
- UI stays compact.

Contact:

- User can attach up to 5 contact/company files.
- Contact attachment summaries are included in contact context.
- Contact creation remains simple when no files are attached.

OCR:

- Aliyun is tried first when configured.
- Google Vision is fallback when configured.
- Azure is last fallback when configured.
- Result cache prevents duplicate OCR calls for the same file hash.
- Low confidence follows the threshold rules above.
- Missing provider keys do not fake OCR results.

Build:

```bash
npm run build
```

## Non-Goals (First Pass — Still In Effect)

- No drag-and-drop requirement.
- No live file preview grid in the composer.
- No OCR editing studio.
- No cloud file storage.
- No automatic scanning of folders.
- No fake OCR when providers are not configured.
- No unlimited uploads.

## Open Follow-Ups

- Make low-confidence attachment summaries visible and non-deceptive in the UI (see `.codex/DEVELOPMENT_PLAN.md` → "Near-Term Work Candidates" → "Upload confidence handling").
- Continue to surface `needs-review` clearly when extraction is weak.

## Plan Update Rules

This file is governed by the standard planning protocol (`/CLAUDE.md` → "Planning Protocol", `AGENTS.md` → "Codex Planning Protocol"). When upload/OCR behavior, limits, providers, confidence thresholds, caching, or contract shape changes:

- Update this file in the same change set as the code change.
- Append a dated entry to `.codex/CHANGELOG.md`.
- Update `.codex/FEATURE_GUARDS.md` → "Upload Guards" only if a new invariant emerges.
- Update `.codex/DEVELOPMENT_PLAN.md` only if priorities, shipped status, or near-term work shifts.
- Sync the Codex and Claude Code peer skills (`reply-assistant-generation-contract`) if the workflow rule itself changes.
- Never delete a shipped upload behavior from this file without explicit user approval.
