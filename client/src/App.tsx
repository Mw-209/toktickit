import { useState, useEffect } from "react";
import { useRequester } from "./context/RequesterContext.js";
import RequesterSelector from "./components/RequesterSelector.js";
import Navbar from "./components/Navbar.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsDashboard from "./components/MyTicketsDashboard.js";
import TicketDetailView from "./components/TicketDetailView.js";
import { Category, RelatedSystem, fetchCategories, fetchRelatedSystems, checkSystem, SystemStatus } from "./api.js";

type Page = "my-tickets" | "create-ticket" | "ticket-detail";

export default function App() {
  const { selectedRequester } = useRequester();
  const [currentPage, setCurrentPage] = useState<Page>("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchRelatedSystems().then(setRelatedSystems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRequester) {
      setCurrentPage("my-tickets");
      setSelectedTicketId(null);
    }
  }, [selectedRequester]);

  // AC-02: Guard — redirect to selector if no requester is selected
  if (!selectedRequester) {
    return (
      <>
        <RequesterSelector />
        <Lab1SystemCheck />
      </>
    );
  }

  const handleTicketCreated = (ticketNumber: string) => {
    setSuccessMsg(`✅ Ticket ${ticketNumber} created successfully!`);
    setCurrentPage("my-tickets");
    setDashboardRefreshKey((k) => k + 1);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleViewTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setCurrentPage("ticket-detail");
  };

  const handleNavigate = (page: "my-tickets" | "create-ticket") => {
    setCurrentPage(page);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)" }}>
      <Navbar currentPage={currentPage === "ticket-detail" ? "other" : currentPage} onNavigate={handleNavigate} />
      <div className="zen-container" style={{ paddingTop: "1.5rem" }}>

        {successMsg && (
          <div className="zen-alert-success" style={{ marginBottom: "1.25rem" }}>
            {successMsg}
          </div>
        )}

        {currentPage === "my-tickets" && (
          <MyTicketsDashboard
            onViewTicket={handleViewTicket}
            onCreateTicket={() => setCurrentPage("create-ticket")}
            refreshKey={dashboardRefreshKey}
          />
        )}

        {currentPage === "create-ticket" && (
          <CreateTicketForm
            categories={categories}
            relatedSystems={relatedSystems}
            onSuccess={handleTicketCreated}
            onCancel={() => setCurrentPage("my-tickets")}
          />
        )}

        {currentPage === "ticket-detail" && selectedTicketId && (
          <TicketDetailView 
            ticketId={selectedTicketId} 
            onBack={() => setCurrentPage("my-tickets")} 
          />
        )}

      </div>
      <Lab1SystemCheck />
    </div>
  );
}

// Added for Lab 1 Regression Testing (Do not remove)
function Lab1SystemCheck() {
  const [sysStatus, setSysStatus] = useState<SystemStatus | "error" | null>(null);

  const handleCheckSystem = async () => {
    try {
      const st = await checkSystem();
      setSysStatus(st);
    } catch (err) {
      setSysStatus("error");
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, background: "white", padding: "10px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", border: "1px solid var(--color-surface-border)" }}>
      <button onClick={handleCheckSystem} className="btn-zen-secondary" style={{ fontSize: "0.8rem", padding: "4px 8px" }}>
        Check System
      </button>
      {sysStatus === "error" && (
        <div style={{ marginTop: "10px", fontSize: "0.8rem" }}>
          <p style={{ margin: 0 }}>❌ Offline</p>
          <p style={{ margin: 0 }}>Unable to connect to TokTickIT API</p>
        </div>
      )}
      {sysStatus && sysStatus !== "error" && (
        <div style={{ marginTop: "10px", fontSize: "0.8rem" }}>
          <p style={{ margin: 0 }}>✅ Online</p>
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {sysStatus.categories.map(c => <li key={c.id}>• {c.name}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
