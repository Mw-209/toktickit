import { useState } from "react";
import { useRequester } from "./context/RequesterContext.js";
import RequesterSelector from "./components/RequesterSelector.js";
import Navbar from "./components/Navbar.js";

type Page = "my-tickets" | "create-ticket";

export default function App() {
  const { selectedRequester } = useRequester();
  const [currentPage, setCurrentPage] = useState<Page>("my-tickets");

  // AC-02: Guard — redirect to selector if no requester is selected
  if (!selectedRequester) {
    return <RequesterSelector />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)" }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="zen-container">
        {currentPage === "my-tickets" && (
          <div className="zen-card">
            <h2 style={{ marginTop: 0 }}>📋 My Tickets</h2>
            <p style={{ color: "var(--color-text-muted)" }}>
              Viewing tickets for: <strong>{selectedRequester.name}</strong>
            </p>
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎫</div>
              <p style={{ fontWeight: 500 }}>My Tickets dashboard will appear here (Issue 4)</p>
            </div>
          </div>
        )}
        {currentPage === "create-ticket" && (
          <div className="zen-card">
            <h2 style={{ marginTop: 0 }}>✏️ Create Ticket</h2>
            <p style={{ color: "var(--color-text-muted)" }}>
              Creating ticket as: <strong>{selectedRequester.name}</strong>
            </p>
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📝</div>
              <p style={{ fontWeight: 500 }}>Create Ticket form will appear here (Issue 3)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
