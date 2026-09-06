import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import CreateTicketForm from "../../src/components/CreateTicketForm.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const mockCategories = [
  { id: 1, name: "Hardware" },
  { id: 2, name: "Software" },
];
const mockSystems = [
  { id: 1, name: "Student Information System", isActive: true },
  { id: 2, name: "Library System", isActive: true },
];
const mockRequester = { id: 2, name: "David Lee", email: "david.lee@example.edu", isActive: true };

function renderForm(onSuccess = vi.fn(), onCancel = vi.fn()) {
  // Pre-populate session with a selected requester
  sessionStorage.setItem("toktickit_dev_requester", JSON.stringify(mockRequester));
  vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);

  return render(
    <RequesterProvider>
      <CreateTicketForm
        categories={mockCategories}
        relatedSystems={mockSystems}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </RequesterProvider>
  );
}

describe("CreateTicketForm (Issue 3 - FR-05, FR-06, BR-01)", () => {
  it("UI-02: renders all required form fields", () => {
    renderForm();
    expect(screen.getByLabelText(/Summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Related System/i)).toBeInTheDocument();
    expect(screen.getByText(/MEDIUM/i)).toBeInTheDocument();
  });

  it("UI-02: shows Category and Related System dropdown options", () => {
    renderForm();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Student Information System")).toBeInTheDocument();
    expect(screen.getByText("Library System")).toBeInTheDocument();
  });

  it("FR-06: shows validation errors when submitting empty form", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/Summary is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Category is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Related System is required/i)).toBeInTheDocument();
    });
  });

  it("FR-06: shows error when summary is less than 5 characters (BR-05)", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/Summary/i), { target: { value: "Hi!!" } }); // 4 chars, below min of 5
    fireEvent.click(screen.getByRole("button", { name: /Create Ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 5 characters/i)).toBeInTheDocument();
    });
  });

  it("FR-05: calls createTicket API with correct data on valid submit", async () => {
    const mockTicket = { id: 1, ticketNumber: "TKT-2026-000001" };
    vi.spyOn(api, "createTicket").mockResolvedValue(mockTicket as any);
    const onSuccess = vi.fn();
    renderForm(onSuccess);

    fireEvent.change(screen.getByLabelText(/Summary/i), { target: { value: "My computer is not working" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "It shuts down randomly since this morning" } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Related System/i), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Ticket/i }));

    await waitFor(() => {
      expect(api.createTicket).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith("TKT-2026-000001");
    });
  });

  it("BR-01: shows server error message when API call fails", async () => {
    vi.spyOn(api, "createTicket").mockRejectedValue(new Error("Server Error"));
    renderForm();

    fireEvent.change(screen.getByLabelText(/Summary/i), { target: { value: "My computer is not working" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "It shuts down randomly since this morning" } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Related System/i), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/Server Error/i)).toBeInTheDocument();
    });
  });

  it("UI-02: Cancel button calls onCancel handler", () => {
    const onCancel = vi.fn();
    renderForm(vi.fn(), onCancel);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
