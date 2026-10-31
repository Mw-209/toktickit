import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { fetchStaffDashboard, StaffDashboardData, Ticket } from "../api.js";

interface StaffDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export default function StaffDashboard({ onNavigate }: StaffDashboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR")) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchStaffDashboard()
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
  }, [user]);

  // Check role permission
  if (!user || (user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR")) {
    return (
      <div className="zen-container" style={{ paddingTop: "2rem" }}>
        <div className="zen-alert zen-alert-danger" data-testid="forbidden-message">
          <h3>403 — Access Denied</h3>
          <p>You do not have permission to view the IT Staff Dashboard. IT Staff or Administrator role required.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="zen-container" data-testid="loading-state" style={{ paddingTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", color: "var(--color-primary-green)" }}>📊 IT Staff Dashboard</h1>
            <p className="zen-meta" style={{ margin: "0.25rem 0 0 0" }}>Overview of service desk operations and workloads.</p>
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

  const unassigned = data?.unassignedCount ?? data?.unassignedTickets ?? 0;
  const myTickets = data?.myTicketsCount ?? data?.myTickets ?? 0;
  const recentlyUpdated = data?.recentlyUpdated ?? 0;
  const statusMap = data?.ticketsByStatus || {};

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "NEW":
      case "OPEN": return "zen-badge-new";
      case "IN_PROGRESS": return "zen-badge-inprogress";
      case "WAITING_FOR_REQUESTER":
      case "PENDING": return "zen-badge-pending";
      case "RESOLVED": return "zen-badge-resolved";
      default: return "zen-badge-closed";
    }
  };

  return (
    <div className="zen-container" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", color: "var(--color-primary-green)" }}>📊 IT Staff Dashboard</h1>
          <p className="zen-meta" style={{ margin: "0.25rem 0 0 0" }}>Operational overview and workload metrics.</p>
        </div>
        <button
          className="btn-zen-primary"
          onClick={() => onNavigate("staff-queue")}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span>🧑‍💻</span> Go to Ticket Queue
        </button>
      </div>

      {error && (
        <div className="zen-alert zen-alert-danger" style={{ marginBottom: "1.5rem" }}>
          <span>{error}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        
        {/* Card 1: Unassigned Tickets */}
        <div
          className="zen-card"
          data-testid="metric-unassigned"
          onClick={() => onNavigate("staff-queue", { filter: "unassigned" })}
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", borderLeft: "4px solid var(--color-danger, #ef4444)" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>UNASSIGNED TICKETS</span>
            <span style={{ fontSize: "1.25rem" }}>📥</span>
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0.25rem 0", color: unassigned > 0 ? "var(--color-danger, #ef4444)" : "var(--color-text-main)" }}>
            {unassigned}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary-green)" }}>
            Click to view unassigned →
          </span>
        </div>

        {/* Card 2: My Tickets */}
        <div
          className="zen-card"
          data-testid="metric-mytickets"
          onClick={() => onNavigate("staff-queue", { filter: "my-tickets" })}
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", borderLeft: "4px solid var(--color-primary-green)" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>MY TICKETS</span>
            <span style={{ fontSize: "1.25rem" }}>📋</span>
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0.25rem 0", color: "var(--color-primary-green)" }}>
            {myTickets}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary-green)" }}>
            Click to view assigned to me →
          </span>
        </div>

        {/* Card 3: Tickets by Status */}
        <div
          className="zen-card"
          data-testid="metric-by-status"
          style={{ borderLeft: "4px solid #3b82f6" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>TICKETS BY STATUS</span>
            <span style={{ fontSize: "1.25rem" }}>📈</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {Object.entries({
              New: statusMap.New || statusMap.NEW || 0,
              Open: statusMap.Open || statusMap.OPEN || 0,
              InProgress: statusMap.InProgress || statusMap.IN_PROGRESS || 0,
              Waiting: statusMap.WaitingForRequester || statusMap.WAITING_FOR_REQUESTER || 0,
              Resolved: statusMap.Resolved || statusMap.RESOLVED || 0,
            }).map(([label, count]) => (
              <span
                key={label}
                className={`zen-badge ${getStatusClass(label)}`}
                onClick={() => onNavigate("staff-queue", { status: label === "InProgress" ? "IN_PROGRESS" : label === "Waiting" ? "WAITING_FOR_REQUESTER" : label.toUpperCase() })}
                style={{ cursor: "pointer", fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
              >
                {label}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: Recently Updated */}
        <div
          className="zen-card"
          data-testid="metric-recently-updated"
          onClick={() => onNavigate("staff-queue", { sortBy: "updatedAt", sortOrder: "desc" })}
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", borderLeft: "4px solid #f59e0b" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>RECENTLY UPDATED (7D)</span>
            <span style={{ fontSize: "1.25rem" }}>⏱️</span>
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0.5rem 0 0.25rem 0", color: "#d97706" }}>
            {recentlyUpdated}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary-green)" }}>
            Click to view latest activity →
          </span>
        </div>

      </div>

      {/* Bottom Section: Recently Updated Tickets */}
      <div className="zen-card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>⏱️ Recently Updated Tickets</h3>
          <button
            className="btn-zen-secondary"
            onClick={() => onNavigate("staff-queue")}
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
          >
            View All in Queue
          </button>
        </div>

        {data?.recentTickets && data.recentTickets.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="zen-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Ticket No.</th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTickets.map((t: Ticket) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-primary-green)" }}>{t.ticketNumber}</td>
                    <td>{t.summary}</td>
                    <td>{t.category?.name || "—"}</td>
                    <td>
                      <span className={`zen-badge ${getStatusClass(t.currentStatus)}`}>
                        {t.currentStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td>{t.assignedTo?.name || "Unassigned"}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      {new Date(t.updatedAt).toLocaleDateString("th-TH")}
                    </td>
                    <td>
                      <button
                        className="btn-zen-secondary"
                        onClick={() => onNavigate("staff-ticket-detail", { ticketId: t.id })}
                        style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="zen-meta" style={{ textAlign: "center", margin: "1.5rem 0" }}>
            No tickets updated recently.
          </p>
        )}
      </div>

      {/* My Recent Actions Taken */}
      {data?.myRecentActions && data.myRecentActions.length > 0 && (
        <div className="zen-card">
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>🛠️ My Recent Actions Taken</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.myRecentActions.map((action, idx) => (
              <div
                key={action.actionId || idx}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "#F9FAFB",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-primary-green)" }}>
                    {action.ticketTitle || action.ticketNumber || `Ticket #${action.ticketId}`}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-main)", marginTop: "0.25rem" }}>
                    {action.actionDescription}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {new Date(action.actionDateTime).toLocaleString("th-TH")}
                  </span>
                  <button
                    className="btn-zen-secondary"
                    onClick={() => onNavigate("staff-ticket-detail", { ticketId: action.ticketId })}
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                  >
                    View Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
