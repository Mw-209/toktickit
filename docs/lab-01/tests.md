# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | ✅ Pass |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | ✅ Pass |
| 3 | Vitest | Heading renders | ✅ Pass |
| 4 | Vitest | Success state shows Online + category list | ✅ Pass |
| 5 | Vitest | Error state shows Offline + message | ✅ Pass |

Paste your passing terminal output / screenshot below.
## Terminal Output

### Backend tests (Supertest / Vitest) — `server/`

```
PS C:\Users\Matebook14\Downloads\Lab1_Starter_Scaffold\toktickit\server> npm test

> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 C:/Users/Matebook14/Downloads/Lab1_Starter_Scaffold/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1) 305ms
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  23:39:44
   Duration  2.15s (transform 199ms, setup 0ms, collect 1.30s, tests 350ms, environment 1ms, prepare 624ms)
```

### Frontend tests (Vitest) — `client/`

```
PS C:\Users\Matebook14\Downloads\Lab1_Starter_Scaffold\toktickit\client> npm test

> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 C:/Users/Matebook14/Downloads/Lab1_Starter_Scaffold/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3)
   ✓ App (3)
     ✓ renders the TokTickIT heading
     ✓ shows Online and the seeded categories on success
     ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  23:40:27
   Duration  4.27s (transform 177ms, setup 483ms, collect 408ms, tests 113ms, environment 2.20s, prepare 405ms)
```