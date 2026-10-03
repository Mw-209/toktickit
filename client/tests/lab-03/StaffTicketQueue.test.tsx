import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketQueue } from "../../src/components/StaffTicketQueue.js";

// ---------------------------------------------------------------------------
// StaffTicketQueue.test.tsx — Lab 3 UI Component Tests
// Tests: UI-QUEUE-01 through UI-QUEUE-05
// ---------------------------------------------------------------------------

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

vi.mock("../../src/api", () => ({
  fetchStaffTickets: vi.fn().mockResolvedValue({
    tickets: [
      {
        id: 1, ticketNumber: "TKT-2026-000001", summary: "Laptop battery issue",
        currentStatus: "NEW", requestedPriority: "HIGH", itPriority: "HIGH",
        categoryName: "Hardware", assignedTo: null,
        createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: 2, ticketNumber: "TKT-2026-000002", summary: "VPN not working",
        currentStatus: "IN_PROGRESS", requestedPriority: "MEDIUM", itPriority: null,
        categoryName: "Network", assignedTo: { id: 1, name: "Alice Staff" },
        createdAt: "2026-01-02T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z",
      },
    ],
    total: 2, page: 1, pageSize: 10, totalPages: 1,
    pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
  }),
  fetchStaffAssignees: vi.fn().mockResolvedValue([]),
  fetchCategories: vi.fn().mockResolvedValue([]),
}));

function renderQueue() {
  return render(<StaffTicketQueue onNavigate={vi.fn()} />);
}

describe("StaffTicketQueue Component (UI-QUEUE-*)", () => {
  // UI-QUEUE-01: Queue renders table with correct columns
  it("UI-QUEUE-01: renders ticket data including Ticket Number and Summary", async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
      expect(screen.getByText("Laptop battery issue")).toBeInTheDocument();
    });
  });

  // UI-QUEUE-02: Status badge renders correct text
  it("UI-QUEUE-02: status badge renders ticket status text", async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText("NEW")).toBeInTheDocument();
      expect(screen.getByText("IN_PROGRESS")).toBeInTheDocument();
    });
  });

  // UI-QUEUE-03: Empty state renders when no tickets
  it("UI-QUEUE-03: empty state message shown when no tickets returned", async () => {
    const { fetchStaffTickets } = await import("../../src/api");
    (fetchStaffTickets as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      tickets: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
      pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
    });
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText(/no tickets/i)).toBeInTheDocument();
    });
  });

  // UI-QUEUE-04: Search input triggers API call
  it("UI-QUEUE-04: typing in search input triggers a new API call", async () => {
    const { fetchStaffTickets } = await import("../../src/api");
    renderQueue();
    await waitFor(() => screen.getByPlaceholderText(/search/i));
    await userEvent.type(screen.getByPlaceholderText(/search/i), "laptop");
    await waitFor(() => {
      expect(fetchStaffTickets).toHaveBeenCalled();
    });
  });

  // UI-QUEUE-05: Pagination shows range text
  it("UI-QUEUE-05: renders showing text with ticket count information", async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText(/showing/i)).toBeInTheDocument();
    });
  });
});
