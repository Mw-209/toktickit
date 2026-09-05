# TokTickIT (ตอกติ๊กกิต) — IT Service Desk

TokTickIT is a full-stack IT service desk application for managing Account & Access, Hardware, Software, and Network requests.

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Bootstrap 5
- **Backend**: Node.js + Express + TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Testing**: Vitest + React Testing Library (Frontend), Vitest + Supertest (Backend)
- **E2E Testing**: Playwright

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
├── server/               # Node.js + Express + Prisma backend
├── e2e/                  # Playwright End-to-End tests
│   └── lab-02/
├── docs/                 # Lab documentation and peer review records
│   ├── lab-01/
│   └── lab-02/
├── artifacts/            # Screenshots from E2E tests
│   └── lab-02/screenshots/
├── .gitignore            # Git ignore configuration
├── playwright.config.ts  # Playwright configuration
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
   npx prisma migrate dev --name init
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
  ```

- **Frontend Tests (React Testing Library + Vitest)**:
  ```bash
  cd client
  npm test
  ```

- **E2E Tests (Playwright)**:
  ```bash
  npx playwright test
  ```
  Screenshots will be saved to `artifacts/lab-02/screenshots/`.