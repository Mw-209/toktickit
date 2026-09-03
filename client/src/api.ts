const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  itPriority: string | null;
  currentStatus: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  category: Category;
  relatedSystem: RelatedSystem;
  requester?: RequesterUser;
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

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) throw new Error("Backend is not responding");

  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) throw new Error("Failed to fetch categories");

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

export async function fetchActiveRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) throw new Error("Failed to fetch requesters");
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) throw new Error("Failed to fetch related systems");
  return res.json();
}

export async function createTicket(formData: FormData): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    body: formData,
  });

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
  requesterId: number,
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
  query.set("requesterId", String(requesterId));

  if (params.search && params.search.trim()) query.set("search", params.search.trim());
  if (params.categoryId) query.set("categoryId", String(params.categoryId));
  if (params.priority && params.priority !== "ALL") query.set("priority", params.priority);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function fetchTicketDetail(id: number, requesterId: number): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${id}?requesterId=${requesterId}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error("Access Denied: You cannot view another user's ticket.");
    if (res.status === 404) throw new Error("Ticket not found.");
    throw new Error("Failed to fetch ticket detail");
  }
  return res.json();
}

export async function uploadAttachment(ticketId: number, requesterId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments?requesterId=${requesterId}`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to upload attachment");
  }
  return data;
}

export async function softRemoveAttachment(
  ticketId: number,
  attachmentId: number,
  requesterId: number,
  removalReason: string
): Promise<Attachment> {
  const res = await fetch(
    `${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}?requesterId=${requesterId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removalReason }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to remove attachment");
  }
  return data;
}

export function getAttachmentDownloadUrl(attachmentId: number, requesterId: number): string {
  return `${API_URL}/api/attachments/${attachmentId}/download?requesterId=${requesterId}`;
}
