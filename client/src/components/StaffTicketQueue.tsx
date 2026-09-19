import { useState, useEffect } from "react";
import {
  fetchStaffTickets,
  fetchStaffAssignees,
  fetchCategories,
  Ticket,
  Category,
  StaffAssignee,
} from "../api";

// Helper function to format date
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${hours}:${minutes}`;
};

interface Props {
  onNavigate: (page: string, params?: any) => void;
}

export function StaffTicketQueue({ onNavigate }: Props) {
  // Filters State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [itPriority, setItPriority] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  // Sort & Pagination State
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Meta Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);

  // Load Meta Data
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catData, assignData] = await Promise.all([
          fetchCategories(),
          fetchStaffAssignees(),
        ]);
        setCategories(catData);
        setAssignees(assignData.assignees || []);
      } catch (err: any) {
        console.error("Failed to load metadata", err);
      }
    }
    loadMeta();
  }, []);

  // Load Tickets
  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      setError(null);
      try {
        const filters: any = { page, pageSize, sortBy, sortOrder };
        if (search) filters.search = search;
        if (status) filters.status = status;
        if (itPriority) filters.itPriority = itPriority;
        if (categoryId) filters.categoryId = parseInt(categoryId, 10);
        if (assignedToId) {
          filters.assignedToId =
            assignedToId === "unassigned" ? 0 : parseInt(assignedToId, 10);
        }

        const res = await fetchStaffTickets(filters);
        setTickets(res.tickets);
        setTotal(res.pagination.total);
      } catch (err: any) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [
    search,
    status,
    itPriority,
    categoryId,
    assignedToId,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ]);

  // Sort Handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="sort-icon inactive">↕</span>;
    return <span className="sort-icon active">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const getPriorityClass = (priority: string | null) => {
    if (!priority) return "zen-badge-low";
    switch (priority) {
      case "URGENT": return "zen-badge-urgent";
      case "HIGH": return "zen-badge-high";
      case "MEDIUM": return "zen-badge-medium";
      case "LOW":
      default: return "zen-badge-low";
    }
  };

  const getStatusClass = (status: string) => {
    const s = status.toUpperCase();
    if (s === "IN_PROGRESS") return "zen-badge-inprogress";
    return `zen-badge-${s.toLowerCase().replace(/_/g, '')}`;
  };

  const getStatusLabel = (status: string) => {
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "WAITING_FOR_REQUESTER") return "Waiting for Requester";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="zen-container" style={{ maxWidth: "1200px" }}>
      <header className="zen-header-bar">
        <h2>IT Staff Ticket Queue</h2>
      </header>

      {/* Toolbar */}
      <div className="zen-card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            className="zen-input"
            placeholder="Search ticket number or summary…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ minWidth: "250px", flex: 1 }}
          />

          <select
            className="zen-input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto" }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="WAITING_FOR_REQUESTER">WAITING_FOR_REQUESTER</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REOPENED">REOPENED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            className="zen-input"
            value={itPriority}
            onChange={(e) => {
              setItPriority(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto" }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          <select
            className="zen-input"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="zen-input"
            value={assignedToId}
            onChange={(e) => {
              setAssignedToId(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto" }}
          >
            <option value="">All Owners</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="zen-alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* Data Display */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p className="zen-meta">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍃</div>
          <h3>No tickets found</h3>
          <p className="zen-meta">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="zen-table-desktop zen-card">
            <table className="zen-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("ticketNumber")} style={{ cursor: "pointer" }}>
                    Ticket No. <SortIcon field="ticketNumber" />
                  </th>
                  <th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer" }}>
                    Created <SortIcon field="createdAt" />
                  </th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Req. Priority</th>
                  <th onClick={() => handleSort("itPriority")} style={{ cursor: "pointer" }}>
                    IT Priority <SortIcon field="itPriority" />
                  </th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th onClick={() => handleSort("updatedAt")} style={{ cursor: "pointer" }}>
                    Last Updated <SortIcon field="updatedAt" />
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.ticketNumber}</strong></td>
                    <td className="zen-meta">{formatDate(t.createdAt)}</td>
                    <td>
                      <div style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.summary}>
                        {t.summary}
                      </div>
                    </td>
                    <td>{t.category?.name}</td>
                    <td><span className={`zen-badge ${getPriorityClass(t.requestedPriority)}`}>{t.requestedPriority}</span></td>
                    <td><span className={`zen-badge ${getPriorityClass(t.itPriority)}`}>{t.itPriority || "-"}</span></td>
                    <td><span className={`zen-badge ${getStatusClass(t.currentStatus)}`}>{getStatusLabel(t.currentStatus)}</span></td>
                    <td>{t.assignedTo?.name || <span className="zen-meta">Unassigned</span>}</td>
                    <td className="zen-meta">{formatDate(t.updatedAt)}</td>
                    <td>
                      <button 
                        className="zen-btn-secondary" 
                        onClick={() => onNavigate("staff-ticket-detail", { ticketId: t.id })}
                        style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="zen-mobile-cards">
            {tickets.map((t) => (
              <div key={t.id} className="zen-mobile-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong>{t.ticketNumber}</strong>
                  <span className={`zen-badge ${getStatusClass(t.currentStatus)}`}>{getStatusLabel(t.currentStatus)}</span>
                </div>
                <div style={{ marginBottom: "0.75rem", fontWeight: 500 }}>{t.summary}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.85rem" }}>
                  <span>IT Priority: <span className={`zen-badge ${getPriorityClass(t.itPriority)}`}>{t.itPriority || "-"}</span></span>
                  <span>Owner: {t.assignedTo?.name || "Unassigned"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="zen-meta" style={{ fontSize: "0.8rem" }}>{formatDate(t.updatedAt)}</span>
                  <button 
                    className="zen-btn-secondary" 
                    onClick={() => onNavigate("staff-ticket-detail", { ticketId: t.id })}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="zen-card" style={{ marginTop: "1rem", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div className="zen-meta">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} tickets
            </div>
            
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="zen-meta">Items per page:</span>
                <select className="zen-input" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ padding: "0.25rem 0.5rem", width: "auto" }}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  className="zen-btn-secondary" 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)}
                  style={{ padding: "0.4rem 0.8rem" }}
                >
                  Previous
                </button>
                <button 
                  className="zen-btn-secondary" 
                  disabled={page * pageSize >= total} 
                  onClick={() => setPage(page + 1)}
                  style={{ padding: "0.4rem 0.8rem" }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Added some basic inline styling for table sorting icons just to ensure they render nicely */}
      <style>{`
        .sort-icon { display: inline-block; margin-left: 4px; font-size: 0.8em; }
        .sort-icon.inactive { color: #CBD5E1; }
        .sort-icon.active { color: #006B3C; font-weight: bold; }
      `}</style>
    </div>
  );
}
