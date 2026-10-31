import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import StaffDashboard from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";

// ---------------------------------------------------------------------------
// StaffDashboard.test.tsx — Lab 4 UI Component Tests (Issue 5)
// Tests: UI-SD-01 through UI-SD-04
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockStaffDashboardData: api.StaffDashboardData = {
  unassignedTickets: 7,
  myTickets: 3,
  ticketsByStatus: {
    New: 2,
    Open: 5,
    InProgress: 3,
    WaitingForRequester: 1,
    Resolved: 10,
    Closed: 15,
    Cancelled: 1,
    Reopened: 0,
  },
  recentlyUpdated: 8,
  myRecentActions: [
    {
      actionId: 1,
      ticketId: 10,
      ticketNumber: "TKT-2026-000010",
      ticketTitle: "VPN connection issue",
      actionDescription: "Reset user credentials and configured MFA.",
      actionDateTime: "2026-03-01T10:00:00.000Z",
    },
  ],
  recentTickets: [
    {
      id: 11,
      ticketNumber: "TKT-2026-000011",
      summary: "Printer not responding",
      description: "Office printer is offline",
      requestedPriority: "LOW",
      itPriority: "LOW",
      currentStatus: "RESOLVED",
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "Hardware" },
      relatedSystem: { id: 1, name: "Printer", isActive: true },
      assignedTo: { id: 2, name: "Alice Staff", role: "IT_STAFF" },
      attachments: [],
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
    },
  ],
};

vi.mock("../../src/api.js", () => ({
  fetchStaffDashboard: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: vi.fn(),
}));

describe("StaffDashboard Component (Lab 4 Issue 5)", () => {
  const staffUser: api.AuthUser = {
    id: 2,
    email: "staff@example.com",
    name: "Alice Staff",
    role: "IT_STAFF",
    mustChangePassword: false,
  };

  const onNavigateMock = vi.fn();

  beforeEach(() => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: staffUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.mocked(api.fetchStaffDashboard).mockResolvedValue(mockStaffDashboardData);
  });

  // UI-SD-01: Dashboard renders unassigned count from API
  it("UI-SD-01: renders unassigned count and workload metrics from API", async () => {
    render(<StaffDashboard onNavigate={onNavigateMock} />);

    await waitFor(() => {
      const unassignedCard = screen.getByTestId("metric-unassigned");
      expect(unassignedCard).toBeInTheDocument();
      expect(unassignedCard).toHaveTextContent("7");
    });

    const myTicketsCard = screen.getByTestId("metric-mytickets");
    expect(myTicketsCard).toHaveTextContent("3");

    const recentlyUpdatedCard = screen.getByTestId("metric-recently-updated");
    expect(recentlyUpdatedCard).toHaveTextContent("8");

    // Check recent actions and recent tickets render
    expect(screen.getByText("Reset user credentials and configured MFA.")).toBeInTheDocument();
    expect(screen.getByText("VPN connection issue")).toBeInTheDocument();
    expect(screen.getByText("Printer not responding")).toBeInTheDocument();
  });

  // UI-SD-02: Loading state shown while fetching
  it("UI-SD-02: shows loading spinner / skeleton while fetching dashboard data", () => {
    vi.mocked(api.fetchStaffDashboard).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<StaffDashboard onNavigate={onNavigateMock} />);

    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
  });

  // UI-SD-03: Clicking a metric card navigates to filtered view
  it("UI-SD-03: clicking metric cards triggers onNavigate with appropriate filter params", async () => {
    render(<StaffDashboard onNavigate={onNavigateMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("metric-unassigned")).toBeInTheDocument();
    });

    // Click Unassigned card
    fireEvent.click(screen.getByTestId("metric-unassigned"));
    expect(onNavigateMock).toHaveBeenCalledWith("staff-queue", { filter: "unassigned" });

    // Click My Tickets card
    fireEvent.click(screen.getByTestId("metric-mytickets"));
    expect(onNavigateMock).toHaveBeenCalledWith("staff-queue", { filter: "my-tickets" });

    // Click "Go to Ticket Queue" button in header
    fireEvent.click(screen.getByText(/Go to Ticket Queue/i));
    expect(onNavigateMock).toHaveBeenCalledWith("staff-queue");
  });

  // UI-SD-04: Forbidden state shown when role mismatch
  it("UI-SD-04: shows 403 access denied message when user is a Requester", async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: {
        id: 1,
        email: "student@example.com",
        name: "Student Requester",
        role: "REQUESTER",
        mustChangePassword: false,
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<StaffDashboard onNavigate={onNavigateMock} />);

    expect(screen.getByTestId("forbidden-message")).toBeInTheDocument();
    expect(screen.getByText(/403 — Access Denied/i)).toBeInTheDocument();
    expect(api.fetchStaffDashboard).not.toHaveBeenCalled();
  });
});
