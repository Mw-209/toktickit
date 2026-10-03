# Lab 3 — AI Agent Use Log

## 1. LLM Used
- Claude Sonnet 4.6 (Antigravity IDE Agent)

## 2. Key Prompts and Workflow

| Prompt Order | Goal / Intent | AI Output Quality / Issues | Student Action / Refinement |
|---|---|---|---|
| 1 | Read Lab_3_sheet.pdf and create Lab 3 implementation plan | Extracted all 18 pages, identified 8 issues and full scope | Approved the plan and issue breakdown |
| 2 | Create Issue 1: Sprint 3 Engineering Contract (specification.md) | Generated complete spec with FR, BR, AC, and DoD aligned to lab sheet | Reviewed and approved |
| 3 | Create ui-spec.md with all Lab 3 screens | Generated screen layouts, badge colors, responsive rules | Reviewed against lab sheet requirements |
| 4 | Create api-spec.md with authorization matrix | Generated all endpoints with request/response shapes | Verified authorization matrix coverage |
| 5 | Create tests.md with full test plan | Generated 60+ planned tests with AC traceability | Verified all AC mapped to at least one test |
| 6 | Create feature/lab3-2-auth-foundation and UI | Generated login/password change backend logic and React UI components | Reviewed backend code, tested frontend visually |
| 7 | Create authorization matrix middleware (Issue 3) | Implemented Role-Based Access Control logic in app.ts | Verified requester could only see own tickets |
| 8 | Implement Staff Queue and Detail views (Issue 4,5) | Generated API endpoints and frontend components for Staff flows | Tested status transition constraints |
| 9 | Implement Admin User Management (Issue 6) | Generated CRUD APIs for users and management UI with status badges | Found logic bug where admin could deactivate self, asked AI to fix it |
| 10 | Complete E2E Tests and API tests (Issue 7) | Generated Playwright E2E tests, missing API and UI tests | Fixed API payload shape issues where tests failed, organized screenshots |

## 3. My Reflection

Using the AI agent to implement a full-stack authentication and authorization system was highly educational. It allowed me to focus on the architectural requirements (RBAC, routing, schema updates) while the AI handled the boilerplate test setups and UI scaffolding. 

I learned the importance of clearly defining constraints in the prompt. When the AI initially implemented Admin User Management, it allowed an Admin to deactivate themselves (which violated a business rule). By specifically pointing out this edge case, the AI corrected it immediately. Furthermore, writing tests for all APIs helped me uncover inconsistencies in the backend return shapes, reinforcing the value of test-driven development.
