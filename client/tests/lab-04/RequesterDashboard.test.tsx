import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";

// ---------------------------------------------------------------------------
// RequesterDashboard.test.tsx — Lab 4 UI Component Tests (Issue 5)
// Tests: UI-RD-01 through UI-RD-03
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockRequesterData: api.RequesterDashboardData = {
  totalOpenTickets: 4,
  waitingForRequester: 2,
  recentlyUpdated: 3,
  recentlyResolved: 1,
};

vi.mock("../../src/api.js", () => ({
  fetchRequesterDashboard: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: vi.fn(),
}));

describe("RequesterDashboard Component (Lab 4 Issue 5)", () => {
  const requesterUser: api.AuthUser = {
    id: 1,
    email: "john@example.com",
    name: "John Requester",
    role: "REQUESTER",
    mustChangePassword: false,
  };

  const onNavigateMock = vi.fn();

  beforeEach(() => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: requesterUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.mocked(api.fetchRequesterDashboard).mockResolvedValue(mockRequesterData);
  });

  // UI-RD-01: Dashboard renders only requester-scoped data
  it("UI-RD-01: renders requester-scoped ticket metrics from API", async () => {
    render(<RequesterDashboard onNavigate={onNavigateMock} />);

    await waitFor(() => {
      const openCard = screen.getByTestId("metric-total-open");
      expect(openCard).toBeInTheDocument();
      expect(openCard).toHaveTextContent("4");
    });

    const waitingCard = screen.getByTestId("metric-waiting-me");
    expect(waitingCard).toHaveTextContent("2");

    const updatedCard = screen.getByTestId("metric-recently-updated");
    expect(updatedCard).toHaveTextContent("3");

    const resolvedCard = screen.getByTestId("metric-recently-resolved");
    expect(resolvedCard).toHaveTextContent("1");
  });

  // UI-RD-02: Loading state shown while fetching
  it("UI-RD-02: shows loading spinner / skeleton while fetching dashboard data", () => {
    vi.mocked(api.fetchRequesterDashboard).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<RequesterDashboard onNavigate={onNavigateMock} />);

    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
  });

  // UI-RD-03: Empty state when Requester has no open Tickets
  it("UI-RD-03: shows empty open tickets state when totalOpenTickets is 0", async () => {
    vi.mocked(api.fetchRequesterDashboard).mockResolvedValue({
      totalOpenTickets: 0,
      waitingForRequester: 0,
      recentlyUpdated: 1,
      recentlyResolved: 2,
    });

    render(<RequesterDashboard onNavigate={onNavigateMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-open-state")).toBeInTheDocument();
      expect(screen.getByText(/You have no open support tickets!/i)).toBeInTheDocument();
    });

    // Clicking create new ticket inside empty state triggers navigation
    const emptyState = screen.getByTestId("empty-open-state");
    const createBtn = within(emptyState).getByRole("button", { name: /Create New Ticket/i });
    fireEvent.click(createBtn);
    expect(onNavigateMock).toHaveBeenCalledWith("create-ticket");
  });

  // Role Mismatch: Staff trying to view Requester dashboard
  it("shows 403 access denied when user is IT_STAFF", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: {
        id: 2,
        email: "staff@example.com",
        name: "Alice Staff",
        role: "IT_STAFF",
        mustChangePassword: false,
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<RequesterDashboard onNavigate={onNavigateMock} />);

    expect(screen.getByTestId("forbidden-message")).toBeInTheDocument();
    expect(screen.getByText(/403 — Access Denied/i)).toBeInTheDocument();
    expect(api.fetchRequesterDashboard).not.toHaveBeenCalled();
  });
});
