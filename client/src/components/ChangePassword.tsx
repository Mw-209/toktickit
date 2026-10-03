import { useState } from "react";
import { changePassword } from "../api.js";
import { useAuth } from "../context/AuthContext.js";

export default function ChangePassword() {
  const { refreshUser } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsBusy(true);
    try {
      await changePassword(newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => {
        refreshUser(); // This will clear mustChangePassword and unblock the app
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
      setIsBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg-page)",
      padding: "1rem"
    }}>
      <div className="zen-card" style={{ maxWidth: "440px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ color: "var(--color-primary)", margin: "0 0 0.5rem 0" }}>Set Your New Password</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "0.9rem" }}>
            You must change your password before continuing.
          </p>
        </div>

        {success ? (
          <div className="zen-alert-success" style={{ textAlign: "center" }}>
            Password changed successfully! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="zen-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                minLength={8}
                required
                className="zen-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div>
              <label className="zen-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="zen-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isBusy}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-zen-primary" 
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={isBusy}
            >
              {isBusy ? "Saving..." : "Save New Password"}
            </button>
          </form>
        )}

        {error && (
          <div className="zen-alert-error" style={{ marginTop: "1.5rem" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
