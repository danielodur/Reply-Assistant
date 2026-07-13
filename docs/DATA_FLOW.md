# Data Flow

## Local-First Memory

Contacts, contact memory, drafts, timelines, queues, recent replies, selected contact, and reply learning stay in renderer state and localStorage.

Supabase is identity, telemetry/support, profile, and optional sync durability. It is not the canonical contact database unless explicitly approved later.

## Reply Generation Flow

1. User selects a contact and enters or syncs inbound text.
2. Renderer gathers business context, snippets, recent replies, contact thread context, attachments, language, tone, and voice profile.
3. Renderer calls `buildStructuredRequest`.
4. Renderer sends the structured payload plus optional `contactThread`.
5. API calls `normalizeGenerateRequest`.
6. API prompt assembly includes business context, contact context, recent replies, snippets, generation context, and attachment context.
7. Provider returns reply text, variants, insight, and quick actions.
8. Renderer shows the generated reply with evidence and quality signals.
9. Copy/edit/rewrite outcomes update local memory.

## Agent Coordination Flow

1. Agent reads `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, `.codex/*`, and relevant domain docs.
2. Agent performs scoped code changes.
3. Agent runs targeted verification.
4. Agent updates `.codex/*` planning files.
5. Agent updates master files and plan logs.
6. Agent does not edit `.claude/*` unless Claude runtime instructions changed.
