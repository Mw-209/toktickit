import { useAuth } from "../context/AuthContext.js";

interface NavbarProps {
  currentPage: "my-tickets" | "create-ticket" | "staff-queue" | "admin-users" | "other";
  onNavigate: (page: "my-tickets" | "create-ticket" | "staff-queue" | "admin-users") => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="zen-header">
      <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🎫</span>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>TokTickIT</span>
          <span style={{ opacity: 0.6, fontSize: "0.85rem", marginLeft: "0.25rem" }}>IT Service Desk</span>
        </div>

        {/* Navigation Links */}
        {user && !user.mustChangePassword && (
          <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {(user.role === "REQUESTER" || user.role === "IT_STAFF") && (
              <button
                id="nav-my-tickets"
                className={`zen-nav-link ${currentPage === "my-tickets" ? "active" : ""}`}
                onClick={() => onNavigate("my-tickets")}
              >
                📋 My Tickets
              </button>
            )}
            {user.role === "REQUESTER" && (
              <button
                id="nav-create-ticket"
                className={`zen-nav-link ${currentPage === "create-ticket" ? "active" : ""}`}
                onClick={() => onNavigate("create-ticket")}
              >
                ✏️ Create Ticket
              </button>
            )}
            {user.role === "IT_STAFF" && (
              <button
                id="nav-staff-queue"
                className={`zen-nav-link ${currentPage === "staff-queue" ? "active" : ""}`}
                onClick={() => onNavigate("staff-queue")}
              >
                🧑‍💻 Ticket Queue
              </button>
            )}
            {user.role === "ADMINISTRATOR" && (
              <button
                id="nav-admin-users"
                className={`zen-nav-link ${currentPage === "admin-users" ? "active" : ""}`}
                onClick={() => onNavigate("admin-users")}
              >
                ⚙️ User Management
              </button>
            )}
          </nav>
        )}

        {/* User Profile Pill */}
        {user && (
          <div className="zen-profile-pill" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.6rem", background: "white", border: "1px solid var(--color-surface-border)", borderRadius: "2rem" }}>
            <span>👤</span>
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{user.name}</span>
            
            <span style={{ 
              fontSize: "0.7rem", 
              fontWeight: 700, 
              padding: "0.1rem 0.4rem", 
              borderRadius: "1rem",
              background: user.role === "REQUESTER" ? "#EFF6FF" : user.role === "IT_STAFF" ? "#FDF4FF" : "#FFF7ED",
              color: user.role === "REQUESTER" ? "#1D4ED8" : user.role === "IT_STAFF" ? "#7E22CE" : "#C2410C"
            }}>
              {user.role}
            </span>

            <button
              id="btn-logout"
              className="zen-change-btn"
              onClick={logout}
              title="Logout"
              style={{ marginLeft: "0.25rem", color: "var(--color-error)", cursor: "pointer", background: "none", border: "none", fontSize: "0.8rem", fontWeight: 600 }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
