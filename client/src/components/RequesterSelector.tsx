import { useState } from "react";
import { useRequester } from "../context/RequesterContext.js";
import { RequesterUser } from "../api.js";

export default function RequesterSelector() {
  const { requesters, isLoading, error, selectRequester } = useRequester();
  const [selected, setSelected] = useState<string>("");

  const handleContinue = () => {
    const requester = requesters.find((r) => String(r.id) === selected);
    if (requester) selectRequester(requester);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-page)" }}>
      <div className="zen-card" style={{ maxWidth: 520, width: "100%", padding: "2.5rem" }}>
        {/* Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 60, height: 60, background: "var(--color-primary-green)", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#fff", fontSize: "1.5rem" }}>🎫</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>TokTickIT</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>IT Service Desk</p>
        </div>

        {/* Warning Banner — BR-03 */}
        <div className="zen-alert-warning" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
          <span>⚠️</span>
          <div>
            <strong>Development Testing Mechanism</strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
              This is a Lab 2 testing simulator — not a real login screen. Select a Requester identity to test the ticketing system. Real authentication is introduced in Lab 3.
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Select Development Requester</h2>

        {error && (
          <div className="zen-alert-warning" style={{ marginBottom: "1rem" }}>❌ {error}</div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)" }}>
            <span>Loading requesters…</span>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="requester-select" className="zen-form-label">
                Select Your Identity <span className="zen-required">*</span>
              </label>
              <select
                id="requester-select"
                className="zen-select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">— Choose a Requester —</option>
                {requesters.map((r: RequesterUser) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-continue-requester"
              className="btn-zen-primary"
              style={{ width: "100%", padding: "0.65rem", fontSize: "1rem" }}
              onClick={handleContinue}
              disabled={!selected}
            >
              Continue as Selected Requester →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
