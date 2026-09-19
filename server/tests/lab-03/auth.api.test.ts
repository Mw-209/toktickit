import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// auth.api.test.ts — Lab 3 Issue 2 Authentication API Tests
// Tests: API-AUTH-01 through API-AUTH-12
// ---------------------------------------------------------------------------

const prisma = getPrisma();

// Test users created/cleaned up around this suite
const TEST_ACTIVE_EMAIL = "auth_test_active@test.local";
const TEST_INACTIVE_EMAIL = "auth_test_inactive@test.local";
const TEST_MUST_CHANGE_EMAIL = "auth_test_mustchange@test.local";
const TEST_PASSWORD = "TestPass123!";

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  await prisma.user.upsert({
    where: { email: TEST_ACTIVE_EMAIL },
    update: { passwordHash: hash, isActive: true, mustChangePassword: false },
    create: {
      name: "Auth Test Active",
      email: TEST_ACTIVE_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.user.upsert({
    where: { email: TEST_INACTIVE_EMAIL },
    update: { passwordHash: hash, isActive: false, mustChangePassword: false },
    create: {
      name: "Auth Test Inactive",
      email: TEST_INACTIVE_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: false,
      mustChangePassword: false,
    },
  });

  await prisma.user.upsert({
    where: { email: TEST_MUST_CHANGE_EMAIL },
    update: { passwordHash: hash, isActive: true, mustChangePassword: true },
    create: {
      name: "Auth Test MustChange",
      email: TEST_MUST_CHANGE_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_ACTIVE_EMAIL, TEST_INACTIVE_EMAIL, TEST_MUST_CHANGE_EMAIL],
      },
    },
  });
});

// ---------------------------------------------------------------------------
// Login Tests
// ---------------------------------------------------------------------------

describe("POST /api/auth/login", () => {
  // API-AUTH-01: Valid login
  it("API-AUTH-01: returns 200 and sets JWT cookie for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ACTIVE_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: TEST_ACTIVE_EMAIL,
      role: "REQUESTER",
    });
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("name");
    // JWT cookie must be set
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith("token=")
    );
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain("HttpOnly");
  });

  // API-AUTH-02: Wrong password
  it("API-AUTH-02: returns 401 for wrong password (generic message)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ACTIVE_EMAIL, password: "WrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials or inactive account.");
  });

  // API-AUTH-03: Non-existent email
  it("API-AUTH-03: returns 401 for non-existent email (same generic message)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials or inactive account.");
  });

  // API-AUTH-04: Inactive account
  it("API-AUTH-04: returns 401 for inactive account (no account-existence exposure)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_INACTIVE_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials or inactive account.");
    // Must NOT mention "inactive" or "disabled" specifically
    expect(res.body.message).not.toContain("inactive account exists");
  });

  // API-AUTH-05: mustChangePassword flag in response
  it("API-AUTH-05: returns mustChangePassword=true for user with flag set", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_MUST_CHANGE_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });

  // API-AUTH-12: Missing email field
  it("API-AUTH-12: returns 400 when email field is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Logout Tests
// ---------------------------------------------------------------------------

describe("POST /api/auth/logout", () => {
  // API-AUTH-06: Logout clears cookie
  it("API-AUTH-06: clears JWT cookie on logout", async () => {
    // First login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ACTIVE_EMAIL, password: TEST_PASSWORD });
    const cookies = loginRes.headers["set-cookie"];

    // Then logout
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookies);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe("Logged out successfully");
    const clearCookies = logoutRes.headers["set-cookie"];
    expect(clearCookies).toBeDefined();
    const tokenClear = (Array.isArray(clearCookies) ? clearCookies : [clearCookies]).find(
      (c: string) => c.startsWith("token=")
    );
    expect(tokenClear).toContain("Max-Age=0");
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me Tests
// ---------------------------------------------------------------------------

describe("GET /api/auth/me", () => {
  // API-AUTH-07: No cookie → 401
  it("API-AUTH-07: returns 401 when no JWT cookie is present", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  // API-AUTH-08: Valid cookie → user object
  it("API-AUTH-08: returns user identity with valid JWT cookie", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ACTIVE_EMAIL, password: TEST_PASSWORD });
    const cookies = loginRes.headers["set-cookie"];

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookies);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toMatchObject({
      email: TEST_ACTIVE_EMAIL,
      role: "REQUESTER",
    });
    expect(meRes.body).toHaveProperty("id");
    expect(meRes.body).toHaveProperty("name");
    expect(meRes.body).toHaveProperty("mustChangePassword");
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password Tests
// ---------------------------------------------------------------------------

describe("POST /api/auth/change-password", () => {
  // API-AUTH-09: Valid change
  it("API-AUTH-09: changes password and clears mustChangePassword", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_MUST_CHANGE_EMAIL, password: TEST_PASSWORD });
    const cookies = loginRes.headers["set-cookie"];

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookies)
      .send({ newPassword: "NewSecure456!", confirmPassword: "NewSecure456!" });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.message).toContain("successfully");

    // Reset back for other tests
    const resetHash = await hashPassword(TEST_PASSWORD);
    await prisma.user.update({
      where: { email: TEST_MUST_CHANGE_EMAIL },
      data: { passwordHash: resetHash, mustChangePassword: true },
    });
  });

  // API-AUTH-10: Password too short
  it("API-AUTH-10: returns 400 when new password is too short", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ACTIVE_EMAIL, password: TEST_PASSWORD });
    const cookies = loginRes.headers["set-cookie"];

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookies)
      .send({ newPassword: "short", confirmPassword: "short" });

    expect(changeRes.status).toBe(400);
  });

  // API-AUTH-11: Passwords don't match
  it("API-AUTH-11: returns 400 when passwords do not match", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ACTIVE_EMAIL, password: TEST_PASSWORD });
    const cookies = loginRes.headers["set-cookie"];

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookies)
      .send({ newPassword: "NewPass123!", confirmPassword: "DifferentPass!" });

    expect(changeRes.status).toBe(400);
  });
});
