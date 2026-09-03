import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import MyTicketsDashboard from "../../src/components/MyTicketsDashboard.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear(); });

const mockRequester = { id: 2, name: "David Lee", email: "david.lee@example.edu", isActive: true };

const mockTickets = [
  {
    id: 1, ticketNumber: "TKT-2026-000001", summary: "Computer won't turn on",
    description: "My computer does not start", requestedPriority: "HIGH" as const,
    itPriority: null, currentStatus: "NEW" as const,
    requesterId: 2, categoryId: 1, relatedSystemId: 1,
    category: { id: 1, name: "Hardware" },
    relatedSystem: { id: 1, name: "Student Info System", isActive: true },
    attachments: [], createdAt: "2026-09-03T10:00:00Z", updatedAt: "2026-09-03T10:00:00Z",
  },
  {
    id: 2, ticketNumber: "TKT-2026-000002", summary: "Cannot access library portal",
    description: "Login page returns 500 error", requestedPriority: "MEDIUM" as const,
    itPriority: null, currentStatus: "IN_PROGRESS" as const,
    requesterId: 2, categoryId: 2, relatedSystemId: 2,
    category: { id: 2, name: "Software" },
    relatedSystem: { id: 2, name: "Library System", isActive: true },
    attachments: [], createdAt: "2026-09-03T09:00:00Z", updatedAt: "2026-09-03T09:00:00Z",
  },
];

const mockTicketResponse = {
  items: mockTickets,
  pagination: { totalItems: 2, page: 1, limit: 10, totalPages: 1 },
};

function renderDashboard(onViewTicket = vi.fn(), onCreateTicket = vi.fn()) {
  sessionStorage.setItem("toktickit_dev_requester", JSON.stringify(mockRequester));
  vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);
  vi.spyOn(api, "fetchCategories").mockResolvedValue([{ id: 1, name: "Hardware" }, { id: 2, name: "Software" }]);

  return render(
    <RequesterProvider>
      <MyTicketsDashboard onViewTicket={onViewTicket} onCreateTicket={onCreateTicket} />
    </RequesterProvider>
  );
}

describe("MyTicketsDashboard (Issue 4 - AC-03, FR-07, FR-08)", () => {
  it("AC-03: renders ticket list with ticket numbers", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketResponse);
    renderDashboard();

    // Use getAllByText since both desktop table and mobile card render same text
    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThan(0);
      expect(screen.getAllByText("TKT-2026-000002").length).toBeGreaterThan(0);
    });
  });

  it("AC-03: shows requester name in header", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketResponse);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/David Lee/i)).toBeInTheDocument();
    });
  });

  it("FR-07: shows empty state when no tickets exist", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue({
      items: [],
      pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 0 },
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/You have no tickets yet/i)).toBeInTheDocument();
    });
  });

  it("FR-08: search button triggers ticket reload", async () => {
    const fetchSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketResponse);
    renderDashboard();
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const searchInput = screen.getByPlaceholderText(/Search by summary/i);
    fireEvent.change(searchInput, { target: { value: "Computer" } });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });

  it("FR-08: status filter dropdown renders with correct options", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketResponse);
    renderDashboard();

    await waitFor(() => {
      const statusSelect = document.getElementById("filter-status") as HTMLSelectElement;
      expect(statusSelect).not.toBeNull();
      expect(statusSelect.querySelectorAll("option").length).toBeGreaterThan(1);
    });
  });

  it("AC-03: clicking a ticket row calls onViewTicket with ticket ID", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketResponse);
    const onViewTicket = vi.fn();
    renderDashboard(onViewTicket);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThan(0);
    });

    const row = document.getElementById("ticket-row-1") as HTMLElement;
    expect(row).not.toBeNull();
    fireEvent.click(row);
    expect(onViewTicket).toHaveBeenCalledWith(1);
  });

  it("shows Create Ticket button that calls onCreateTicket", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketResponse);
    const onCreateTicket = vi.fn();
    renderDashboard(vi.fn(), onCreateTicket);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThan(0);
    });

    const btn = document.getElementById("btn-goto-create-ticket") as HTMLElement;
    expect(btn).not.toBeNull();
    fireEvent.click(btn);
    expect(onCreateTicket).toHaveBeenCalledTimes(1);
  });
});
