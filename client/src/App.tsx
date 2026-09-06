import { useState, useEffect } from "react";
import { useRequester } from "./context/RequesterContext.js";
import RequesterSelector from "./components/RequesterSelector.js";
import Navbar from "./components/Navbar.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsDashboard from "./components/MyTicketsDashboard.js";
import TicketDetailView from "./components/TicketDetailView.js";
import { Category, RelatedSystem, fetchCategories, fetchRelatedSystems } from "./api.js";

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
    return <RequesterSelector />;
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
    </div>
  );
}
