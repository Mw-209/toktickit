import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";
import TicketDetailView from "../../src/components/TicketDetailView.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";

// ---------------------------------------------------------------------------
// TicketWorkflow.test.tsx — Lab 4 UI Component Tests (Issue 4)
// Tests: UI-WF-01 through UI-WF-03
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("../../src/components/ActionsTakenSection.js", () => ({
  default: () => <div data-testid="actions-taken-section">Actions Taken Section</div>,
}));

vi.mock("../../src/api.js", () => ({
  fetchStaffTicketDetail: vi.fn(),
  updateTicketStatus: vi.fn(),
  patchTicketWorkflowStatus: vi.fn(),
  fetchStaffAssignees: vi.fn(),
  fetchComments: vi.fn(),
  postComment: vi.fn(),
  fetchNotes: vi.fn(),
  postNote: vi.fn(),
  getAttachmentDownloadUrl: vi.fn(),
  fetchTicketDetail: vi.fn(),
  fetchActiveRequesters: vi.fn().mockResolvedValue([]),
  indicateTicketResolved: vi.fn(),
  uploadAttachment: vi.fn(),
  softRemoveAttachment: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: vi.fn(),
}));

describe("Ticket Workflow UI Tests (UI-WF-*)", () => {
  const mockStaffUser = {
    id: 10,
    name: "Alice Staff",
    email: "alice@test.com",
    role: "IT_STAFF",
    mustChangePassword: false,
  };

  const mockRequesterUser = {
    id: 2,
    name: "Jennifer Anderson",
    email: "jennifer@example.edu",
    role: "REQUESTER",
  };

  beforeEach(() => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockStaffUser as any,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(api.fetchStaffAssignees).mockResolvedValue({
      assignees: [
        { id: 10, name: "Alice Staff", email: "alice@test.com", role: "IT_STAFF" },
      ],
    });
    vi.mocked(api.fetchComments).mockResolvedValue([]);
    vi.mocked(api.fetchNotes).mockResolvedValue([]);
  });

  // -------------------------------------------------------------------------
  // UI-WF-01: Status dropdown only shows permitted transitions
  // -------------------------------------------------------------------------
  it("UI-WF-01: Status dropdown only shows permitted transitions for Closed ticket (Closed -> In Progress not selectable)", async () => {
    const closedTicket: api.Ticket = {
      id: 1,
      ticketNumber: "TKT-2026-000001",
      summary: "Closed ticket summary",
      description: "Closed ticket description",
      requestedPriority: "MEDIUM",
      itPriority: "MEDIUM",
      currentStatus: "CLOSED",
      version: 1,
      requesterId: 2,
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "Hardware", isActive: true },
      relatedSystem: { id: 1, name: "Laptop", isActive: true },
      requester: { id: 2, name: "Jennifer Anderson", email: "jennifer@test.com", role: "REQUESTER" },
      assignedTo: { id: 10, name: "Alice Staff", email: "alice@test.com", role: "IT_STAFF" },
      resolveIndicatedAt: null,
      attachments: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    vi.mocked(api.fetchStaffTicketDetail).mockResolvedValue(closedTicket);

    render(<StaffTicketDetail ticketId={1} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    const select = screen.getByTestId("status-select") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((opt) => opt.value);

    // CLOSED can only stay CLOSED or transition to REOPENED
    expect(optionValues).toContain("CLOSED");
    expect(optionValues).toContain("REOPENED");
    expect(optionValues).not.toContain("IN_PROGRESS");
    expect(optionValues).not.toContain("OPEN");
    expect(optionValues).not.toContain("NEW");
    expect(optionValues).not.toContain("RESOLVED");
    expect(optionValues).not.toContain("CANCELLED");
  });

  it("UI-WF-01b: Status dropdown only shows permitted transitions for New ticket", async () => {
    const newTicket: api.Ticket = {
      id: 2,
      ticketNumber: "TKT-2026-000002",
      summary: "New ticket summary",
      description: "New ticket description",
      requestedPriority: "HIGH",
      itPriority: null,
      currentStatus: "NEW",
      version: 1,
      requesterId: 2,
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "Software", isActive: true },
      relatedSystem: { id: 1, name: "LEB2", isActive: true },
      requester: { id: 2, name: "Jennifer Anderson", email: "jennifer@test.com", role: "REQUESTER" },
      assignedTo: null,
      resolveIndicatedAt: null,
      attachments: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    vi.mocked(api.fetchStaffTicketDetail).mockResolvedValue(newTicket);

    render(<StaffTicketDetail ticketId={2} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    const select = screen.getByTestId("status-select") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((opt) => opt.value);

    // NEW can only transition to OPEN or CANCELLED
    expect(optionValues).toContain("NEW");
    expect(optionValues).toContain("OPEN");
    expect(optionValues).toContain("CANCELLED");
    expect(optionValues).not.toContain("RESOLVED");
    expect(optionValues).not.toContain("IN_PROGRESS");
    expect(optionValues).not.toContain("CLOSED");
  });

  // -------------------------------------------------------------------------
  // UI-WF-02: Successful status change refreshes displayed status
  // -------------------------------------------------------------------------
  it("UI-WF-02: Successful status change refreshes displayed status badge immediately", async () => {
    const initialTicket: api.Ticket = {
      id: 3,
      ticketNumber: "TKT-2026-000003",
      summary: "Ticket to update",
      description: "Testing status change",
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      currentStatus: "NEW",
      version: 1,
      requesterId: 2,
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "Software", isActive: true },
      relatedSystem: { id: 1, name: "Portal", isActive: true },
      requester: { id: 2, name: "Jennifer Anderson", email: "jennifer@test.com", role: "REQUESTER" },
      assignedTo: null,
      resolveIndicatedAt: null,
      attachments: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    const updatedTicket: api.Ticket = {
      ...initialTicket,
      currentStatus: "OPEN",
      version: 2,
    };

    vi.mocked(api.fetchStaffTicketDetail).mockResolvedValue(initialTicket);
    vi.mocked(api.updateTicketStatus).mockResolvedValue(updatedTicket);

    render(<StaffTicketDetail ticketId={3} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("ticket-status-badge")).toHaveTextContent(/new/i);
    });

    const select = screen.getByTestId("status-select");
    fireEvent.change(select, { target: { value: "OPEN" } });

    const updateBtn = screen.getByRole("button", { name: /update ticket/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(api.updateTicketStatus).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ currentStatus: "OPEN", version: 1 })
      );
      expect(screen.getByTestId("ticket-status-badge")).toHaveTextContent(/open/i);
    });
  });

  // -------------------------------------------------------------------------
  // UI-WF-03: Requester "appears resolved" button does not change status badge
  // -------------------------------------------------------------------------
  it("UI-WF-03: Requester 'appears resolved' button does not change status badge", async () => {
    const openTicket: api.Ticket = {
      id: 4,
      ticketNumber: "TKT-2026-000004",
      summary: "Requester ticket",
      description: "Appears resolved test",
      requestedPriority: "MEDIUM",
      itPriority: "MEDIUM",
      currentStatus: "IN_PROGRESS",
      version: 1,
      requesterId: 2,
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "Network", isActive: true },
      relatedSystem: { id: 1, name: "Wi-Fi", isActive: true },
      requester: { id: 2, name: "Jennifer Anderson", email: "jennifer@example.edu", role: "REQUESTER" },
      assignedTo: null,
      resolveIndicatedAt: null,
      attachments: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    const ticketWithIndication: api.Ticket = {
      ...openTicket,
      resolveIndicatedAt: "2026-10-31T15:00:00.000Z",
    };

    vi.mocked(api.fetchTicketDetail)
      .mockResolvedValueOnce(openTicket)
      .mockResolvedValueOnce(ticketWithIndication);
    vi.mocked(api.indicateTicketResolved).mockResolvedValue(undefined as any);

    // Mock confirm dialog
    vi.spyOn(window, "confirm").mockReturnValue(true);

    sessionStorage.setItem("toktickit_dev_requester", JSON.stringify(mockRequesterUser));

    render(
      <RequesterProvider>
        <TicketDetailView ticketId={4} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ticket-status-badge")).toHaveTextContent(/in progress/i);
      expect(screen.getByTestId("resolve-indication-btn")).toBeInTheDocument();
    });

    const resolveBtn = screen.getByTestId("resolve-indication-btn");
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(api.indicateTicketResolved).toHaveBeenCalledWith(4);
    });

    // The status badge must STILL be "IN PROGRESS", NOT "RESOLVED"
    await waitFor(() => {
      expect(screen.getByTestId("ticket-status-badge")).toHaveTextContent(/in progress/i);
      expect(screen.getByTestId("ticket-status-badge")).not.toHaveTextContent(/resolved/i);
    });
  });

  // Concurrency conflict feedback
  it("displays conflict error banner when 409 conflict is received", async () => {
    const ticket: api.Ticket = {
      id: 5,
      ticketNumber: "TKT-2026-000005",
      summary: "Conflict test",
      description: "Testing 409 error",
      requestedPriority: "LOW",
      itPriority: "LOW",
      currentStatus: "NEW",
      version: 1,
      requesterId: 2,
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "Hardware", isActive: true },
      relatedSystem: { id: 1, name: "Mouse", isActive: true },
      requester: { id: 2, name: "Jennifer Anderson", email: "jennifer@test.com", role: "REQUESTER" },
      assignedTo: null,
      resolveIndicatedAt: null,
      attachments: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    vi.mocked(api.fetchStaffTicketDetail).mockResolvedValue(ticket);
    vi.mocked(api.updateTicketStatus).mockRejectedValue(
      new Error("Resource was modified by another user.")
    );

    render(<StaffTicketDetail ticketId={5} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    const select = screen.getByTestId("status-select");
    fireEvent.change(select, { target: { value: "OPEN" } });

    const updateBtn = screen.getByRole("button", { name: /update ticket/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(screen.getByText(/This Ticket was updated by someone else\. Please refresh and try again\./i)).toBeInTheDocument();
    });
  });
});
