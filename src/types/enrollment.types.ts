// Enrollment types
export type EnrollmentStatus = "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "DROPPED";

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  thumbnail: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  isActive: boolean;
}

export interface EnrollmentsResponse {
  status: string;
  data: Enrollment[];
  total: number;
}

export interface MyEnrollmentsPayload {
  payload: {
    status: string;
    data: Enrollment[];
    total: number;
  };
}
