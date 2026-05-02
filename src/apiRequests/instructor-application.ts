import http from "@/lib/http";

export type InstructorApplication = {
  id: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  cvFileId: string;
  cvFileUrl?: string | null;
  aiStatus: "PENDING" | "PROCESSED" | "FAILED";
  aiExtractedData?: string | null; // JSON string
  aiError?: string | null;
  adminStatus: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  created: string;
  updated: string;
};

export type InstructorApplicationListResponse = {
  content: InstructorApplication[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const BASE = "/app/api/proxy/users/instructor-applications";

const instructorApplicationApi = {
  submit: (cvFileId: string, cvFileUrl?: string) =>
    http.post<any>(BASE, { cvFileId, cvFileUrl }),

  getMine: () => http.get<any>(`${BASE}/me`),

  listForAdmin: (status?: string, page = 0, size = 20) => {
    const qs = new URLSearchParams();
    if (status && status !== "ALL") qs.set("status", status);
    qs.set("page", String(page));
    qs.set("size", String(size));
    return http.get<any>(`${BASE}?${qs.toString()}`);
  },

  getDetail: (id: string) => http.get<any>(`${BASE}/${id}`),

  approve: (id: string, note?: string) =>
    http.put<any>(`${BASE}/${id}/approve`, { note }),

  reject: (id: string, note: string) =>
    http.put<any>(`${BASE}/${id}/reject`, { note }),
};

export default instructorApplicationApi;
