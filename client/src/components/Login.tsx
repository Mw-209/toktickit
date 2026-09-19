import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Invalid credentials or inactive account");
    } finally {
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
          <h1 style={{ color: "var(--color-primary)", margin: "0 0 0.5rem 0" }}>TokTickIT</h1>
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>IT Support Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label className="zen-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="zen-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isBusy}
            />
          </div>
          <div>
            <label className="zen-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="zen-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isBusy}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-zen-primary" 
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={isBusy}
          >
            {isBusy ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && (
          <div className="zen-alert-error" style={{ marginTop: "1.5rem" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
