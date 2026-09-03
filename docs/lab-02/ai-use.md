# Lab 2 — AI Agent Use Log

**Author:** [Your Name] — [Student ID] — GitHub: @[YourGitHub]

## 1. LLM Used
- Google Gemini 1.5 Pro (Antigravity IDE Agent)

## 2. Key Prompts and Workflow
| Prompt Order | Goal / Intent | AI Output Quality / Issues | Student Action / Refinement |
|---|---|---|---|
| 1 | Create Lab 2 sprint engineering specification and test plan based on labsheet. | Generated a comprehensive spec matching the labsheet. | Approved the specification. |
| 2 | Implement Issue 2: DB Model & Seed | Implemented Prisma schema and seed script correctly. | Ran migrations and verified idempotent seeding. |
| 3 | Implement Issue 3: Dev Requester Context | Created API and React Context for Requester selection. | Tested switching context successfully. |
| 4 | Implement Issue 4: Create Ticket & My Tickets | Implemented ticket creation and paginated list filtering. | Verified responsive UI and test coverage. |
| 5 | Review Issue 5 Implementation Plan | Drafted a plan for Ticket Detail and soft-removal. | Approved the plan based on specs (no cancel ticket). |
| 6 | Execute Issue 5 | Implemented TicketDetailView and Soft-Removal Modal. | Tested the upload and removal flow in the browser. |
| 7 | Create PR Review text | Generated the exact checklist format needed for PR review. | Copied to GitHub and merged PR. |
| 8 | Implement Issue 7 (E2E Validation) | Installed Playwright and wrote `requester-ticket-flow.spec.ts`. | Verified screenshots generated in `artifacts/lab-02/screenshots/`. |

## 3. My Reflection
Using an AI Agent for Spec-Driven Development (Spec DD) has been incredibly efficient. The agent performs best when given explicit, numbered business rules and acceptance criteria to follow. When requirements are ambiguous, the agent is forced to guess, which can lead to rework. 

For example, when I initially asked about "Cancelling a ticket," the agent successfully cross-referenced the labsheet to confirm that "Ticket lifecycle after creation" was explicitly excluded from Lab 2, saving me from building an out-of-scope feature. Writing the engineering contract *before* coding is crucial for controlling the AI.
