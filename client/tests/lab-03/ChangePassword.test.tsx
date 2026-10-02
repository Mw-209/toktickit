import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ChangePassword from "../../src/components/ChangePassword.js";

// ---------------------------------------------------------------------------
// ChangePassword.test.tsx — Lab 3 UI Component Tests
// Tests: UI-CP-01 through UI-CP-04
// ---------------------------------------------------------------------------

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const mockRefreshUser = vi.fn();

vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test User", email: "test@test.com", role: "REQUESTER", mustChangePassword: true },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: mockRefreshUser,
  }),
}));

vi.mock("../../src/api.js", () => ({
  changePassword: vi.fn(),
}));

function renderChangePassword() {
  return render(<ChangePassword />);
}

describe("ChangePassword Component (UI-CP-*)", () => {
  // UI-CP-01: Form renders correctly (AC-02)
  it("UI-CP-01: renders new password, confirm password fields and submit button", () => {
    renderChangePassword();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save new password/i })).toBeInTheDocument();
  });

  // UI-CP-02: Password too short shows validation error
  it("UI-CP-02: password shorter than 8 characters shows validation error", async () => {
    renderChangePassword();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  // UI-CP-03: Passwords don't match shows error
  it("UI-CP-03: mismatched passwords shows error message", async () => {
    renderChangePassword();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "DifferentPass!" } });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));
    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });
  });

  // UI-CP-04: Successful change shows success message
  it("UI-CP-04: successful password change shows success message", async () => {
    const { changePassword: mockChangePassword } = await import("../../src/api.js");
    (mockChangePassword as ReturnType<typeof vi.fn>).mockResolvedValue({});
    renderChangePassword();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "NewPass123!" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "NewPass123!" } });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));
    await waitFor(() => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    });
  });
});
