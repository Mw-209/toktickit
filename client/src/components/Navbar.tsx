import { useRequester } from "../context/RequesterContext.js";

interface NavbarProps {
  currentPage: "my-tickets" | "create-ticket" | "other";
  onNavigate: (page: "my-tickets" | "create-ticket") => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { selectedRequester, clearRequester } = useRequester();

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
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            id="nav-my-tickets"
            className={`zen-nav-link ${currentPage === "my-tickets" ? "active" : ""}`}
            onClick={() => onNavigate("my-tickets")}
          >
            📋 My Tickets
          </button>
          <button
            id="nav-create-ticket"
            className={`zen-nav-link ${currentPage === "create-ticket" ? "active" : ""}`}
            onClick={() => onNavigate("create-ticket")}
          >
            ✏️ Create Ticket
          </button>
        </nav>

        {/* Requester Profile Pill */}
        {selectedRequester && (
          <div className="zen-profile-pill">
            <span>👤</span>
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedRequester.name}</span>
            <button
              id="btn-change-requester"
              className="zen-change-btn"
              onClick={clearRequester}
              title="Switch Development Requester"
            >
              Switch
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
