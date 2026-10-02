import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import Login from "../../src/components/Login.js";

// ---------------------------------------------------------------------------
// Login.test.tsx — Lab 3 UI Component Tests
// Tests: UI-LOGIN-01 through UI-LOGIN-05
// ---------------------------------------------------------------------------

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

function renderLogin() {
  return render(<Login />);
}

describe("Login Component (UI-LOGIN-*)", () => {
  // UI-LOGIN-01: Form renders email + password + submit
  it("UI-LOGIN-01: renders email input, password input, and submit button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  // UI-LOGIN-02: Submit with empty email shows browser validation
  it("UI-LOGIN-02: email input is required", () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute("required");
  });

  // UI-LOGIN-03: Submit with empty password shows browser validation
  it("UI-LOGIN-03: password input is required", () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // UI-LOGIN-04: Loading state while submitting — button disabled + shows "Signing in..."
  it("UI-LOGIN-04: button shows Signing in... and is disabled while submitting", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });
  });

  // UI-LOGIN-05: API error shows generic failure message
  it("UI-LOGIN-05: API error shows error alert message", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials or inactive account"));
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "wrong@test.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials or inactive account/i)).toBeInTheDocument();
    });
  });
});
