# Lab 3 — AI Agent Use Log

## 1. LLM Used
- Claude Sonnet 4.6 (Antigravity IDE Agent)

## 2. Key Prompts and Workflow

| Prompt Order | Goal / Intent | AI Output Quality / Issues | Student Action / Refinement |
|---|---|---|---|
| 1 | Plan Lab 3 scope (Issue 1): identify all 8 issues, define Sprint Engineering Contract, create specification.md | AI read the lab sheet, identified 8 issues with scope, acceptance criteria, and DoD for each | Reviewed issue breakdown, confirmed all 18 lab sheet requirements were covered |
| 2 | Implement authentication foundation (Issue 2): JWT login, mustChangePassword flow, password change API and React UI | Generated full auth backend with bcrypt, JWT, session middleware + React login/change-password pages | Tested mustChangePassword redirect flow; verified token is cleared on logout |
| 3 | Implement RBAC authorization middleware (Issue 3): block routes by role, prevent cross-user data access | Generated route-level middleware checking roles; Requester can only see own tickets | Manually verified a Requester JWT could not access Staff or Admin endpoints |
| 4 | Implement Staff Ticket Queue & Detail (Issue 4,5): paginated ticket list with search/filter, status transitions, comments and internal notes | Generated GET /api/staff/tickets with query params, PATCH for status, POST for comments/notes; StaffTicketQueue and StaffTicketDetail React components | Found status transition constraints were not enforced on the frontend; asked AI to add validation |
| 5 | Implement Admin User Management (Issue 6): create/edit/deactivate users, set temporary password | Generated full CRUD API at /api/admin/users and React admin UI with modal dialogs | Discovered AI allowed admin to deactivate their own account; provided constraint, AI fixed the logic |
| 6 | Complete E2E and unit tests (Issue 7): 16 Playwright E2E tests + 64 server API tests + 9 client UI tests | Generated all test files; some tests failed due to wrong response payload shape | Debugged API test assertions, fixed selector mismatches in E2E, reorganized screenshot paths |
| 7 | Add responsive E2E screenshots (Issue 8): capture all screens in Desktop, Tablet, Mobile viewport | Added 3 Playwright projects; restructured screenshot folders by screen area | Tablet used WebKit (not installed) → changed to Chromium 1024px; Mobile View button hidden by overflow CSS → used JS force-click |

## 3. My Reflection

Using the AI agent to implement a full-stack authentication and authorization system was highly educational. It allowed me to focus on the architectural requirements (RBAC, routing, schema updates) while the AI handled the boilerplate test setups and UI scaffolding. 

I learned the importance of clearly defining constraints in the prompt. When the AI initially implemented Admin User Management, it allowed an Admin to deactivate themselves (which violated a business rule). By specifically pointing out this edge case, the AI corrected it immediately. Furthermore, writing tests for all APIs helped me uncover inconsistencies in the backend return shapes, reinforcing the value of test-driven development.
