# Marketing content recovery and future operating sequence

Production target: CDKorea Org / pro / main / `fytkptzbnhfsqsktmzpx`. Rollback domain deployment: `0f88f4c82052ab3b42ab457098c67c1bdfc7faeb`. Existing content ID 4 (September 7) must never be reimported or edited as part of this recovery.

## Historical evidence boundary

The eleven recovery manifests are under `recovery/`. September 9 and 11 packages point to the original Naver, Meta, numbered Threads Markdown, five PNG cards, checklist, and status files. Their manifest `schedules` arrays are empty: the source checklist's proposed publication time is not administrator approval. The nine proposal manifests contain only the source title, proposal date, deterministic package ID/slug, original weekly Drive folder and source file IDs. They contain no copy, card, campaign, CTA, or channel schedule.

Proposal slugs use `proposal-` plus the first 16 hex characters of SHA-256 over `YYYY-MM-DD`, a newline, and the exact NFC-normalized title. `packageId` is `YYYY-MM-DD-<slug>`; each first import is version 1. Existing September 9/11 checklist UTM content identifiers supply the two complete-package slugs and campaign keys. No value is inferred for proposals.

## Recovery execution gate

1. Authenticate the administrator against the direct URL of the new Production deployment. Read `/api/admin/marketing/environment`: the project ref must exactly match `fytkptzbnhfsqsktmzpx`; any unknown/mismatch blocks the domain switch and imports. Verify four existing contents, content ID 4 status, readiness display, proposal and complete import UI, and no server errors.
2. Preserve the old deployment/domain assignment. Assign `start.careerdirect.kr` to the tested new deployment only after all direct-URL checks pass. Reopen the custom domain and repeat the checks. On failure, reassign the old deployment immediately.
3. Upload original-evidence manifests to their existing individual folders or to per-item child folders in the three weekly proposal folders. Read the uploaded file IDs and manifest bodies back from Drive. Never overwrite source copy, cards, status, or checklists.
4. In Production SQL Editor, use SELECT-only collision preflight against source package ID, slug, title, version, campaign key where present, and proposal date or existing schedule date. Block only a colliding item. Do not rerun any package to test idempotency.
5. Use the administrator's dashboard import actions only. For each accepted import, read the content ID and detail page, then independently SELECT the content/version/audit/schedule/approval/publication rows. Proposal rows must remain `proposal` with no channel schedules. Produced rows must remain `review_pending` with no channel schedules. Both must lack approvals, publish attempts, published URLs/times, and canonical read-backs. Duplicate, Site-First, and canonical readiness remain `UNKNOWN` until actual evidence is recorded.

## Future sequence

Proposal creation → `content-package.json` creation → dashboard import → Production canonical database/detail read-back → notification with dashboard review link → administrator review/approval → authorized channel scheduling → actual manual publication → publication evidence and canonical read-back.

Drive and email do not determine workflow status. The weekly reconciliation notification now refuses to mark email delivery successful while any planned import/read-back is missing or any manifest was rejected. A failed reconciliation remains actionable in the operations monitor. No approval or publication is automatic.
