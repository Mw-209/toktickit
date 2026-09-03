import { useState, useRef } from "react";
import { useRequester } from "../context/RequesterContext.js";
import { Category, RelatedSystem, createTicket } from "../api.js";

interface CreateTicketFormProps {
  categories: Category[];
  relatedSystems: RelatedSystem[];
  onSuccess: (ticketNumber: string) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

interface PendingFile {
  file: File;
  id: string;
  error?: string;
}

export default function CreateTicketForm({ categories, relatedSystems, onSuccess, onCancel }: CreateTicketFormProps) {
  const { selectedRequester } = useRequester();

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [priority, setPriority] = useState<typeof PRIORITY_OPTIONS[number]>("MEDIUM");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (file: File): string | undefined => {
    if (!ALLOWED_TYPES.includes(file.type)) return "ประเภทไฟล์ไม่รองรับ (รองรับเฉพาะ JPG, PNG, WEBP, PDF)";
    if (file.size > MAX_FILE_SIZE) return "ไฟล์ใหญ่เกิน 5MB";
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_FILES - pendingFiles.length;
    const toAdd = files.slice(0, remaining).map((f) => ({
      file: f,
      id: `${Date.now()}-${Math.random()}`,
      error: validateFiles(f),
    }));
    setPendingFiles((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.id !== id));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!summary.trim()) errors.summary = "Summary is required.";
    else if (summary.trim().length < 10) errors.summary = "Summary must be at least 10 characters.";
    if (!description.trim()) errors.description = "Description is required.";
    else if (description.trim().length < 20) errors.description = "Description must be at least 20 characters.";
    if (!categoryId) errors.categoryId = "Category is required.";
    if (!relatedSystemId) errors.relatedSystemId = "Related System is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (pendingFiles.some((pf) => pf.error)) {
      setSubmitError("Please remove invalid files before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("requesterId", String(selectedRequester!.id));
      formData.append("summary", summary.trim());
      formData.append("description", description.trim());
      formData.append("categoryId", categoryId);
      formData.append("relatedSystemId", relatedSystemId);
      formData.append("requestedPriority", priority);
      pendingFiles.forEach(({ file }) => formData.append("files", file));

      const ticket = await createTicket(formData);
      onSuccess(ticket.ticketNumber);
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeFiles = pendingFiles.filter((pf) => !pf.error);
  const canAddMore = pendingFiles.length < MAX_FILES;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="zen-card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.25rem", fontWeight: 700 }}>✏️ Create New Ticket</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Submitting as: <strong>{selectedRequester?.name}</strong>
        </p>

        {submitError && (
          <div className="zen-alert-warning" style={{ marginBottom: "1rem" }}>
            ❌ {submitError}
          </div>
        )}

        {/* Summary */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="ticket-summary" className="zen-form-label">
            Summary <span className="zen-required">*</span>
          </label>
          <input
            id="ticket-summary"
            className={`zen-input ${fieldErrors.summary ? "zen-input-error" : ""}`}
            type="text"
            placeholder="Briefly describe your issue (min 10 characters)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={200}
          />
          {fieldErrors.summary && <p className="zen-field-error">{fieldErrors.summary}</p>}
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {summary.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="ticket-description" className="zen-form-label">
            Description <span className="zen-required">*</span>
          </label>
          <textarea
            id="ticket-description"
            className={`zen-textarea ${fieldErrors.description ? "zen-input-error" : ""}`}
            rows={5}
            placeholder="Provide detailed information about the issue (min 20 characters)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {fieldErrors.description && <p className="zen-field-error">{fieldErrors.description}</p>}
        </div>

        {/* Category & Related System (2 columns) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <label htmlFor="ticket-category" className="zen-form-label">
              Category <span className="zen-required">*</span>
            </label>
            <select
              id="ticket-category"
              className={`zen-select ${fieldErrors.categoryId ? "zen-input-error" : ""}`}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— Select Category —</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            {fieldErrors.categoryId && <p className="zen-field-error">{fieldErrors.categoryId}</p>}
          </div>
          <div>
            <label htmlFor="ticket-system" className="zen-form-label">
              Related System <span className="zen-required">*</span>
            </label>
            <select
              id="ticket-system"
              className={`zen-select ${fieldErrors.relatedSystemId ? "zen-input-error" : ""}`}
              value={relatedSystemId}
              onChange={(e) => setRelatedSystemId(e.target.value)}
            >
              <option value="">— Select System —</option>
              {relatedSystems.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
            {fieldErrors.relatedSystemId && <p className="zen-field-error">{fieldErrors.relatedSystemId}</p>}
          </div>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="zen-form-label">Requested Priority</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                id={`priority-${p.toLowerCase()}`}
                className={`zen-priority-btn zen-priority-${p.toLowerCase()} ${priority === p ? "active" : ""}`}
                onClick={() => setPriority(p)}
              >
                {p === "LOW" && "🟢"} {p === "MEDIUM" && "🟡"} {p === "HIGH" && "🟠"} {p === "URGENT" && "🔴"} {p}
              </button>
            ))}
          </div>
        </div>

        {/* File Attachments */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="zen-form-label">
            Attachments <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional, max {MAX_FILES} files, 5MB each, JPG/PNG/WEBP/PDF)</span>
          </label>

          {pendingFiles.length > 0 && (
            <div style={{ marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {pendingFiles.map((pf) => (
                <div key={pf.id} className={`zen-file-item ${pf.error ? "zen-file-error" : ""}`}>
                  <span style={{ flex: 1, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pf.error ? "❌" : "📎"} {pf.file.name}
                    {pf.error && <span style={{ color: "var(--color-danger)", marginLeft: "0.5rem", fontSize: "0.78rem" }}>{pf.error}</span>}
                  </span>
                  <button type="button" className="zen-remove-btn" onClick={() => handleRemoveFile(pf.id)} title="Remove file">✕</button>
                </div>
              ))}
            </div>
          )}

          {canAddMore && (
            <>
              <input
                ref={fileInputRef}
                id="ticket-attachments"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                style={{ display: "none" }}
                onChange={handleFileAdd}
              />
              <button
                type="button"
                id="btn-add-attachment"
                className="zen-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📂 Add Files ({activeFiles.length}/{MAX_FILES})
              </button>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button type="button" id="btn-cancel-ticket" className="zen-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            id="btn-submit-ticket"
            type="submit"
            className="btn-zen-primary"
            disabled={isSubmitting}
            style={{ minWidth: 160 }}
          >
            {isSubmitting ? "Creating…" : "🎫 Create Ticket"}
          </button>
        </div>
      </div>
    </form>
  );
}
