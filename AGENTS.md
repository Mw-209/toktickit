# TokTickIT — AI Agent Guidelines & Operating Rules

## Project Context
TokTickIT is a full-stack IT service desk application developed for CPE 334 (Introduction to Software Engineering in the Age of AI Agents).
Lab 2 focuses on the Requester-facing MVP with Zen Green UI Foundation.

## Core Directives & Disciplined Workflow
1. **Branch Flow (Section 10.1):**
   - Active development must happen on issue-specific feature branches (e.g. `feature/<issue-name>`).
   - Feature branches merge into `lab2-staging` via Pull Requests.
   - Never commit directly to `main` or `lab2-staging`.
   - Release PR merges `lab2-staging` into `main` only after full integration and test verification.
2. **Spec-Driven & Test-Driven Development (Spec DD & TDD):**
   - No feature code is written before its engineering specification (`docs/lab-02/specification.md`, `ui-spec.md`, `api-spec.md`) and test plan (`docs/lab-02/tests.md`) are defined and approved.
   - Write failing automated tests first, implement the smallest correct behavior, and refactor while keeping tests passing.
3. **Scope Integrity:**
   - Implement strictly what is approved in the sprint contract.
   - Do NOT implement real authentication (passwords, JWT, sessions) — use the Development Requester Selector context.
   - Do NOT implement IT staff queues, priority reassignment, public comments, internal notes, or status changes beyond `New`.
4. **Architecture & Design Constraints:**
   - **Frontend:** React + TypeScript + Vite, styled using Zen Green Theme tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`). Responsive across Desktop (≥992px), Tablet (768–991px), and Mobile (<768px).
   - **Backend:** Express + TypeScript, Prisma ORM with PostgreSQL.
   - **Data Validation:** Validate both on client (inline error messages below inputs) and backend (safe 400 Bad Request responses).
   - **Attachment Rules:** Max 5 active files per ticket, max 5MB/file, allowed MIME types: JPG, PNG, WEBP, PDF. Deletions must be soft-removal with reason metadata.
