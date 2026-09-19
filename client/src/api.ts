const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Base fetch options to include credentials (cookies)
const fetchOpts = (options: RequestInit = {}) => ({
  ...options,
  credentials: "include" as RequestCredentials,
});

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  mustChangePassword: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Attachment {
  id: number;
  ticketId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  isRemoved: boolean;
  removedAt: string | null;
  removalReason: string | null;
  createdAt: string;
}

export interface PublicComment {
  id: number;
  ticketId: number;
  author: { id: number; name: string; role: string };
  content: string;
  createdAt: string;
}

export interface InternalNote {
  id: number;
  ticketId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: string;
  };
}

export interface UserAdminData {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  itPriority: string | null;
  currentStatus: "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "REOPENED" | "CANCELLED";
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  category: Category;
  relatedSystem: RelatedSystem;
  requester?: AuthUser | RequesterUser;
  assignedToId?: number | null;
  assignedTo?: StaffAssignee | null;
  resolveIndicatedAt?: string | null;
  attachments: Attachment[];
  attachmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResponse {
  items: Ticket[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StaffTicketFilters {
  search?: string;
  status?: string;
  itPriority?: string;
  categoryId?: number;
  assignedToId?: number | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StaffTicketListResponse {
  tickets: Ticket[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface StaffAssignee {
  id: number;
  name: string;
  role: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`, fetchOpts());
  if (!healthRes.ok) throw new Error("Backend is not responding");

  const categoriesRes = await fetch(`${API_URL}/api/categories`, fetchOpts());
  if (!categoriesRes.ok) throw new Error("Failed to fetch categories");

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

export async function fetchActiveRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch requesters");
  const data = await res.json();
  // Handle both plain array and { value: [...] } shapes
  return Array.isArray(data) ? data : (data.value ?? []);
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch related systems");
  return res.json();
}

export async function createTicket(formData: FormData): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, fetchOpts({
    method: "POST",
    body: formData,
  }));

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || "Failed to create ticket";
    const err = new Error(errorMsg) as any;
    err.details = data.error?.details;
    throw err;
  }
  return data;
}

export async function fetchTickets(
  params: {
    search?: string;
    categoryId?: number;
    priority?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<TicketListResponse> {
  const query = new URLSearchParams();

  if (params.search && params.search.trim()) query.set("search", params.search.trim());
  if (params.categoryId) query.set("categoryId", String(params.categoryId));
  if (params.priority && params.priority !== "ALL") query.set("priority", params.priority);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function fetchTicketDetail(id: number): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${id}`, fetchOpts());
  if (!res.ok) {
    if (res.status === 403) throw new Error("Access Denied: You cannot view another user's ticket.");
    if (res.status === 404) throw new Error("Ticket not found.");
    throw new Error("Failed to fetch ticket detail");
  }
  return res.json();
}

export async function uploadAttachment(ticketId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, fetchOpts({
    method: "POST",
    body: formData,
  }));

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to upload attachment");
  }
  return data;
}

export async function softRemoveAttachment(
  ticketId: number,
  attachmentId: number,
  removalReason: string
): Promise<Attachment> {
  const res = await fetch(
    `${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}`,
    fetchOpts({
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removalReason }),
    })
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to remove attachment");
  }
  return data;
}

export function getAttachmentDownloadUrl(attachmentId: number): string {
  return `${API_URL}/api/attachments/${attachmentId}/download`;
}

// --- Ticket Detail Endpoints ---

export async function fetchComments(ticketId: number): Promise<PublicComment[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch comments");
  const data = await res.json();
  return data.comments || [];
}

export async function postComment(ticketId: number, content: string): Promise<PublicComment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, fetchOpts({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }));
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to post comment");
  }
  return res.json();
}

export async function indicateTicketResolved(ticketId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/resolve-indication`, fetchOpts({
    method: "POST"
  }));
  if (!res.ok) throw new Error("Failed to indicate resolved");
}

// --- Auth Endpoints ---

export async function login(credentials: LoginCredentials): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/login`, fetchOpts({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  }));
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Invalid credentials or inactive account");
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, fetchOpts({ method: "POST" }));
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, fetchOpts());
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function changePassword(newPassword: string, confirmPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, fetchOpts({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword, confirmPassword }),
  }));
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to change password");
  }
}

// --- IT Staff Endpoints ---

export async function fetchStaffTickets(filters: StaffTicketFilters = {}): Promise<StaffTicketListResponse> {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  if (filters.itPriority) query.set("itPriority", filters.itPriority);
  if (filters.categoryId) query.set("categoryId", String(filters.categoryId));
  if (filters.assignedToId !== undefined && filters.assignedToId !== null) {
    query.set("assignedToId", String(filters.assignedToId));
  }
  if (filters.sortBy) query.set("sortBy", filters.sortBy);
  if (filters.sortOrder) query.set("sortOrder", filters.sortOrder);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.pageSize) query.set("pageSize", String(filters.pageSize));

  const res = await fetch(`${API_URL}/api/staff/tickets?${query.toString()}`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch staff tickets");
  return res.json();
}

export async function fetchStaffAssignees(): Promise<{ assignees: StaffAssignee[] }> {
  const res = await fetch(`${API_URL}/api/staff/assignees`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch staff assignees");
  return res.json();
}

export async function fetchStaffTicketDetail(id: number): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${id}`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch ticket detail");
  return res.json();
}

export async function updateTicketStatus(id: number, updates: { assignedToId?: number | null, itPriority?: string, currentStatus?: string }): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${id}`, fetchOpts({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  }));
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to update ticket");
  }
  return res.json();
}

export async function fetchNotes(ticketId: number): Promise<InternalNote[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, fetchOpts());
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  return data.notes || [];
}

export async function postNote(ticketId: number, content: string): Promise<InternalNote> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, fetchOpts({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }));
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to post note");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Lab 3 - Admin User Management Endpoints
// ---------------------------------------------------------------------------

export async function fetchAdminUsers(search?: string, role?: string): Promise<UserAdminData[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (role && role !== "All") params.append("role", role);
  
  const res = await fetch(`${API_URL}/api/admin/users?${params.toString()}`, fetchOpts({ method: "GET" }));
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to fetch users");
  }
  const data = await res.json();
  return data.users;
}

export async function createAdminUser(userData: Partial<UserAdminData> & { password?: string }): Promise<UserAdminData> {
  const res = await fetch(`${API_URL}/api/admin/users`, fetchOpts({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  }));
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to create user");
  }
  return res.json();
}

export async function updateAdminUser(id: number, userData: Partial<UserAdminData> & { newPassword?: string }): Promise<UserAdminData> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, fetchOpts({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  }));
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to update user");
  }
  return res.json();
}

