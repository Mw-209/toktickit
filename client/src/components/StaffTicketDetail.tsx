import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  Ticket,
  PublicComment,
  InternalNote,
  StaffAssignee,
  fetchStaffTicketDetail,
  updateTicketStatus,
  fetchStaffAssignees,
  fetchComments,
  postComment,
  fetchNotes,
  postNote,
  getAttachmentDownloadUrl,
} from "../api.js";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export default function StaffTicketDetail({ ticketId, onBack }: StaffTicketDetailProps) {
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [postingNote, setPostingNote] = useState(false);

  // Local state for IT operations panel
  const [assignedToId, setAssignedToId] = useState<number | "">("");
  const [itPriority, setItPriority] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tData, cData, nData, aData] = await Promise.all([
        fetchStaffTicketDetail(ticketId),
        fetchComments(ticketId),
        fetchNotes(ticketId),
        fetchStaffAssignees()
      ]);
      setTicket(tData);
      setComments(cData);
      setNotes(nData);
      setAssignees(aData.assignees);

      setAssignedToId(tData.assignedTo?.id || "");
      setItPriority(tData.itPriority || "");
      setCurrentStatus(tData.currentStatus);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ticketId]);

  const handleUpdateOperations = async () => {
    setSavingStatus(true);
    setStatusError(null);
    try {
      const updates: any = {};
      
      const newAssignee = assignedToId === "" ? null : Number(assignedToId);
      if (newAssignee !== (ticket?.assignedTo?.id || null)) {
        updates.assignedToId = newAssignee;
      }
      if (itPriority !== (ticket?.itPriority || "")) {
        updates.itPriority = itPriority;
      }
      if (currentStatus !== ticket?.currentStatus) {
        updates.currentStatus = currentStatus;
      }

      if (Object.keys(updates).length > 0) {
        const updated = await updateTicketStatus(ticketId, updates);
        setTicket(updated);
        // Refresh local state to match
        setAssignedToId(updated.assignedTo?.id || "");
        setItPriority(updated.itPriority || "");
        setCurrentStatus(updated.currentStatus);
      }
    } catch (err: any) {
      setStatusError(err.message || "Failed to update ticket");
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      await postComment(ticketId, newComment);
      setNewComment("");
      const cData = await fetchComments(ticketId);
      setComments(cData);
    } catch (err: any) {
      alert(err.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handlePostNote = async () => {
    if (!newNote.trim()) return;
    setPostingNote(true);
    try {
      await postNote(ticketId, newNote);
      setNewNote("");
      const nData = await fetchNotes(ticketId);
      setNotes(nData);
    } catch (err: any) {
      alert(err.message || "Failed to post note");
    } finally {
      setPostingNote(false);
    }
  };

  const getPriorityClass = (priority: string | null) => {
    if (!priority) return "zen-badge-low";
    switch (priority) {
      case "URGENT": return "zen-badge-urgent";
      case "HIGH": return "zen-badge-high";
      case "MEDIUM": return "zen-badge-medium";
      case "LOW":
      default: return "zen-badge-low";
    }
  };

  const getStatusClass = (status: string) => {
    const s = status.toUpperCase();
    if (s === "IN_PROGRESS") return "zen-badge-inprogress";
    return `zen-badge-${s.toLowerCase().replace(/_/g, '')}`;
  };

  if (loading) {
    return (
      <div className="zen-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div className="zen-loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-container">
        <button className="btn-zen-secondary" onClick={onBack} style={{ marginBottom: "1rem" }}>
          ← Back to Queue
        </button>
        <div className="zen-alert zen-alert-danger">
          <p>{error || "Ticket not found."}</p>
        </div>
      </div>
    );
  }

  const activeAttachments = ticket.attachments.filter(a => !a.isRemoved) || [];
  const removedAttachments = ticket.attachments.filter(a => a.isRemoved) || [];

  return (
    <div className="zen-container" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      <button className="btn-zen-secondary" onClick={onBack} style={{ marginBottom: "1rem" }}>
        ← Back to Queue
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)", gap: "1.5rem" }} className="ticket-detail-grid">
        
        {/* Left Column: Ticket Info & Attachments & Comments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Section A: Ticket Information */}
          <div className="zen-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--color-primary-green)" }}>{ticket.ticketNumber}</h2>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Created: {new Date(ticket.createdAt).toLocaleString("th-TH")}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Updated: {new Date(ticket.updatedAt).toLocaleString("th-TH")}
                </span>
              </div>
            </div>
            
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>{ticket.summary}</h3>
            
            <div style={{ backgroundColor: "#F9FAFB", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "1.5rem", whiteSpace: "pre-wrap", minHeight: "100px" }}>
              {ticket.description}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "#F0Fdf4", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid #dcfce7" }}>
              <div>
                <span className="zen-meta">Requester</span>
                <div style={{ fontWeight: 500 }}>{ticket.requester?.name || "Unknown"}</div>
              </div>
              <div>
                <span className="zen-meta">Requested Priority</span>
                <div><span className={`zen-badge ${getPriorityClass(ticket.requestedPriority)}`}>{ticket.requestedPriority}</span></div>
              </div>
              <div>
                <span className="zen-meta">Category</span>
                <div style={{ fontWeight: 500 }}>{ticket.category?.name || "—"}</div>
              </div>
              <div>
                <span className="zen-meta">Related System</span>
                <div style={{ fontWeight: 500 }}>{ticket.relatedSystem?.name || "—"}</div>
              </div>
            </div>
          </div>

          {/* Section C: Attachments (Read-only) */}
          <div className="zen-card">
            <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              📎 Attachments
              <span className="zen-badge" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                {activeAttachments.length}
              </span>
            </h3>

            {activeAttachments.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {activeAttachments.map(att => (
                  <li key={att.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      <span style={{ fontSize: "1.5rem" }}>
                        {att.mimeType.startsWith("image/") ? "🖼️" : att.mimeType === "application/pdf" ? "📄" : "📁"}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <a href={getAttachmentDownloadUrl(att.id)} target="_blank" rel="noreferrer" style={{ fontWeight: 500, textDecoration: "none", color: "var(--color-primary-green)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.originalName}
                        </a>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {(att.sizeBytes / 1024).toFixed(1)} KB • Uploaded {new Date(att.createdAt).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="zen-meta" style={{ margin: 0 }}>No active attachments.</p>
            )}

            {removedAttachments.length > 0 && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                <h4 style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 0.5rem 0" }}>Removed Attachments</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {removedAttachments.map(att => (
                    <li key={att.id} style={{ padding: "0.5rem 0.75rem", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface-hover)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textDecoration: "line-through" }}>{att.originalName}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>Removed</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Reason: {att.removalReason || "No reason provided"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Section D: Public Comments */}
          <div className="zen-card">
            <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              💬 Public Comments
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {comments.length > 0 ? comments.map(c => (
                <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "1rem", borderRadius: "var(--radius-lg)", backgroundColor: c.author.role === "REQUESTER" ? "#F9FAFB" : "#F0Fdf4", border: "1px solid", borderColor: c.author.role === "REQUESTER" ? "var(--color-border)" : "#dcfce7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong style={{ fontSize: "0.9rem" }}>{c.author.name}</strong>
                      <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "10px", backgroundColor: c.author.role === "REQUESTER" ? "#e5e7eb" : "var(--color-primary-green)", color: c.author.role === "REQUESTER" ? "#374151" : "#fff" }}>
                        {c.author.role.replace('_', ' ')}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {new Date(c.createdAt).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap", color: "var(--color-text)" }}>
                    {c.content}
                  </div>
                </div>
              )) : (
                <p className="zen-meta" style={{ textAlign: "center", margin: "1rem 0" }}>No comments yet. Start the conversation!</p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <textarea 
                className="zen-input" 
                rows={3} 
                placeholder="Write a public comment to the requester..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                maxLength={2000}
                style={{ resize: "vertical" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button 
                  className="btn-zen-primary" 
                  onClick={handlePostComment} 
                  disabled={!newComment.trim() || postingComment}
                >
                  {postingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Operations & Internal Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Section B: IT Staff Operations Panel */}
          <div className="zen-card" style={{ borderTop: "4px solid var(--color-primary-green)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.1rem" }}>⚙️ Operations</h3>

            {statusError && (
              <div className="zen-alert zen-alert-danger" style={{ marginBottom: "1rem", padding: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem" }}>{statusError}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              {/* Owner */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label className="zen-form-label">Owner</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select 
                    className="zen-select" 
                    value={assignedToId} 
                    onChange={e => setAssignedToId(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ flex: 1 }}
                  >
                    <option value="">Unassigned</option>
                    {assignees.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                  {assignedToId === "" && (
                    <button 
                      className="btn-zen-secondary" 
                      onClick={() => setAssignedToId(user?.id || "")}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      Claim
                    </button>
                  )}
                </div>
              </div>

              {/* IT Priority */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label className="zen-form-label">IT Priority</label>
                <select 
                  className="zen-select" 
                  value={itPriority} 
                  onChange={e => setItPriority(e.target.value)}
                >
                  <option value="" disabled>-- Set Priority --</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label className="zen-form-label">Status</label>
                <select 
                  className="zen-select" 
                  value={currentStatus} 
                  onChange={e => setCurrentStatus(e.target.value)}
                >
                  <option value="NEW">New</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REOPENED">Reopened</option>
                </select>
              </div>

              {ticket.resolveIndicatedAt && (
                <div className="zen-alert" style={{ backgroundColor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", padding: "0.75rem", fontSize: "0.85rem" }}>
                  <strong>Requester Update:</strong> The requester indicated this problem appears resolved on {new Date(ticket.resolveIndicatedAt).toLocaleString("th-TH")}.
                </div>
              )}

              <button 
                className="btn-zen-primary" 
                onClick={handleUpdateOperations}
                disabled={savingStatus}
                style={{ width: "100%", marginTop: "0.5rem" }}
              >
                {savingStatus ? "Saving..." : "Update Ticket"}
              </button>

            </div>
          </div>

          {/* Section E: Internal Notes */}
          <div className="zen-card" style={{ backgroundColor: "#FDF4FF", border: "1px solid #fbcfe8" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#86198f" }}>
              🔒 Internal Notes
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#a21caf", margin: "0 0 1rem 0" }}>Visible to IT Staff & Admin only</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {notes.length > 0 ? notes.map(n => (
                <div key={n.id} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "#fff", border: "1px solid #fbcfe8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong style={{ fontSize: "0.85rem", color: "#86198f" }}>{n.author.name}</strong>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                      {new Date(n.createdAt).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "var(--color-text)" }}>
                    {n.content}
                  </div>
                </div>
              )) : (
                <p className="zen-meta" style={{ textAlign: "center", margin: "1rem 0", color: "#d946ef" }}>No internal notes yet.</p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <textarea 
                className="zen-input" 
                rows={3} 
                placeholder="Write an internal note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                maxLength={2000}
                style={{ resize: "vertical", borderColor: "#fbcfe8" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button 
                  className="btn-zen-primary" 
                  onClick={handlePostNote} 
                  disabled={!newNote.trim() || postingNote}
                  style={{ backgroundColor: "#86198f" }}
                >
                  {postingNote ? "Adding..." : "Add Note"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Basic Mobile CSS adjustments */}
      <style>{`
        @media (max-width: 768px) {
          .ticket-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
