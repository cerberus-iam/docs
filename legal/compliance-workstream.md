# Compliance Workstream Charter

This document bootstraps the cross-functional program needed to deliver ISO 27001, SOC 2 Type II, and GDPR readiness for the Cerberus IAM API. It outlines ownership, artefacts, and timelines so engineering, security, and legal/privacy stakeholders can collaborate effectively.

---

## 1. Roles & RACI

| Function / Role                                                            | Responsibilities                                                     | RACI |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| **Compliance Lead** (Security)                                             | Overall program management, control mapping, audit liaison           | A/R  |
| **Engineering Manager**                                                    | Implements technical controls, delivers evidence, maintains runbooks | A/R  |
| **Legal & Privacy Counsel**                                                | Drafts privacy notices, DPAs, DSAR workflow, GDPR legal review       | A/R  |
| **People Ops / HR**                                                        | On/offboarding processes, background checks, training records        | C/R  |
| **IT / DevOps**                                                            | Infrastructure hardening, backup/DR plans, change management tooling | C/R  |
| **Executive Sponsor** (Jerome Thayananthajothy – <tjthavarshan@gmail.com>) | Approves policies, provides budget, resolves blockers                | A/I  |

RACI legend: Responsible, Accountable, Consulted, Informed.

---

## 2. Deliverables

### 2.1 Policy Suite (ISO/SOC 2 Required)

- Information Security Policy & Statement of Applicability
- Access Control & Identity Management Policy
- Secure Development & Change Management Policy
- Incident Response Plan & Communications Matrix
- Business Continuity / Disaster Recovery Plan
- Vendor & Third-Party Risk Management Policy
- Data Retention & Disposal Policy
- Privacy Notice, Data Processing Agreement (DPA), and Consent Policy
- HR Security & Acceptable Use Policies (background checks, training)

### 2.2 Technical Runbooks

- JWT signing key rotation (existing: `docs/operations.md`)
- Webhook/API key rotation and audit logging (existing)
- Refresh token family revocation (existing)
- DSAR handling (export, rectify, delete)
- Consent revocation and auditing
- Backup/restore drill with RTO/RPO documentation
- Vulnerability management / patch cadence

### 2.3 Evidence & Monitoring

- Centralized logging (authentication, RBAC, config changes, failed logins) forwarded to SIEM
- Metrics and alerts (rate-limit breaches, webhook failures, MFA disable events)
- Quarterly access reviews and change ticket samples
- Penetration test & vulnerability scan reports
- Training completion records and onboarding/offboarding checklists
- Processor/subprocessor inventory and data flow diagrams

---

## 3. Workstream Phases

### Phase 1 – Gap Analysis (2 weeks)

1. Map current controls to ISO 27001 Annex A / SOC 2 Trust Services Criteria.
2. Conduct GDPR Article 30 data inventory and identify lawful bases for processing.
3. Document deficiencies in people, process, technology.
4. Produce remediation backlog with risk/severity tags.

### Phase 2 – Policy & Control Implementation (4–6 weeks)

1. Draft policies listed above; obtain executive approval.
2. Implement missing technical safeguards (e.g., DSAR tooling, consent revocation API, encrypted logs, distributed rate limiting).
3. Integrate ticketing/change management workflows for production deployments.
4. Configure monitoring/alerting and evidence collection (log retention, backups, training).

### Phase 3 – Validation & Readiness (6–8 weeks)

1. Run tabletop exercises (incident response, DR/BCP, DSAR).
2. Gather artefacts for auditors (policy approvals, logs, training rosters, test reports).
3. Perform internal audit / readiness assessment.
4. Engage external auditor (ISO/SOC) and legal counsel for GDPR compliance sign-off.
5. Address findings and freeze evidence set prior to formal audits.

---

## 4. Operational Cadence

- **Weekly stand-up**: Compliance lead, engineering, legal, IT to review progress and blockers.
- **Monthly steering committee**: Executive sponsor reviews KPIs (policy completion %, control status, incident metrics).
- **Quarterly**: Access reviews, vulnerability scans, DR drills, vendor assessments.
- **Annually**: Penetration tests, policy re-approval, DPIA updates, ISO internal audit.

---

## 5. Immediate Next Steps

1. Appoint Compliance Lead and Executive Sponsor.
2. Schedule kickoff meeting to confirm scope, resources, and timelines.
3. Populate a tracking board (Jira/Notion) with the deliverables above, assigning owners and due dates.
4. Begin Phase 1 gap analysis leveraging this charter and the existing technical roadmap.

Maintaining this document as the single source of truth ensures continuity across audits and growth phases. Update it whenever roles change, new regulations apply, or additional controls are implemented.
