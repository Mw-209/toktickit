import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  ActionTaken,
  CreateActionTakenPayload,
  fetchActionsTaken,
  createActionTaken,
  updateActionTaken,
} from "../api.js";

interface ActionsTakenSectionProps {
  ticketId: number;
  readOnly?: boolean;
}

export default function ActionsTakenSection({ ticketId, readOnly = false }: ActionsTakenSectionProps) {
  const { user } = useAuth();
  const isStaffOrAdmin = !readOnly && (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR");

  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form mode: null | 'create' | 'edit'
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [editingVersion, setEditingVersion] = useState<number>(1);

  // Form fields
  const [actionDateTime, setActionDateTime] = useState<string>("");
  const [actionDescription, setActionDescription] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>("");
  const [attachmentNotes, setAttachmentNotes] = useState<string>("");

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActionsTaken(ticketId);
      setActions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load actions taken");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, [ticketId]);

  const resetForm = () => {
    setFormMode(null);
    setEditingActionId(null);
    setEditingVersion(1);
    setActionDateTime("");
    setActionDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setFormErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm for datetime-local input
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setActionDateTime(localIso);
    setFormMode("create");
  };

  const openEditForm = (action: ActionTaken) => {
    setFormMode("edit");
    setEditingActionId(action.id);
    setEditingVersion(action.version);
    const dateObj = new Date(action.actionDateTime);
    const localIso = isNaN(dateObj.getTime())
      ? ""
      : new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
    setActionDateTime(localIso);
    setActionDescription(action.actionDescription);
    setResult(action.result);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || "");
    setAttachmentNotes(action.attachmentNotes || "");
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!actionDescription.trim()) {
      errors.actionDescription = "Action description is required.";
    }
    if (!result.trim()) {
      errors.result = "Result is required.";
    }
    if (followUpRequired && !followUpNote.trim()) {
      errors.followUpNote = "Follow-up note is required when follow-up is needed.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setFormErrors({});
    try {
      const payload: CreateActionTakenPayload = {
        actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : new Date().toISOString(),
        actionDescription: actionDescription.trim(),
        result: result.trim(),
        followUpRequired,
        followUpNote: followUpRequired ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
      };

      if (formMode === "create") {
        await createActionTaken(ticketId, payload);
      } else if (formMode === "edit" && editingActionId !== null) {
        await updateActionTaken(ticketId, editingActionId, {
          ...payload,
          version: editingVersion,
        });
      }

      resetForm();
      await loadActions();
    } catch (err: any) {
      setFormErrors({ submit: err.message || "Failed to save action taken" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="zen-card actions-taken-section" style={{ marginTop: "1.5rem" }} data-testid="actions-taken-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🛠️</span> Actions Taken
          </h3>
          <p className="zen-meta" style={{ margin: "0.25rem 0 0 0" }}>
            Detailed operational records of IT staff actions on this ticket.
          </p>
        </div>
        {isStaffOrAdmin && formMode === null && (
          <button
            type="button"
            className="btn-zen-primary"
            onClick={openCreateForm}
            data-testid="add-action-btn"
            style={{ fontSize: "0.9rem", padding: "0.45rem 0.9rem" }}
          >
            + Record Action
          </button>
        )}
      </div>

      {error && (
        <div className="zen-alert" style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5", padding: "0.75rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Form Mode: Create / Edit */}
      {formMode !== null && (
        <form
          onSubmit={handleSubmit}
          data-testid="action-form"
          style={{
            backgroundColor: "#F9FAF9",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--color-primary-green)" }}>
            {formMode === "create" ? "Record New Action Taken" : "Edit Action Taken"}
          </h4>

          {formErrors.submit && (
            <div className="zen-alert" style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
              {formErrors.submit}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="zen-form-label" htmlFor="actionDateTime">
                Action Date / Time
              </label>
              <input
                id="actionDateTime"
                name="actionDateTime"
                type="datetime-local"
                className="zen-input"
                value={actionDateTime}
                onChange={(e) => setActionDateTime(e.target.value)}
              />
            </div>
            <div>
              <label className="zen-form-label" htmlFor="performedBy">
                Performed By
              </label>
              <input
                id="performedBy"
                type="text"
                className="zen-input"
                value={user?.name || "Current User"}
                disabled
                style={{ backgroundColor: "var(--color-field-readonly-bg)", color: "var(--color-text-muted)" }}
              />
            </div>
          </div>

          <div>
            <label className="zen-form-label" htmlFor="actionDescription">
              Action Description <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <textarea
              id="actionDescription"
              name="actionDescription"
              className="zen-input"
              rows={3}
              placeholder="Describe the technical action performed..."
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              aria-invalid={!!formErrors.actionDescription}
              aria-describedby={formErrors.actionDescription ? "desc-error" : undefined}
            />
            {formErrors.actionDescription && (
              <span id="desc-error" style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
                {formErrors.actionDescription}
              </span>
            )}
          </div>

          <div>
            <label className="zen-form-label" htmlFor="result">
              Result / Outcome <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <textarea
              id="result"
              name="result"
              className="zen-input"
              rows={2}
              placeholder="What was the result of this action?"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              aria-invalid={!!formErrors.result}
              aria-describedby={formErrors.result ? "result-error" : undefined}
            />
            {formErrors.result && (
              <span id="result-error" style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
                {formErrors.result}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.95rem" }}>
              <input
                id="followUpRequired"
                name="followUpRequired"
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
              />
              <strong>Follow-Up Required?</strong>
            </label>
            {followUpRequired && (
              <div style={{ marginTop: "0.25rem" }}>
                <label className="zen-form-label" htmlFor="followUpNote">
                  Follow-Up Note <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <textarea
                  id="followUpNote"
                  name="followUpNote"
                  className="zen-input"
                  rows={2}
                  placeholder="Explain what follow-up action is required..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  aria-invalid={!!formErrors.followUpNote}
                  aria-describedby={formErrors.followUpNote ? "followup-error" : undefined}
                />
                {formErrors.followUpNote && (
                  <span id="followup-error" style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
                    {formErrors.followUpNote}
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="zen-form-label" htmlFor="attachmentNotes">
              Attachment Notes (Optional)
            </label>
            <input
              id="attachmentNotes"
              name="attachmentNotes"
              type="text"
              className="zen-input"
              placeholder="e.g. See server_log_01.png or wireshark dump"
              value={attachmentNotes}
              onChange={(e) => setAttachmentNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="btn-zen-secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-zen-primary"
              disabled={submitting}
              data-testid="submit-action-btn"
            >
              {submitting ? "Saving..." : formMode === "create" ? "Save Action" : "Update Action"}
            </button>
          </div>
        </form>
      )}

      {/* List Mode */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)" }}>
          Loading actions taken...
        </div>
      ) : actions.length === 0 ? (
        <div
          data-testid="empty-actions"
          style={{
            textAlign: "center",
            padding: "2rem",
            backgroundColor: "var(--color-pale-green)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-secondary-green)",
            color: "var(--color-text-muted)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 500 }}>No actions have been recorded yet.</p>
          {isStaffOrAdmin && formMode === null && (
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}>
              Click <strong>+ Record Action</strong> above to log work done on this ticket.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} data-testid="actions-list">
          {actions.map((act) => (
            <div
              key={act.id}
              className="action-card"
              data-testid={`action-card-${act.id}`}
              style={{
                border: "1px solid var(--color-surface-border)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                backgroundColor: "var(--color-surface)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-primary-green)" }}>
                    {act.performedByName || "IT Staff"}
                  </strong>
                  <span className="zen-meta" style={{ marginLeft: "0.75rem", fontSize: "0.8rem" }}>
                    {new Date(act.actionDateTime).toLocaleString("th-TH")}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {act.followUpRequired ? (
                    <span
                      className="zen-badge"
                      style={{ backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #FCD34D" }}
                    >
                      Follow-Up Required
                    </span>
                  ) : (
                    <span
                      className="zen-badge"
                      style={{ backgroundColor: "#EAF6EF", color: "#047857", border: "1px solid #A7F3D0" }}
                    >
                      No Follow-Up
                    </span>
                  )}
                  {isStaffOrAdmin && (
                    <button
                      type="button"
                      className="btn-zen-secondary"
                      onClick={() => openEditForm(act)}
                      data-testid={`edit-action-btn-${act.id}`}
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div style={{ fontSize: "0.9rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                <strong>Action: </strong>
                <span>{act.actionDescription}</span>
              </div>

              <div style={{ fontSize: "0.9rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                <strong>Result: </strong>
                <span>{act.result}</span>
              </div>

              {act.followUpRequired && act.followUpNote && (
                <div
                  style={{
                    backgroundColor: "#FFFBEB",
                    borderLeft: "3px solid #F59E0B",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.85rem",
                    color: "#92400E",
                    marginBottom: "0.5rem",
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                  }}
                >
                  <strong>Follow-Up Note: </strong>
                  <span>{act.followUpNote}</span>
                </div>
              )}

              {act.attachmentNotes && (
                <div className="zen-meta" style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  📎 <em>Attachment Notes:</em> {act.attachmentNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
