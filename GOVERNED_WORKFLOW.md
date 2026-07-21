# Governed campaign workflow

`/api/governed-campaigns` records verified creator identity and audience samples, brief/rights/contract versions, disclosure approval, content approval, platform receipt, attribution evidence, payment reconciliation, and outcomes. Idempotency hashes, tenant scoping, optimistic versions, maker-checker content approval, and payee/approver separation prevent autonomous publishing or payment. Audit events preserve every state change.

Social/platform APIs, CRM, e-signature, DAM, payments/accounting, and analytics adapters are not bundled. `INFLUENCER_PROVIDER_ALLOWLIST` gates status records for approved external adapters; empty configuration fails closed. A platform receipt is evidence supplied by an adapter, not proof this repository published content.

Apply `backend/migrations/` in numeric order, then assign tenant IDs through an authorized identity-admin process. Install locked dependencies with `npm ci`, create an untracked `.env`, migrate, then use `./start.sh`. Startup is non-destructive, and the demo seed requires explicit opt-in and a caller-supplied password outside production.

No social API credentials, creator identity service, audience/fraud dataset, signed contracts, rights clearance, disclosure/legal review, payment processor, or attribution validation is supplied or claimed. These and fairness/privacy/load testing remain release blockers.
