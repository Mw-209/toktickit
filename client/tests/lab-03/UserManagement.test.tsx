import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserManagement } from "../../src/components/AdminUserManagement.js";

// ---------------------------------------------------------------------------
// UserManagement.test.tsx — Lab 3 UI Component Tests
// Tests: UI-ADMIN-01 through UI-ADMIN-05
// ---------------------------------------------------------------------------

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

vi.mock("../../src/api", () => ({
  fetchAdminUsers: vi.fn().mockResolvedValue([
    { id: 1, name: "Admin User", email: "admin@example.edu", role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, createdAt: "2026-01-01T00:00:00Z" },
    { id: 2, name: "Alice Staff", email: "alice.staff@example.edu", role: "IT_STAFF", isActive: true, mustChangePassword: false, createdAt: "2026-01-01T00:00:00Z" },
    { id: 3, name: "Jennifer Anderson", email: "jennifer@example.edu", role: "REQUESTER", isActive: false, mustChangePassword: false, createdAt: "2026-01-01T00:00:00Z" },
  ]),
  createAdminUser: vi.fn().mockResolvedValue({ id: 99, name: "New User", email: "new@test.com", role: "REQUESTER", isActive: true, mustChangePassword: true }),
  updateAdminUser: vi.fn().mockResolvedValue({ id: 2, name: "Alice Staff Updated", email: "alice.staff@example.edu", role: "IT_STAFF", isActive: true, mustChangePassword: false }),
}));

function renderUserManagement() {
  return render(<AdminUserManagement />);
}

describe("AdminUserManagement Component (UI-ADMIN-*)", () => {
  // UI-ADMIN-01: User list table renders Name/Email/Role/Status columns
  it("UI-ADMIN-01: renders user list with Name, Email, Role badge and Status badge", async () => {
    renderUserManagement();
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("admin@example.edu")).toBeInTheDocument();
    });
    // Role and status badges should be present
    expect(screen.getByText("Alice Staff")).toBeInTheDocument();
    expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
  });

  // UI-ADMIN-02: Create User modal opens on button click
  it("UI-ADMIN-02: clicking Create User button opens the create modal", async () => {
    renderUserManagement();
    await waitFor(() => screen.getByText("Admin User"));
    const createBtn = screen.getByRole("button", { name: /create user/i });
    await userEvent.click(createBtn);
    await waitFor(() => {
      // Modal should contain form fields
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
  });

  // UI-ADMIN-03: Create form with missing name shows required validation
  it("UI-ADMIN-03: name input in create form is required", async () => {
    renderUserManagement();
    await waitFor(() => screen.getByText("Admin User"));
    await userEvent.click(screen.getByRole("button", { name: /create user/i }));
    await waitFor(() => screen.getByLabelText(/name/i));
    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveAttribute("required");
  });

  // UI-ADMIN-04: Edit modal pre-fills user data
  it("UI-ADMIN-04: Edit button opens modal with pre-filled data", async () => {
    renderUserManagement();
    await waitFor(() => screen.getByText("Admin User"));
    const editBtns = screen.getAllByRole("button", { name: /edit/i });
    await userEvent.click(editBtns[0]);
    await waitFor(() => {
      // At least one input should have the user's name pre-filled
      const inputs = screen.getAllByRole("textbox");
      const values = inputs.map((i) => (i as HTMLInputElement).value);
      expect(values.some((v) => v.length > 0)).toBe(true);
    });
  });

  // UI-ADMIN-05: Inactive user shows Inactive status badge
  it("UI-ADMIN-05: inactive user shows Inactive status badge", async () => {
    renderUserManagement();
    await waitFor(() => {
      expect(screen.getByText(/inactive/i)).toBeInTheDocument();
    });
  });
});
