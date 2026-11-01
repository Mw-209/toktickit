import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { fetchRequesterDashboard, RequesterDashboardData } from "../api.js";

interface RequesterDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export default function RequesterDashboard({ onNavigate }: RequesterDashboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = () => {
    if (!user || user.role !== "REQUESTER") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchRequesterDashboard()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load dashboard data");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  // Check role permission
  if (!user || user.role !== "REQUESTER") {
    return (
      <div className="zen-container" style={{ paddingTop: "2rem" }}>
        <div className="zen-alert zen-alert-danger" data-testid="forbidden-message">
          <h3>403 — Access Denied</h3>
          <p>You do not have permission to view the Requester Dashboard. Requester role required.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="zen-container" data-testid="loading-state" style={{ paddingTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 700, color: "var(--color-text-main, #1f2937)" }}>
              Welcome, {user?.name ? user.name.split(" ")[0] : "Requester"}!
            </h1>
            <p className="zen-meta" style={{ margin: "0.25rem 0 0 0", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              Here's the latest on your requests.
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="zen-card" style={{ height: "130px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="zen-loading-spinner" style={{ width: 24, height: 24 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalOpen = data?.totalOpen ?? data?.totalOpenTickets ?? 0;
  const waitingForMe = data?.waitingForRequester ?? 0;
  const recentlyUpdated = data?.recentlyUpdated ?? 0;
  const recentlyResolved = data?.recentlyResolved ?? 0;

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "NEW":
      case "OPEN":
        return "zen-badge-new";
      case "IN_PROGRESS":
        return "zen-badge-inprogress";
      case "WAITING_FOR_REQUESTER":
        return "zen-badge-pending";
      case "RESOLVED":
        return "zen-badge-resolved";
      default:
        return "zen-badge-closed";
    }
  };

  return (
    <div className="zen-container" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 700, color: "var(--color-text-main, #1f2937)" }}>
            Welcome, {user.name ? user.name.split(" ")[0] : "Requester"}!
          </h1>
          <p className="zen-meta" style={{ margin: "0.25rem 0 0 0", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Here's the latest on your requests.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="btn-zen-secondary"
            onClick={loadDashboard}
            title="Refresh dashboard metrics"
          >
            🔄 Refresh
          </button>
          <button
            className="btn-zen-secondary"
            onClick={() => onNavigate("my-tickets")}
          >
            📋 View My Tickets
          </button>
          <button
            className="btn-zen-primary"
            onClick={() => onNavigate("create-ticket")}
          >
            ✏️ Create New Ticket
          </button>
        </div>
      </div>

      {error && !data && (
        <div
          className="zen-alert zen-alert-danger"
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "var(--radius-md)",
            border: "1px solid #fca5a5",
          }}
        >
          <span>{error}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        
        {/* Card 1: Total Open Tickets */}
        <div
          className="zen-card"
          data-testid="metric-total-open"
          onClick={() => onNavigate("my-tickets", { status: "OPEN" })}
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", borderLeft: "4px solid var(--color-primary-green)" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>TOTAL OPEN TICKETS</span>
            <span style={{ fontSize: "1.25rem" }}>🎫</span>
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0.25rem 0", color: "var(--color-primary-green)" }}>
            {totalOpen}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary-green)" }}>
            Click to view open tickets →
          </span>
        </div>

        {/* Card 2: Waiting for Me */}
        <div
          className="zen-card"
          data-testid="metric-waiting-me"
          onClick={() => onNavigate("my-tickets", { status: "WAITING_FOR_REQUESTER" })}
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", borderLeft: "4px solid #f59e0b" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>WAITING FOR ME</span>
            <span style={{ fontSize: "1.25rem" }}>⏳</span>
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0.25rem 0", color: waitingForMe > 0 ? "#d97706" : "var(--color-text-main)" }}>
            {waitingForMe}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary-green)" }}>
            Click to view tickets needing response →
          </span>
        </div>

        {/* Card 3: Recently Updated */}
        <div
          className="zen-card"
          data-testid="metric-recently-updated"
          onClick={() => onNavigate("my-tickets", { sortBy: "updatedAt", sortOrder: "desc" })}
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", borderLeft: "4px solid #3b82f6" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>RECENTLY UPDATED (7D)</span>
            <span style={{ fontSize: "1.25rem" }}>⏱️</span>
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0.25rem 0", color: "#2563eb" }}>
            {recentlyUpdated}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary-green)" }}>
            Click to view recently active →
          </span>
        </div>

        {/* Card 4: Recently Resolved */}
        <div
          className="zen-card"
          data-testid="metric-recently-resolved"
          onClick={() => onNavigate("my-tickets", { status: "RESOLVED" })}
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", borderLeft: "4px solid #10b981" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>RECENTLY RESOLVED (7D)</span>
            <span style={{ fontSize: "1.25rem" }}>✅</span>
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0.25rem 0", color: "#059669" }}>
            {recentlyResolved}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary-green)" }}>
            Click to view resolved tickets →
          </span>
        </div>

      </div>

      {/* Empty State Banner if no open tickets */}
      {totalOpen === 0 && (
        <div
          className="zen-card"
          data-testid="empty-open-state"
          style={{
            textAlign: "center",
            padding: "2.5rem 1.5rem",
            backgroundColor: "var(--color-pale-green)",
            border: "1px dashed var(--color-secondary-green)",
            marginBottom: "2rem",
          }}
        >
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🎉</span>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--color-primary-green)" }}>
            You have no open support tickets!
          </h3>
          <p className="zen-meta" style={{ margin: "0 0 1.25rem 0" }}>
            All your issues have been resolved or closed. If you need help with anything, feel free to open a new ticket.
          </p>
          <button
            className="btn-zen-primary"
            onClick={() => onNavigate("create-ticket")}
          >
            ✏️ Create New Ticket
          </button>
        </div>
      )}

      {/* Bottom Section: My Recent Tickets + Quick Actions */}
      <div className="zen-dashboard-grid">
        
        {/* Left Column: My Recent Tickets */}
        <div className="zen-card" style={{ padding: "1.25rem", minWidth: 0, maxWidth: "100%", boxSizing: "border-box", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-green)" }}>
              📋 My Recent Tickets
            </h3>
            <button
              className="btn-zen-secondary"
              style={{ fontSize: "0.85rem", padding: "0.25rem 0.6rem" }}
              onClick={() => onNavigate("my-tickets")}
            >
              View all →
            </button>
          </div>

          {(!data?.recentTickets || data.recentTickets.length === 0) ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              <p style={{ margin: 0 }}>No tickets recorded yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="zen-table-desktop" style={{ overflowX: "auto", width: "100%" }}>
                <table className="zen-table" style={{ width: "100%", fontSize: "0.875rem" }}>
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: "nowrap" }}>TICKET NO.</th>
                      <th>SUMMARY</th>
                      <th style={{ whiteSpace: "nowrap" }}>STATUS</th>
                      <th style={{ whiteSpace: "nowrap" }}>UPDATED</th>
                      <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTickets.map((t: any) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => onNavigate("ticket-detail", { ticketId: t.id, id: t.id })}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: "var(--color-primary-green)",
                              fontWeight: 600,
                              cursor: "pointer",
                              textDecoration: "underline",
                              fontFamily: "inherit",
                              fontSize: "inherit",
                            }}
                          >
                            {t.ticketNumber}
                          </button>
                        </td>
                        <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.summary}>
                          {t.summary}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span className={`zen-badge ${getStatusBadge(t.currentStatus)}`}>
                            {t.currentStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                          {new Date(t.updatedAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            className="btn-zen-secondary"
                            data-testid={`view-ticket-${t.ticketNumber}`}
                            style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem" }}
                            onClick={() => onNavigate("ticket-detail", { ticketId: t.id, id: t.id })}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (Section 8.7 responsive compliance) */}
              <div className="zen-mobile-cards">
                {data.recentTickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="zen-mobile-card" data-testid={`view-card-${t.ticketNumber}`}
                    style={{ cursor: "pointer", marginBottom: "0.6rem", padding: "0.85rem" }}
                    onClick={() => onNavigate("ticket-detail", { ticketId: t.id, id: t.id })}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--color-primary-green)", fontSize: "0.85rem", fontFamily: "monospace" }}>
                        {t.ticketNumber}
                      </span>
                      <span className={`zen-badge ${getStatusBadge(t.currentStatus)}`}>
                        {t.currentStatus}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.4rem", wordBreak: "break-word" }}>
                      {t.summary}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      <span>Updated: {new Date(t.updatedAt).toLocaleDateString()}</span>
                      <span style={{ color: "var(--color-primary-green)", fontWeight: 600, fontSize: "0.8rem" }}>View →</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Quick Actions */}
        <div className="zen-card" style={{ padding: "1.25rem", minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-green)" }}>
            ⚡ Quick Actions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div
              className="zen-card"
              style={{
                cursor: "pointer",
                padding: "1rem",
                border: "1px solid var(--color-border)",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
              onClick={() => onNavigate("create-ticket")}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary-green)";
                e.currentTarget.style.backgroundColor = "var(--color-pale-green)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ fontSize: "1.75rem", color: "var(--color-primary-green)" }}>➕</div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--color-primary-green)" }}>Create Ticket</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Submit a new request</div>
              </div>
            </div>

            <div
              className="zen-card"
              style={{
                cursor: "pointer",
                padding: "1rem",
                border: "1px solid var(--color-border)",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
              onClick={() => onNavigate("my-tickets")}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary-green)";
                e.currentTarget.style.backgroundColor = "var(--color-pale-green)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ fontSize: "1.75rem", color: "var(--color-primary-green)" }}>📋</div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--color-primary-green)" }}>View My Tickets</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Track existing requests</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

