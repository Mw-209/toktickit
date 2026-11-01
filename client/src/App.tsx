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
import StaffDashboard from "./components/StaffDashboard.js";
import RequesterDashboard from "./components/RequesterDashboard.js";
import { Category, RelatedSystem, fetchCategories, fetchRelatedSystems, checkSystem, SystemStatus } from "./api.js";

type Page = "my-tickets" | "create-ticket" | "ticket-detail" | "staff-queue" | "staff-ticket-detail" | "admin-users" | "staff-dashboard" | "requester-dashboard";

export default function App() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [requesterTicketsFilters, setRequesterTicketsFilters] = useState<any>(undefined);
  const [staffQueueFilters, setStaffQueueFilters] = useState<any>(undefined);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchRelatedSystems().then(setRelatedSystems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setCurrentPage("my-tickets");
      setSelectedTicketId(null);
      return;
    }
    if (user.role === "REQUESTER") {
      if (
        currentPage === "staff-queue" ||
        currentPage === "staff-dashboard" ||
        currentPage === "staff-ticket-detail" ||
        currentPage === "admin-users"
      ) {
        setCurrentPage("requester-dashboard");
      } else if (
        currentPage !== "ticket-detail" &&
        currentPage !== "create-ticket" &&
        currentPage !== "my-tickets"
      ) {
        setCurrentPage("requester-dashboard");
      }
    } else if (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") {
      if (
        currentPage === "requester-dashboard" ||
        currentPage === "my-tickets" ||
        currentPage === "create-ticket"
      ) {
        setCurrentPage("staff-dashboard");
      } else if (currentPage === "ticket-detail") {
        setCurrentPage(selectedTicketId ? "staff-ticket-detail" : "staff-queue");
      } else if (
        currentPage !== "staff-queue" &&
        currentPage !== "staff-ticket-detail" &&
        currentPage !== "admin-users"
      ) {
        setCurrentPage("staff-dashboard");
      }
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
    if (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") {
      setCurrentPage("staff-ticket-detail");
    } else {
      setCurrentPage("ticket-detail");
    }
  };

  const handleNavigate = (page: Page) => {
    if (page === "my-tickets") setRequesterTicketsFilters(undefined);
    if (page === "staff-queue") setStaffQueueFilters(undefined);
    setCurrentPage(page);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)" }}>
      <Navbar currentPage={currentPage === "ticket-detail" || currentPage === "staff-ticket-detail" ? "other" : currentPage} onNavigate={handleNavigate} />
      <div className="zen-container" style={{ paddingTop: "1.5rem" }}>

        {successMsg && (
          <div className="zen-alert-success" style={{ marginBottom: "1.25rem" }}>
            {successMsg}
          </div>
        )}

        {/* Dashboards (Issue 5) */}
        {currentPage === "staff-dashboard" && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") && (
          <StaffDashboard
            onNavigate={(page, params) => {
              if (page === "staff-ticket-detail" && params?.ticketId) {
                setSelectedTicketId(params.ticketId);
                setCurrentPage("staff-ticket-detail");
              } else if (page === "staff-queue") {
                setStaffQueueFilters(params);
                setCurrentPage("staff-queue");
              } else {
                setCurrentPage(page as Page);
              }
            }}
          />
        )}

        {currentPage === "requester-dashboard" && user.role === "REQUESTER" && (
          <RequesterDashboard
            onNavigate={(page, params) => {
              if (page === "ticket-detail" && (params?.ticketId || params?.id)) {
                setSelectedTicketId(params.ticketId || params.id);
                setCurrentPage("ticket-detail");
              } else if (page === "my-tickets") {
                setRequesterTicketsFilters(params);
                setCurrentPage("my-tickets");
              } else {
                setCurrentPage(page as Page);
              }
            }}
          />
        )}

        {currentPage === "my-tickets" && user.role === "REQUESTER" && (
          <MyTicketsDashboard
            onViewTicket={handleViewTicket}
            onCreateTicket={() => setCurrentPage("create-ticket")}
            refreshKey={dashboardRefreshKey}
            initialFilters={requesterTicketsFilters}
          />
        )}

        {currentPage === "create-ticket" && user.role === "REQUESTER" && (
          <CreateTicketForm
            categories={categories}
            relatedSystems={relatedSystems}
            onSuccess={handleTicketCreated}
            onCancel={() => setCurrentPage("my-tickets")}
          />
        )}

        {currentPage === "staff-queue" && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") && (
          <StaffTicketQueue
            initialFilters={staffQueueFilters}
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

        {currentPage === "staff-ticket-detail" && selectedTicketId && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") && (
          <StaffTicketDetail
            ticketId={selectedTicketId}
            onBack={() => setCurrentPage("staff-queue")}
          />
        )}

        {currentPage === "ticket-detail" && user.role === "REQUESTER" && (
          selectedTicketId ? (
            <TicketDetailView 
              ticketId={selectedTicketId} 
              onBack={() => setCurrentPage("my-tickets")} 
            />
          ) : (
            <div className="zen-alert zen-alert-danger" style={{ margin: "2rem auto", maxWidth: "600px", textAlign: "center" }}>
              <p style={{ margin: "0 0 1rem 0" }}>No ticket selected.</p>
              <button className="btn-zen-secondary" onClick={() => setCurrentPage("my-tickets")}>
                Return to Tickets
              </button>
            </div>
          )
        )}

        {currentPage === "admin-users" && user.role === "ADMINISTRATOR" && (
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
