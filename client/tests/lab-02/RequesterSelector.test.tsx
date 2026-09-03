import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import RequesterSelector from "../../src/components/RequesterSelector.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Wrap component with context for testing
function renderWithContext(ui: React.ReactNode) {
  return render(<RequesterProvider>{ui}</RequesterProvider>);
}

describe("RequesterSelector (Issue 2 - AC-02, BR-03)", () => {
  it("UI-01: renders the selector screen with testing disclaimer banner", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([
      { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.edu", isActive: true },
      { id: 2, name: "David Lee", email: "david.lee@example.edu", isActive: true },
    ]);

    renderWithContext(<RequesterSelector />);

    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    expect(screen.getByText(/Development Testing Mechanism/i)).toBeInTheDocument();
    expect(screen.getByText(/not a real login screen/i)).toBeInTheDocument();
  });

  it("UI-01: loads and displays only active requesters in dropdown", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([
      { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.edu", isActive: true },
      { id: 2, name: "David Lee", email: "david.lee@example.edu", isActive: true },
    ]);

    renderWithContext(<RequesterSelector />);

    await waitFor(() => {
      expect(screen.getByText(/Jennifer Anderson/i)).toBeInTheDocument();
      expect(screen.getByText(/David Lee/i)).toBeInTheDocument();
    });
  });

  it("BR-03: Continue button is disabled when no requester is selected", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([
      { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.edu", isActive: true },
    ]);

    renderWithContext(<RequesterSelector />);
    await waitFor(() => screen.getByText(/Jennifer Anderson/i));

    const btn = screen.getByRole("button", { name: /Continue as Selected Requester/i });
    expect(btn).toBeDisabled();
  });

  it("BR-03: Continue button enables after selecting a requester", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([
      { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.edu", isActive: true },
    ]);

    renderWithContext(<RequesterSelector />);
    await waitFor(() => screen.getByText(/Jennifer Anderson/i));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    const btn = screen.getByRole("button", { name: /Continue as Selected Requester/i });
    expect(btn).not.toBeDisabled();
  });

  it("Shows error state if API fails to load requesters", async () => {
    vi.spyOn(api, "fetchActiveRequesters").mockRejectedValue(new Error("Network Error"));

    renderWithContext(<RequesterSelector />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load development requesters/i)).toBeInTheDocument();
    });
  });
});
