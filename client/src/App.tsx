import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext.js";
import Login from "./components/Login.js";
import ChangePassword from "./components/ChangePassword.js";
import Navbar from "./components/Navbar.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsDashboard from "./components/MyTicketsDashboard.js";
import TicketDetailView from "./components/TicketDetailView.js";
import { StaffTicketQueue } from "./components/StaffTicketQueue.js";
import StaffTicketDetail from "./components/StaffTicketDetail.js";
import { AdminUserManagement } from "./components/AdminUserManagement.js";
import { Category, RelatedSystem, fetchCategories, fetchRelatedSystems, checkSystem, SystemStatus } from "./api.js";

type Page = "my-tickets" | "create-ticket" | "ticket-detail" | "staff-queue" | "staff-ticket-detail" | "admin-users";

export default function App() {
  const { user, isLoading } = useAuth();
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
    if (user && currentPage !== "ticket-detail") {
      if (user.role === "REQUESTER") setCurrentPage("my-tickets");
      else if (user.role === "IT_STAFF") setCurrentPage("staff-queue");
      else if (user.role === "ADMINISTRATOR") setCurrentPage("admin-users");
    }
  }, [user]);

  if (isLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-page)" }}>Loading...</div>;
  }

  // AC-02: Guard — redirect to Login if not authenticated
  if (!user) {
    return (
      <>
        <Login />
        <Lab1SystemCheck />
      </>
    );
  }

  // BR-08: Force password change
  if (user.mustChangePassword) {
    return (
      <>
        <ChangePassword />
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

  const handleNavigate = (page: Page) => {
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

        {currentPage === "staff-queue" && (
          <StaffTicketQueue
            onNavigate={(page, params) => {
              if (page === "staff-ticket-detail" && params?.ticketId) {
                setSelectedTicketId(params.ticketId);
                setCurrentPage("staff-ticket-detail");
              } else {
                setCurrentPage(page as Page);
              }
            }}
          />
        )}

        {currentPage === "staff-ticket-detail" && selectedTicketId && (
          <StaffTicketDetail
            ticketId={selectedTicketId}
            onBack={() => setCurrentPage("staff-queue")}
          />
        )}

        {currentPage === "ticket-detail" && selectedTicketId && (
          <TicketDetailView 
            ticketId={selectedTicketId} 
            onBack={() => setCurrentPage(user.role === "REQUESTER" ? "my-tickets" : "staff-queue")} 
          />
        )}


        {currentPage === "admin-users" && (
          <AdminUserManagement />
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
