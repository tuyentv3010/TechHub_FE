import http from "@/lib/http";

export type InstructorProfile = {
  userId: string;
  sourceApplicationId?: string | null;

  // CCCD (chỉ owner/admin)
  idNumber?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  placeOfOrigin?: string | null;
  placeOfResidence?: string | null;
  cccdIssueDate?: string | null;
  cccdIssuePlace?: string | null;
  cccdMrz?: string | null;
  identifyingFeatures?: string | null;

  // CV
  cvSummary?: string | null;
  cvEmail?: string | null;
  cvPhone?: string | null;
  cvLocation?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  yearsOfExperience?: number | null;
  skills?: any;
  languages?: any;
  education?: any;
  experience?: any;
  projects?: any;
  cvCertifications?: any;

  certificates?: any;

  created?: string;
  updated?: string;
};

const BASE = "/app/api/proxy/users/instructor-profiles";

const instructorProfileApi = {
  getMine: () => http.get<any>(`${BASE}/me`),
  getByUserId: (userId: string) => http.get<any>(`${BASE}/${userId}`),
};

export default instructorProfileApi;
