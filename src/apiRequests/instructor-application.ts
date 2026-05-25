import http from "@/lib/http";

export type InstructorApplicationCertificate = {
  id: string;
  fileId: string;
  fileUrl?: string | null;
  aiStatus: "PENDING" | "PROCESSED" | "FAILED";
  aiData?: string | null;
  aiError?: string | null;
};

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

  cccdFrontFileId?: string | null;
  cccdFrontFileUrl?: string | null;
  cccdFrontStatus?: "PENDING" | "PROCESSED" | "FAILED" | null;
  cccdFrontData?: string | null;
  cccdFrontError?: string | null;

  cccdBackFileId?: string | null;
  cccdBackFileUrl?: string | null;
  cccdBackStatus?: "PENDING" | "PROCESSED" | "FAILED" | null;
  cccdBackData?: string | null;
  cccdBackError?: string | null;

  certificates?: InstructorApplicationCertificate[] | null;

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

export type SubmitInstructorApplicationPayload = {
  cvFileId: string;
  cvFileUrl?: string;
  cccdFrontFileId?: string;
  cccdFrontFileUrl?: string;
  cccdBackFileId?: string;
  cccdBackFileUrl?: string;
  certificates?: { fileId: string; fileUrl?: string }[];
};

const BASE = "/app/api/proxy/users/instructor-applications";

const instructorApplicationApi = {
  submit: (payload: SubmitInstructorApplicationPayload) =>
    http.post<any>(BASE, payload),

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

  rescanCv: (id: string) => http.post<any>(`${BASE}/${id}/rescan/cv`, {}),
  rescanCccdFront: (id: string) => http.post<any>(`${BASE}/${id}/rescan/cccd-front`, {}),
  rescanCccdBack: (id: string) => http.post<any>(`${BASE}/${id}/rescan/cccd-back`, {}),
  rescanCertificate: (certId: string) =>
    http.post<any>(`${BASE}/certificates/${certId}/rescan`, {}),
};

export default instructorApplicationApi;
