import http from "@/lib/http";

export type RevenueQueryParams = {
  fromDate?: string;
  toDate?: string;
  instructorId?: string;
};

export type RevenuePolicyScope = "GLOBAL" | "INSTRUCTOR" | "COURSE";

export type RevenueSplitPolicy = {
  id: string;
  scope: RevenuePolicyScope;
  instructorId?: string | null;
  courseId?: string | null;
  instructorRate: number;
  adminRate: number;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: string;
};

export type ResolvedRevenuePolicy = {
  policyId?: string | null;
  scope: RevenuePolicyScope;
  version: number;
  instructorRate: number;
  adminRate: number;
};

export type CreateRevenuePolicyPayload = {
  scope: RevenuePolicyScope;
  instructorId?: string;
  courseId?: string;
  instructorRate: number;
  effectiveFrom?: string;
  effectiveTo?: string;
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

  getActiveRevenuePolicy: (params: {
    instructorId?: string;
    courseId?: string;
    refTime?: string;
  } = {}) =>
    http.get("/app/api/proxy/payments/revenue-policies/active", {
      params,
    }),

  getRevenuePolicies: (scope: RevenuePolicyScope = "GLOBAL") =>
    http.get("/app/api/proxy/payments/revenue-policies", {
      params: { scope },
    }),

  createRevenuePolicy: (payload: CreateRevenuePolicyPayload) =>
    http.post("/app/api/proxy/payments/revenue-policies", payload),
};

export default revenueApiRequest;