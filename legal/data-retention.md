# Data Retention & Deletion Guidelines

This document establishes baseline retention periods and disposal processes to support GDPR Article 5(1)(e), ISO 27001 Annex A.8, and SOC 2 CC3/CC4 controls. Periodically review with Legal/Privacy counsel to align with evolving regulatory requirements and contractual obligations.

---

## 1. Retention Summary

| Data Category                        | Default Retention                                | Notes / Disposal Actions                                     |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------ |
| **User Accounts**                    | Active duration + 30 days post deletion          | Soft delete immediately; hard delete/anonymize after 30 days |
| **Authentication Logs / Audit**      | 365 days                                         | Export to immutable storage; purge beyond retention          |
| **Sessions / Tokens**                | Until expiry; revoked immediately upon incident  | Already deleted via user/org soft delete transaction         |
| **Consents**                         | Active duration + 2 years                        | Retain for legal defensibility; anonymize once scope revokes |
| **Invitations**                      | 90 days                                          | Delete expired invitations weekly                            |
| **Webhooks / API Secrets**           | Store only encrypted versions + rotation history | Remove plaintext copies after rotation response sent         |
| **Backups**                          | 30 days rolling                                  | Ensure encrypted at rest; test restore quarterly             |
| **Support Tickets / Communications** | 2 years (subject to contractual terms)           | Redact sensitive data; follow vendor retention schedules     |

---

## 2. Deletion Procedures

### 2.1 User Hard Delete (GDPR Right to Erasure)

1. Run `GET /v1/me/export` to provide data portability to the data subject.
2. Use forthcoming erasure tooling (see compliance backlog) to anonymize/remove user records from `users`, `sessions`, `tokens`, `audit_logs`, and linked tables.
3. Trigger background job to scrub data from backups (if feasible) or note in response that backups expire within 30 days.
4. Document request, actions taken, and confirmation provided to the requester.

### 2.2 Organisation Deletion

1. Follow `organisationService.softDelete` (cascades and token revocations).
2. After retention window, schedule hard purge via maintenance task (`scripts/purge-soft-deleted.ts`).
3. Update asset inventory and notify dependent services.

### 2.3 Logs & Backups

1. Configure SIEM/log store retention to 365 days; auto-delete beyond this window.
2. Maintain encrypted database snapshots for 30 days; ensure automated purge and document retention proofs.
3. Log deletion activities in `audit_logs` for evidentiary support.

---

## 3. Automation Roadmap

- **Maintenance cron**: weekly job to purge expired invitations, sessions, and soft-deleted objects past retention window.
- **GDPR Erasure API**: extend services to perform hard deletion/anonymization, with audit trail.
- **Backup catalog**: maintain inventory (timestamp, encryption status, location) and automated purge report.

---

## 4. Compliance Checkpoints

- Review retention schedules annually with Legal/Privacy.
- Document DSAR handling flow (intake, verification, fulfilment, closure).
- Include retention controls in ISO/SOC evidence (policies, purge job logs, backup purge reports).
- Ensure vendor DPAs align with these schedules and that subprocessors honour deletion requests.
