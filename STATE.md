# State

## Current Task
Unify the verse panel header so `심화` and `해설` share the same header shell and controls.

## Route
Route B

## Writer Slot
main: implementation

## Contract Freeze
Frozen scope:
- Extract a shared verse panel header/card component.
- Reuse the shared header shell in both the `심화` body view and the `해설` panel.
- Keep the existing verse content, comic toggle, and routing behavior unchanged.

Reason for Route B:
- The change touches shared UI chrome used by both the body and commentary panels.
- The header treatment needs to stay visually aligned across two separate render paths.

## Write Sets
- main: `STATE.md`, `src/components/verse/VersePanelCard.tsx`, `src/components/verse/SutraNavigation.tsx`, `src/pages/VerseView.tsx`

## Reviewer
reviewer: manual review pending

## Last Update
2026-05-28 14:24:38 +09:00 - Split the shared verse card into a distinct header band and a different body background for clearer visual separation.

## Open Review Item
- Visual parity check still pending for the shared header placement and body contrast in the verse layouts.
