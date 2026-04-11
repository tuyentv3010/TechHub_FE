import http from "@/lib/http";

export type RevenueQueryParams = {
  fromDate?: string;
  toDate?: string;
  instructorId?: string;
};

const revenueApiRequest = {
  getInstructorDashboard: (params: RevenueQueryParams = {}) =>
    (console.log("[Revenue FE] instructor dashboard request", {
      endpoint: "/app/api/proxy/analytics/instructor",
      params,
    }), Promise.all([
      http.get("/app/api/proxy/analytics/instructor/overview", {
        params,
      }),
      http.get("/app/api/proxy/analytics/instructor/trends", {
        params,
      }),
    ])),

  getAdminDashboard: (params: RevenueQueryParams = {}) =>
    (console.log("[Revenue FE] admin dashboard request", {
      endpoint: "/app/api/proxy/analytics/admin",
      params,
    }), Promise.all([
      http.get("/app/api/proxy/analytics/admin/overview", {
        params,
      }),
      http.get("/app/api/proxy/analytics/admin/trends", {
        params,
      }),
    ])),
};

export default revenueApiRequest;