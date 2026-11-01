import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionsTakenSection from "../../src/components/ActionsTakenSection.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";

// ---------------------------------------------------------------------------
// ActionsTaken.test.tsx — Lab 4 UI Component Tests (Issue 3)
// Tests: UI-AT-01 through UI-AT-05
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockActions: api.ActionTaken[] = [
  {
    id: 101,
    ticketId: 1,
    performedById: 10,
    performedByName: "Alice Staff",
    actionDateTime: "2026-02-01T10:00:00.000Z",
    actionDescription: "Replaced battery with new OEM battery.",
    result: "Battery health 100%, device holds charge properly.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "battery_diagnostic.png",
    version: 1,
    createdAt: "2026-02-01T10:05:00.000Z",
    updatedAt: "2026-02-01T10:05:00.000Z",
  },
  {
    id: 102,
    ticketId: 1,
    performedById: 11,
    performedByName: "Bob Tech",
    actionDateTime: "2026-02-01T14:30:00.000Z",
    actionDescription: "Ran hardware diagnostics and stress test.",
    result: "High temperature detected under peak load.",
    followUpRequired: true,
    followUpNote: "Apply new thermal paste if overheating persists.",
    attachmentNotes: null,
    version: 1,
    createdAt: "2026-02-01T14:35:00.000Z",
    updatedAt: "2026-02-01T14:35:00.000Z",
  },
];

vi.mock("../../src/api.js", () => ({
  fetchActionsTaken: vi.fn(),
  createActionTaken: vi.fn(),
  updateActionTaken: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: vi.fn(),
}));

describe("ActionsTaken Component (UI-AT-*)", () => {
  beforeEach(() => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: { id: 10, name: "Alice Staff", email: "alice@test.com", role: "IT_STAFF", mustChangePassword: false },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.mocked(api.fetchActionsTaken).mockResolvedValue(mockActions);
  });

  // UI-AT-01: Actions Taken list renders all returned actions
  it("UI-AT-01 (AC-01): renders all returned actions with description, result, and performedBy", async () => {
    render(<ActionsTakenSection ticketId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Replaced battery with new OEM battery/i)).toBeInTheDocument();
      expect(screen.getByText(/Battery health 100%, device holds charge properly/i)).toBeInTheDocument();
      expect(screen.getByText(/Alice Staff/i)).toBeInTheDocument();
      expect(screen.getByText(/Ran hardware diagnostics and stress test/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob Tech/i)).toBeInTheDocument();
      expect(screen.getByText(/Follow-Up Required/i)).toBeInTheDocument();
      expect(screen.getByText(/Apply new thermal paste if overheating persists/i)).toBeInTheDocument();
    });
  });

  // UI-AT-02: Submit form with followUpRequired=true and empty note shows validation error
  it("UI-AT-02 (AC-03): shows inline validation error when followUpRequired is checked but note is empty", async () => {
    render(<ActionsTakenSection ticketId={1} />);

    // Open form
    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("add-action-btn"));

    // Form should appear
    expect(screen.getByTestId("action-form")).toBeInTheDocument();

    // Fill description & result
    fireEvent.change(screen.getByLabelText(/Action Description/i), {
      target: { value: "Replaced cooling fan." },
    });
    fireEvent.change(screen.getByLabelText(/Result \/ Outcome/i), {
      target: { value: "Fan spinning quietly." },
    });

    // Check follow-up required checkbox
    const followUpCheckbox = screen.getByLabelText(/Follow-Up Required\?/i);
    fireEvent.click(followUpCheckbox);

    // Follow-up note input is now visible, leave it empty
    const followUpInput = screen.getByLabelText(/Follow-Up Note/i);
    fireEvent.change(followUpInput, { target: { value: "" } });

    // Submit form
    fireEvent.click(screen.getByTestId("submit-action-btn"));

    // Validation error must be visible inline
    await waitFor(() => {
      expect(screen.getByText(/Follow-up note is required when follow-up is needed/i)).toBeInTheDocument();
    });
    expect(api.createActionTaken).not.toHaveBeenCalled();
  });

  // UI-AT-03: Requester view shows read-only list (no create button)
  it("UI-AT-03: Requester view displays actions read-only without Add Action or Edit buttons", async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: { id: 5, name: "Jennifer Requester", email: "jennifer@test.com", role: "REQUESTER", mustChangePassword: false },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<ActionsTakenSection ticketId={1} readOnly={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Replaced battery with new OEM battery/i)).toBeInTheDocument();
    });

    // Add action button must NOT exist
    expect(screen.queryByTestId("add-action-btn")).not.toBeInTheDocument();

    // Edit action button must NOT exist
    expect(screen.queryByTestId("edit-action-btn-101")).not.toBeInTheDocument();
  });

  // UI-AT-04: IT Staff view shows Create Action Taken button and opens create form
  it("UI-AT-04: IT Staff view has '+ Record Action' button and clicking it reveals form", async () => {
    render(<ActionsTakenSection ticketId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-action-btn"));
    expect(screen.getByTestId("action-form")).toBeInTheDocument();
    expect(screen.getByText(/Record New Action Taken/i)).toBeInTheDocument();
  });

  // UI-AT-05: Empty state when no Actions Taken
  it("UI-AT-05: displays empty state message when no actions have been recorded", async () => {
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([]);

    render(<ActionsTakenSection ticketId={2} />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-actions")).toBeInTheDocument();
      expect(screen.getByText(/No actions have been recorded yet/i)).toBeInTheDocument();
    });
  });
});
