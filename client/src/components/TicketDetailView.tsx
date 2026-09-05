import React, { useState, useEffect, useRef } from "react";
import { Ticket, Attachment, fetchTicketDetail, uploadAttachment, softRemoveAttachment, getAttachmentDownloadUrl } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface TicketDetailViewProps {
  ticketId: number;
  onBack: () => void;
}

export default function TicketDetailView({ ticketId, onBack }: TicketDetailViewProps) {
  const { selectedRequester } = useRequester();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Soft-remove modal state
  const [removingAttachment, setRemovingAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const loadTicket = async () => {
    if (!selectedRequester) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketDetail(ticketId, selectedRequester.id);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId, selectedRequester]);

  const activeAttachments = ticket?.attachments.filter(a => !a.isRemoved) || [];
  const removedAttachments = ticket?.attachments.filter(a => a.isRemoved) || [];
  const canUpload = activeAttachments.length < 5;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedRequester) return;
    const file = e.target.files[0];
    
    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must not exceed 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, WEBP, and PDF files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      await uploadAttachment(ticketId, selectedRequester.id, file);
      await loadTicket(); // reload to get new attachment
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removingAttachment || !selectedRequester) return;
    if (removalReason.trim().length < 3) {
      setRemoveError("Removal reason must be at least 3 characters.");
      return;
    }

    setRemoving(true);
    setRemoveError(null);
    try {
      await softRemoveAttachment(ticketId, removingAttachment.id, selectedRequester.id, removalReason);
      setRemovingAttachment(null);
      setRemovalReason("");
      await loadTicket(); // reload to update attachment status
    } catch (err: any) {
      setRemoveError(err.message || "Failed to remove attachment");
    } finally {
      setRemoving(false);
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case "URGENT": return "zen-badge-urgent";
      case "HIGH": return "zen-badge-high";
      case "MEDIUM": return "zen-badge-medium";
      default: return "zen-badge-low";
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "NEW": return "zen-badge-new";
      case "IN_PROGRESS": return "zen-badge-inprogress";
      case "RESOLVED": return "zen-badge-resolved";
      default: return "zen-badge-closed";
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}>Loading ticket details...</div>;
  }

  if (error || !ticket) {
    return (
      <div>
        <button className="zen-btn-secondary" onClick={onBack} style={{ marginBottom: "1rem" }}>
          ← Back to My Tickets
        </button>
        <div className="zen-alert-warning">{error || "Ticket not found"}</div>
      </div>
    );
  }

  return (
    <div>
      <button className="zen-btn-secondary" onClick={onBack} style={{ marginBottom: "1rem" }}>
        ← Back to My Tickets
      </button>

      {/* Overview Card */}
      <div className="zen-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
            <span style={{ fontFamily: "monospace", color: "var(--color-primary-green)", marginRight: "0.5rem" }}>
              {ticket.ticketNumber}
            </span>
          </h2>
          <span className={`zen-badge ${getStatusBadgeClass(ticket.currentStatus)}`}>
            {ticket.currentStatus.replace("_", " ")}
          </span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <div className="zen-form-label" style={{ color: "var(--color-text-muted)" }}>Category</div>
            <div className="zen-readonly-field" style={{ padding: "0.45rem 0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
              {ticket.category?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="zen-form-label" style={{ color: "var(--color-text-muted)" }}>Related System</div>
            <div className="zen-readonly-field" style={{ padding: "0.45rem 0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
              {ticket.relatedSystem?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="zen-form-label" style={{ color: "var(--color-text-muted)" }}>Requested Priority</div>
            <div style={{ padding: "0.45rem 0" }}>
              <span className={`zen-badge ${getPriorityBadgeClass(ticket.requestedPriority)}`}>
                {ticket.requestedPriority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="zen-card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--color-text-main)" }}>Problem Description</h3>
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="zen-form-label">Summary</div>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-main)" }}>
            {ticket.summary}
          </div>
        </div>
        <div>
          <div className="zen-form-label">Description</div>
          <div style={{ 
            whiteSpace: "pre-wrap", 
            background: "#F8FAFC", 
            padding: "1rem", 
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-surface-border)",
            fontSize: "0.9rem",
            color: "var(--color-text-muted)"
          }}>
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Attachments Card */}
      <div className="zen-card">
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Attachments ({activeAttachments.length}/5)</span>
          <button 
            type="button" 
            className="zen-upload-btn" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload || uploading}
            style={{ opacity: (!canUpload || uploading) ? 0.5 : 1 }}
          >
            {uploading ? "Uploading..." : "+ Add Attachment"}
          </button>
        </h3>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileSelect}
        />
        
        {uploadError && <div className="zen-field-error" style={{ marginBottom: "1rem" }}>{uploadError}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Active Attachments */}
          {activeAttachments.length > 0 && activeAttachments.map(a => (
            <div key={a.id} className="zen-file-item" style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                <span style={{ fontSize: "1.2rem" }}>{a.mimeType === "application/pdf" ? "📄" : "🖼️"}</span>
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.originalName}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{(a.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <a 
                  href={getAttachmentDownloadUrl(a.id, selectedRequester?.id || 0)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-zen-secondary"
                  style={{ textDecoration: "none", fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                >
                  Download
                </a>
                <button 
                  type="button" 
                  className="btn-zen-danger"
                  onClick={() => { setRemovingAttachment(a); setRemovalReason(""); setRemoveError(null); }}
                  data-testid={`remove-attachment-${a.id}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          
          {/* Removed Attachments */}
          {removedAttachments.length > 0 && removedAttachments.map(a => (
            <div key={a.id} className="zen-file-item" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", opacity: 0.6 }}>
                <span style={{ fontSize: "1.2rem" }}>{a.mimeType === "application/pdf" ? "📄" : "🖼️"}</span>
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <span style={{ fontWeight: 500, textDecoration: "line-through" }}>{a.originalName}</span>
                </div>
                <span className="zen-badge" style={{ marginLeft: "auto", backgroundColor: "#E2E8F0", color: "#64748B" }}>Removed</span>
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#64748B", paddingLeft: "2rem" }}>
                <div>Removed on: {new Date(a.removedAt!).toLocaleString()}</div>
                <div style={{ fontStyle: "italic" }}>Reason: "{a.removalReason}"</div>
              </div>
            </div>
          ))}

          {ticket.attachments.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)", background: "#F8FAFC", borderRadius: "var(--radius-sm)", border: "1px dashed var(--color-field-border)" }}>
              No attachments provided for this ticket.
            </div>
          )}
        </div>
      </div>

      {/* Soft-Removal Modal */}
      {removingAttachment && (
        <div className="zen-modal-overlay">
          <div className="zen-modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="zen-modal-header" id="modal-title">
              Remove Attachment
            </div>
            <div className="zen-modal-body">
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem" }}>
                Are you sure you want to remove <strong>{removingAttachment.originalName}</strong>?
              </p>
              <div className="zen-form-label">
                Removal Reason <span className="zen-required">*</span>
              </div>
              <textarea
                className={`zen-textarea ${removeError ? "zen-input-error" : ""}`}
                placeholder="Please state why you are removing this file (min 3 characters)..."
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                style={{ minHeight: "80px" }}
              />
              {removeError && <span className="zen-field-error">{removeError}</span>}
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                Note: This file will not be deleted from the server, but will be marked as removed and cannot be downloaded by IT staff.
              </div>
            </div>
            <div className="zen-modal-footer">
              <button 
                className="btn-zen-secondary" 
                onClick={() => setRemovingAttachment(null)}
                disabled={removing}
              >
                Cancel
              </button>
              <button 
                className="btn-zen-primary" 
                style={{ backgroundColor: "var(--color-error)" }}
                onClick={handleRemoveConfirm}
                disabled={removing}
              >
                {removing ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
