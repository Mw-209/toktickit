import { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext.js";
import { Ticket, Category, TicketListResponse, fetchTickets, fetchCategories } from "../api.js";

const STATUS_OPTIONS = ["ALL", "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const PAGE_SIZE = 10;

interface MyTicketsDashboardProps {
  onViewTicket: (ticketId: number) => void;
  onCreateTicket: () => void;
  refreshKey?: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "zen-badge zen-badge-new",
    IN_PROGRESS: "zen-badge zen-badge-inprogress",
    RESOLVED: "zen-badge zen-badge-resolved",
    CLOSED: "zen-badge zen-badge-closed",
  };
  const label: Record<string, string> = {
    NEW: "New",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return <span className={map[status] ?? "zen-badge"}>{label[status] ?? status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: "zen-badge zen-badge-low",
    MEDIUM: "zen-badge zen-badge-medium",
    HIGH: "zen-badge zen-badge-high",
    URGENT: "zen-badge zen-badge-urgent",
  };
  return <span className={map[priority] ?? "zen-badge"}>{priority}</span>;
}

export default function MyTicketsDashboard({ onViewTicket, onCreateTicket, refreshKey }: MyTicketsDashboardProps) {
  const { selectedRequester } = useRequester();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const loadTickets = useCallback(async () => {
    if (!selectedRequester) return;
    setIsLoading(true);
    setError(null);
    try {
      const result: TicketListResponse = await fetchTickets(selectedRequester.id, {
        search: search || undefined,
        categoryId: filterCategory ? Number(filterCategory) : undefined,
        priority: filterPriority !== "ALL" ? filterPriority : undefined,
        status: filterStatus !== "ALL" ? filterStatus : undefined,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setTickets(result.items);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
    } catch {
      setError("Failed to load tickets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequester, search, filterCategory, filterPriority, filterStatus, currentPage, refreshKey]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setFilterCategory("");
    setFilterPriority("ALL");
    setFilterStatus("ALL");
    setCurrentPage(1);
  };

  const hasFilters = search || filterCategory || filterPriority !== "ALL" || filterStatus !== "ALL";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>📋 My Tickets</h2>
          <p style={{ margin: "0.2rem 0 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Viewing as <strong>{selectedRequester?.name}</strong>
            {totalItems > 0 && <span> · {totalItems} ticket{totalItems !== 1 ? "s" : ""}</span>}
          </p>
        </div>
        <button id="btn-goto-create-ticket" className="btn-zen-primary" onClick={onCreateTicket}>
          ✏️ Create Ticket
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="zen-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input
            id="search-tickets"
            className="zen-input"
            type="text"
            placeholder="Search by summary…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button id="btn-search" className="btn-zen-primary" onClick={handleSearch}>
            🔍 Search
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", alignItems: "end" }}>
          <div>
            <label className="zen-form-label" style={{ fontSize: "0.78rem" }}>Category</label>
            <select
              id="filter-category"
              className="zen-select"
              style={{ height: 36 }}
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="zen-form-label" style={{ fontSize: "0.78rem" }}>Priority</label>
            <select
              id="filter-priority"
              className="zen-select"
              style={{ height: 36 }}
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p === "ALL" ? "All Priorities" : p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="zen-form-label" style={{ fontSize: "0.78rem" }}>Status</label>
            <select
              id="filter-status"
              className="zen-select"
              style={{ height: 36 }}
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button id="btn-clear-filters" className="zen-btn-secondary" style={{ height: 36, whiteSpace: "nowrap" }} onClick={handleClearFilters}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Ticket List */}
      {error && <div className="zen-alert-warning" style={{ marginBottom: "1rem" }}>❌ {error}</div>}

      {isLoading ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⏳</div>
          <p>Loading tickets…</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎫</div>
          <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>
            {hasFilters ? "No tickets match your filters." : "You have no tickets yet."}
          </p>
          {!hasFilters && (
            <button className="btn-zen-primary" onClick={onCreateTicket}>
              ✏️ Create Your First Ticket
            </button>
          )}
          {hasFilters && (
            <button className="zen-btn-secondary" onClick={handleClearFilters}>Clear Filters</button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="zen-card zen-table-desktop" style={{ padding: 0, overflow: "hidden" }}>
            <div className="zen-table-responsive">
              <table className="zen-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Summary</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} onClick={() => onViewTicket(ticket.id)} id={`ticket-row-${ticket.id}`}>
                      <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--color-primary-green)", whiteSpace: "nowrap" }}>
                        {ticket.ticketNumber}
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket.summary}
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                        {ticket.category?.name ?? "—"}
                      </td>
                      <td><PriorityBadge priority={ticket.requestedPriority} /></td>
                      <td><StatusBadge status={ticket.currentStatus} /></td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                        {new Date(ticket.createdAt).toLocaleDateString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="zen-mobile-cards">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="zen-mobile-card" onClick={() => onViewTicket(ticket.id)} id={`ticket-card-${ticket.id}`} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary-green)", fontSize: "0.85rem" }}>
                    {ticket.ticketNumber}
                  </span>
                  <StatusBadge status={ticket.currentStatus} />
                </div>
                <div style={{ fontWeight: 600, marginBottom: "0.4rem", fontSize: "0.9rem" }}>{ticket.summary}</div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <PriorityBadge priority={ticket.requestedPriority} />
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{ticket.category?.name}</span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", marginLeft: "auto" }}>
                    {new Date(ticket.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                id="btn-prev-page"
                className="zen-btn-secondary"
                style={{ padding: "0.35rem 0.75rem" }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Page {currentPage} / {totalPages}
              </span>
              <button
                id="btn-next-page"
                className="zen-btn-secondary"
                style={{ padding: "0.35rem 0.75rem" }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
