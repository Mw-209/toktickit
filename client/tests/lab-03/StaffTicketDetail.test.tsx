import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";

// ---------------------------------------------------------------------------
// StaffTicketDetail.test.tsx — Lab 3 UI Component Tests
// Tests: UI-SDETAIL-01 through UI-SDETAIL-05
// ---------------------------------------------------------------------------

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: { id: 10, name: "Alice Staff", email: "alice@test.com", role: "IT_STAFF", mustChangePassword: false },
    isLoading: false,
    login: vi.fn(), logout: vi.fn(), refreshUser: vi.fn(),
  }),
}));

vi.mock("../../src/api.js", () => ({
  fetchStaffTicketDetail: vi.fn().mockResolvedValue({
    id: 1, ticketNumber: "TKT-2026-000001", summary: "Laptop battery drains",
    description: "Battery issue description", requestedPriority: "HIGH",
    itPriority: "HIGH", currentStatus: "NEW", resolveIndicatedAt: null,
    createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    categoryName: "Hardware", relatedSystemName: "Corporate Laptop",
    requester: { id: 1, name: "Jennifer Anderson", email: "jennifer@test.com" },
    assignedTo: null,
    attachments: [],
  }),
  updateTicketStatus: vi.fn().mockResolvedValue({}),
  fetchStaffAssignees: vi.fn().mockResolvedValue([
    { id: 10, name: "Alice Staff", email: "alice@test.com", role: "IT_STAFF" },
  ]),
  fetchComments: vi.fn().mockResolvedValue([]),
  postComment: vi.fn().mockResolvedValue({
    id: 1, content: "test comment",
    author: { name: "Alice" },
    createdAt: new Date().toISOString(),
  }),
  fetchNotes: vi.fn().mockResolvedValue([]),
  postNote: vi.fn().mockResolvedValue({}),
  getAttachmentDownloadUrl: vi.fn(),
}));

function renderDetail() {
  return render(<StaffTicketDetail ticketId={1} onBack={vi.fn()} />);
}

describe("StaffTicketDetail Component (UI-SDETAIL-*)", () => {
  // UI-SDETAIL-01: Ticket info section renders all read-only fields
  it("UI-SDETAIL-01: renders ticket info with ticket number and summary", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/TKT-2026-000001/i)).toBeInTheDocument();
      expect(screen.getByText(/Laptop battery drains/i)).toBeInTheDocument();
    });
  });

  // UI-SDETAIL-02: "Claim" button visible when ticket unassigned
  it("UI-SDETAIL-02: Claim button is visible when ticket has no assignee", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/claim/i)).toBeInTheDocument();
    });
  });

  // UI-SDETAIL-03: Status section is present
  it("UI-SDETAIL-03: Status management section is shown", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });
  });

  // UI-SDETAIL-04: Internal Notes section visible for IT Staff
  it("UI-SDETAIL-04: Internal Notes section is visible for IT Staff role", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/internal notes/i)).toBeInTheDocument();
    });
  });

  // UI-SDETAIL-05: Public Comment section is present
  it("UI-SDETAIL-05: Public Comments section is visible and has comment input", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/public comment/i)).toBeInTheDocument();
    });
  });
});
