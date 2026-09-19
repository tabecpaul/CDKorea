# Marketing historical package recovery

## Scope and release boundary

Restore the eleven user-approved historical entries without changing the four existing Production contents, including content ID 4. Keep the `0f88f4c82052ab3b42ab457098c67c1bdfc7faeb` deployment as the domain rollback target. Verify `925830890e054e29004ba3c7527a01979e6459fa` at its direct URL only; do not attach the custom domain to it. Test and deploy the new importer before any domain switch. Switch `start.careerdirect.kr` once, only after authenticated direct-URL and Production-identity checks pass; revert to the rollback deployment on a failed post-switch check.

## Package types and evidence

- Complete historical packages (September 9 and 11) reference only the existing Drive copy and five card files. The importer reads the original numbered Threads Markdown directly. The recovery variant has an empty schedules array, creates `review_pending` v1 and no schedule, approval, or publication evidence. Normal complete packages still require schedules. The approval completeness gate blocks review approval until an authorized channel schedule exists.
- Proposal packages (nine entries) have a separate parser, dashboard action, and persistence function. Each carries title, explicitly named `proposedDate`, deterministic date-plus-slug package ID, deterministic `proposal-` slug derived from SHA-256 of the date and NFC-normalized exact title, source Drive folder/file IDs, and historical-recovery provenance. Their current version is v1 `proposal`. Copy, assets, channel schedules, approvals, publish attempts, and canonical read-backs are absent. Proposed dates never become `scheduled_at` values.
- The manifest accepts an optional, strictly validated recovery object containing the source folder/file IDs and recovery classification. The importer records the same provenance in its audit-log metadata. Source documents are retained unchanged; multi-item weekly folders receive per-item child folders for manifests.
- Unknown campaign and CTA values are represented as empty, explicitly incomplete values in the existing non-null columns for proposal rows only. They are not campaign keys or approved CTAs. Approval validation will reject incomplete campaign/CTA/copy/assets/schedules even if a later workflow reaches `review_pending`. No database migration is planned; if tests or Production schema checks invalidate this representation, stop before Production mutation and reassess the minimum additive migration with a dry-run and rollback plan.

## Deduplication and import

Before each import, compare package ID, slug, campaign key when known, version, title, and date against Production. A collision blocks that item only; no overwrite or re-import of ID 4. The dashboard action is the only Production write path. Immediately read back each accepted item in SQL and dashboard, including content/version IDs, proposal date or channel schedules, status, approval absence, audit provenance, and publication-evidence absence.

## Future workflow

Proposal creation → manifest creation → dashboard import → Production read-back → notification containing the dashboard review link → administrator approval → channel schedule → actual publication → publication evidence and canonical read-back. Drive and email are source artifacts, not workflow-state authority. Notification success is contingent on import and read-back. Automatic approval and publication remain disabled.

## Verification

Add tests before implementation for both manifest variants, missing-data preservation, proposal idempotency and collision isolation, no-schedule/no-approval/no-publication invariants, approval gate, and notification ordering. Run relevant tests, full typecheck, lint, and build. Verify the new deployment at its direct URL with authenticated administrator access and Production ref `fytkptzbnhfsqsktmzpx` before domain reassignment. Re-read the custom domain and Production DB after reassignment and after each import.
