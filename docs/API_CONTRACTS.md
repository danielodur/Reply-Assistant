# API Contracts

Canonical detailed contract references remain:

- `API_INTEGRATION_CONTRACTS.md`
- `.codex/UPLOADS_PLAN.md`
- `apps/api/src/generateContract.js`
- `apps/web/src/components/workbench/requestModel.ts`

## Generation

Endpoint: `POST /api/generate`

Required behavior:

- Frontend builds payloads through `buildStructuredRequest`.
- Backend normalizes payloads through `normalizeGenerateRequest`.
- `contactThread` is optional and omission-safe.
- Attachment context contains summaries only, never raw binaries.
- Prompt output must not invent "Based on" evidence.

Current optional context:

- `attachmentContext`
- `crossLanguage`
- `voiceProfile`
- `contactThread.memorySummary`
- `contactThread.recentMessages`
- `contactThread.threadSummary`
- `contactThread.openCommitments`
- `contactThread.replyLearning`

## Uploads

Endpoint: `POST /api/uploads/process`

Rules:

- Composer attachments: max 3 files.
- Business context uploads: max 5 files.
- Contact uploads: max 5 files per contact.
- OCR provider order: Aliyun, Google Vision, Azure.
- Low confidence must be surfaced honestly as needs-review or failed.
