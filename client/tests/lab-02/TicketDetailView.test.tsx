import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import TicketDetailView from "../../src/components/TicketDetailView.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear(); });

const mockRequester = { id: 2, name: "David Lee", email: "david.lee@example.edu", isActive: true };

const mockTicket = {
  id: 1, ticketNumber: "TKT-2026-000001", summary: "Computer won't turn on",
  description: "My computer does not start at all.", requestedPriority: "HIGH" as const,
  itPriority: null, currentStatus: "NEW" as const,
  requesterId: 2, categoryId: 1, relatedSystemId: 1,
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 1, name: "Corporate Laptop", isActive: true },
  attachments: [
    { id: 101, ticketId: 1, originalName: "error.png", storedName: "123.png", mimeType: "image/png", sizeBytes: 10240, isRemoved: false, removedAt: null, removalReason: null, createdAt: "2026-09-03T10:00:00Z" }
  ], 
  createdAt: "2026-09-03T10:00:00Z", updatedAt: "2026-09-03T10:00:00Z",
};

function renderTicketDetail(onBack = vi.fn()) {
  sessionStorage.setItem("toktickit_dev_requester", JSON.stringify(mockRequester));
  return render(
    <RequesterProvider>
      <TicketDetailView ticketId={1} onBack={onBack} />
    </RequesterProvider>
  );
}

describe("TicketDetailView (Issue 5 - AC-04, AC-07, AC-08)", () => {
  it("AC-04: renders ticket details correctly", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicket);
    renderTicketDetail();

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
      expect(screen.getByText("Computer won't turn on")).toBeInTheDocument();
      expect(screen.getByText(/My computer does not start at all/i)).toBeInTheDocument();
      expect(screen.getByText("error.png")).toBeInTheDocument();
    });
  });

  it("handles API error properly (e.g. 403 Forbidden for cross-requester access)", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockRejectedValue(new Error("Access Denied: You cannot view another user's ticket."));
    renderTicketDetail();

    await waitFor(() => {
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });
  });

  it("AC-07: handles file upload safely", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicket);
    const uploadSpy = vi.spyOn(api, "uploadAttachment").mockResolvedValue({
      id: 102, ticketId: 1, originalName: "new.pdf", storedName: "124.pdf", mimeType: "application/pdf", sizeBytes: 5000, isRemoved: false, removedAt: null, removalReason: null, createdAt: "2026-09-03T11:00:00Z"
    });
    
    renderTicketDetail();
    await waitFor(() => expect(screen.getByText("error.png")).toBeInTheDocument());

    const file = new File(["dummy content"], "new.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate user selecting a file
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(1, 2, expect.any(File));
    });
  });

  it("blocks file upload over 5MB client-side", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicket);
    const uploadSpy = vi.spyOn(api, "uploadAttachment");
    renderTicketDetail();
    
    await waitFor(() => expect(screen.getByText("error.png")).toBeInTheDocument());

    // Create a dummy file object that claims to be 6MB
    const bigFile = new File([""], "big.pdf", { type: "application/pdf" });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [bigFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/must not exceed 5 MB/i)).toBeInTheDocument();
      expect(uploadSpy).not.toHaveBeenCalled();
    });
  });

  it("AC-08: can soft-remove an attachment with reason", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicket);
    const removeSpy = vi.spyOn(api, "softRemoveAttachment").mockResolvedValue({
       ...mockTicket.attachments[0], isRemoved: true, removalReason: "Uploaded wrong file", removedAt: new Date().toISOString()
    });
    
    renderTicketDetail();
    await waitFor(() => expect(screen.getByText("error.png")).toBeInTheDocument());

    // Click remove button
    const removeBtn = screen.getByTestId("remove-attachment-101");
    fireEvent.click(removeBtn);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Removal Reason/i)).toBeInTheDocument();
    });

    // Fill in reason
    const textarea = screen.getByPlaceholderText(/state why you are removing/i);
    fireEvent.change(textarea, { target: { value: "Uploaded wrong file" } });
    
    // Confirm removal
    fireEvent.click(screen.getByRole("button", { name: /Confirm Removal/i }));
    
    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith(1, 101, 2, "Uploaded wrong file");
    });
  });

  it("blocks soft-removal if reason is too short", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicket);
    const removeSpy = vi.spyOn(api, "softRemoveAttachment");
    
    renderTicketDetail();
    await waitFor(() => expect(screen.getByText("error.png")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("remove-attachment-101"));

    await waitFor(() => expect(screen.getByText(/Removal Reason/i)).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText(/state why you are removing/i);
    fireEvent.change(textarea, { target: { value: "No" } }); // 2 chars
    
    fireEvent.click(screen.getByRole("button", { name: /Confirm Removal/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument();
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
});
