# Blockers

## Current

- Git metadata is not present in this workspace; git status/diff cannot be used here.

## Recently Observed

- Verifiers that execute `tsx` may need approved network escalation because npm attempts to fetch from `registry.npmmirror.com`; observed for `verify:quality-guard` and `verify:smart-suggestions` during Guided Work Buddy v2 verification.
