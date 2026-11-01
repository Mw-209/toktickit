# Lab 4 — AI Agent Use Log

## 1. LLM Used
- Gemini 2.5 Flash / Claude Sonnet 3.5 (Antigravity IDE Agent)

## 2. Key Prompts and Workflow

| Prompt Order | Goal / Intent | AI Output Quality / Issues | Student Action / Refinement |
|---|---|---|---|
| 1 | Analyze Lab 4 handout to plan sprint scope and determine the total number of required GitHub issues | AI read the lab sheet and decomposed the sprint into 6 GitHub issues with defined scope and deliverables | Reviewed and approved the 6-issue breakdown before setting up the Kanban board |
| 2 | Design Database increment: create Prisma ActionTaken model, optimistic concurrency versioning, run migration, and seed realistic tickets | Generated schema model with relations to Ticket and User, plus idempotent seed script | Verified schema relations and ran Prisma migration successfully on PostgreSQL |
| 3 | Build Actions Taken REST API with strict validation: require followUpNote when followUpRequired is true, and restrict to IT Staff/Admin | Generated Express endpoints with RBAC middleware and field validation | Reviewed error responses, added test cases for 400 Bad Request and 403 Forbidden |
| 4 | Implement Actions Taken UI on Ticket Detail view with Zen Green design, create/edit modes, and inline validation | Implemented ActionsTakenSection component with modal/form, role restrictions, and feedback | Verified read-only view for Requesters and editable operational logging for IT Staff |
| 5 | Enforce Ticket status transition matrix, advisory "Problem Appears Resolved" flag, and 409 conflict detection | Created server status transition validator and client operations panel controls | Tested concurrency protection and confirmed requester flag does not prematurely resolve ticket |
| 6 | Implement Role Dashboards: create StaffDashboard and RequesterDashboard with scoped metrics and drill-down navigation | Created dashboard components and backend aggregation APIs for each role | Added refresh button, empty state alerts, and verified drill-down parameters |
| 7 | Fix mobile responsive overflow: eliminate horizontal scrolling in dashboard recent ticket tables on viewports < 768px | AI identified table width expansion causing grid stretch on mobile screens | Replaced desktop table with stacked `.zen-mobile-cards` and set CSS minmax bounds |
| 8 | Implement and execute automated E2E test suites with Playwright across desktop, tablet, and mobile viewports | Produced 24 E2E tests capturing full-page screenshots in `artifacts/lab-04/screenshots/` | Fixed selector collisions and verified 100% test pass rate with zero overflow |

## 3. My Reflection

### Specification Agent Reflection
Using the AI as a Specification Agent early in Sprint 4 proved essential for maintaining engineering rigor. Instead of immediately writing code, having the AI analyze `SE+Lab+4.pdf` to produce concrete requirements (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) ensured that business rules—such as the parent-child relationship between Tickets and Actions Taken, optimistic locking via version numbers, and the advisory nature of requester resolution—were completely clear upfront. This eliminated architectural ambiguity and prevented rework across the full stack.

### Coding Agent Reflection
The AI as a Coding Agent excelled at rapidly implementing full-stack increments, from Prisma schema extensions and Express route guards to responsive React components adhering to Zen Green tokens. The most valuable interaction occurred during mobile hardening: when the 5-column table broke responsive constraints on mobile viewports, the AI diagnosed the CSS grid expansion root cause and adapted the UI into accessible mobile cards (`.zen-mobile-cards`). Pair programming with the AI allowed me to enforce strict peer-review workflows, run comprehensive regression suites, and produce traceable evidence meeting all criteria of the engineering contract.
