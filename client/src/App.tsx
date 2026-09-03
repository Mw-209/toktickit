import { useState, useEffect } from "react";
import { useRequester } from "./context/RequesterContext.js";
import RequesterSelector from "./components/RequesterSelector.js";
import Navbar from "./components/Navbar.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import { Category, RelatedSystem, fetchCategories, fetchRelatedSystems } from "./api.js";

type Page = "my-tickets" | "create-ticket";

export default function App() {
  const { selectedRequester } = useRequester();
  const [currentPage, setCurrentPage] = useState<Page>("my-tickets");
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchRelatedSystems().then(setRelatedSystems).catch(() => {});
  }, []);

  // AC-02: Guard — redirect to selector if no requester is selected
  if (!selectedRequester) {
    return <RequesterSelector />;
  }

  const handleTicketCreated = (ticketNumber: string) => {
    setSuccessMsg(`Ticket ${ticketNumber} created successfully!`);
    setCurrentPage("my-tickets");
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)" }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="zen-container" style={{ paddingTop: "1.5rem" }}>
        {successMsg && (
          <div className="zen-alert-success" style={{ marginBottom: "1.25rem" }}>
            ✅ {successMsg}
          </div>
        )}

        {currentPage === "my-tickets" && (
          <div className="zen-card">
            <h2 style={{ marginTop: 0 }}>📋 My Tickets</h2>
            <p style={{ color: "var(--color-text-muted)" }}>
              Viewing tickets for: <strong>{selectedRequester.name}</strong>
            </p>
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎫</div>
              <p style={{ fontWeight: 500 }}>My Tickets dashboard will appear here (Issue 4)</p>
              <button
                id="btn-create-first-ticket"
                className="btn-zen-primary"
                style={{ marginTop: "1rem" }}
                onClick={() => setCurrentPage("create-ticket")}
              >
                ✏️ Create Your First Ticket
              </button>
            </div>
          </div>
        )}

        {currentPage === "create-ticket" && (
          <CreateTicketForm
            categories={categories}
            relatedSystems={relatedSystems}
            onSuccess={handleTicketCreated}
            onCancel={() => setCurrentPage("my-tickets")}
          />
        )}
      </div>
    </div>
  );
}
