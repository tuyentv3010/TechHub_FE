import http from "@/lib/http";

export type RevenueQueryParams = {
  fromDate?: string;
  toDate?: string;
  instructorId?: string;
};

const revenueApiRequest = {
  getInstructorDashboard: (params: RevenueQueryParams = {}) =>
    Promise.all([
      http.get("/app/api/proxy/payments/analytics/instructor/overview", {
        params,
      }),
      http.get("/app/api/proxy/payments/analytics/instructor/trends", {
        params,
      }),
    ]),

  getAdminDashboard: (params: RevenueQueryParams = {}) =>
    Promise.all([
      http.get("/app/api/proxy/payments/analytics/admin/overview", {
        params,
      }),
      http.get("/app/api/proxy/payments/analytics/admin/trends", {
        params,
      }),
    ]),
};

export default revenueApiRequest;