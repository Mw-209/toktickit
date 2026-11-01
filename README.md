# TokTickIT (ตอกติ๊กกิต) — IT Service Desk

TokTickIT is a full-stack IT service desk application for managing Account & Access, Hardware, Software, and Network requests.

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Zen Green Design System
- **Backend**: Node.js + Express + TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Testing**: Vitest + React Testing Library (Frontend), Vitest + Supertest (Backend)
- **E2E Testing**: Playwright (Desktop, Tablet, Mobile)

---

## Prerequisites

Before running the application, make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database server running locally

---

## Project Structure

```text
toktickit/
├── client/               # React + TypeScript + Vite frontend
│   ├── src/              # Components (Dashboards, Actions Taken, Tickets)
│   └── tests/            # Vitest unit & component tests (lab-02, lab-03, lab-04)
├── server/               # Node.js + Express + Prisma backend
│   ├── prisma/           # Schema & migrations (User, Ticket, ActionTaken)
│   ├── src/              # Express REST APIs & middleware
│   └── tests/            # Supertest API tests (lab-02, lab-03, lab-04)
├── e2e/                  # Playwright End-to-End tests
│   ├── lab-02/
│   ├── lab-03/
│   └── lab-04/           # Dashboards, Actions Taken, Ticket Resolution
├── docs/                 # Engineering contracts, specifications, and reviews
│   ├── lab-01/
│   ├── lab-02/
│   ├── lab-03/
│   └── lab-04/           # specification.md, tests.md, ui-spec.md, api-spec.md, reviewer.md, ai-use.md
├── artifacts/            # Full-page screenshots across viewports
│   ├── lab-02/screenshots/
│   ├── lab-03/screenshots/
│   └── lab-04/screenshots/
│       ├── staff-dashboard/
│       ├── requester-dashboard/
│       └── actions-taken/
├── .gitignore            # Git ignore configuration
├── playwright.config.ts  # Playwright multi-viewport configuration
└── README.md             # Project setup and documentation
```

---

## Environment Setup

### 1. Server Configuration
Copy `.env.example` in the `server/` directory to `.env`:
```bash
cp server/.env.example server/.env
```
Update `DATABASE_URL` and `PORT` in `server/.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/toktickit?schema=public"
PORT=3000
```

### 2. Client Configuration
Copy `.env.example` in the `client/` directory to `.env`:
```bash
cp client/.env.example client/.env
```
Ensure `VITE_API_URL` points to the Express backend API:
```env
VITE_API_URL="http://localhost:3000"
```

---

## Installation & Setup

1. **Install Dependencies**
   - Client:
     ```bash
     cd client
     npm install
     ```
   - Server:
     ```bash
     cd server
     npm install
     ```

2. **Initialize Database with Prisma**
   ```bash
   cd server
   npx prisma migrate deploy
   npm run prisma:seed
   ```

---

## Running Development Servers

- **Run Server (Backend)**:
  ```bash
  cd server
  npm run dev
  ```
  The API server will listen at `http://localhost:3000`.

- **Run Client (Frontend)**:
  ```bash
  cd client
  npm run dev
  ```
  The Vite dev server will start at `http://localhost:5173`.

---

## Running Automated Tests

- **Backend Tests (Supertest + Vitest)**:
  ```bash
  cd server
  npm test
  # Run Lab 4 specific API tests
  npm test tests/lab-04
  ```

- **Frontend Tests (React Testing Library + Vitest)**:
  ```bash
  cd client
  npm test
  # Run Lab 4 specific UI component tests
  npm test tests/lab-04
  ```

- **E2E Tests (Playwright Multi-Viewport)**:
  ```bash
  # Run all Lab 4 E2E tests across Desktop, Tablet, and Mobile
  npx playwright test e2e/lab-04
  ```
  Screenshots will be generated in `artifacts/lab-04/screenshots/`.
