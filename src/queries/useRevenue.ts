import { useQuery } from "@tanstack/react-query";
import revenueApiRequest, { RevenueQueryParams } from "@/apiRequests/revenue";

export const useRevenueDashboard = (
  role: "ADMIN" | "INSTRUCTOR" | null,
  params: RevenueQueryParams
) => {
  return useQuery({
    queryKey: ["revenue-dashboard", role, params],
    queryFn: async () => {
      console.log("[Revenue FE] useRevenueDashboard query", { role, params });
      if (!role) {
        throw new Error("Missing revenue role context");
      }
      const [overviewResponse, trendsResponse] =
        role === "ADMIN"
          ? await revenueApiRequest.getAdminDashboard(params)
          : await revenueApiRequest.getInstructorDashboard(params);

      console.log("[Revenue FE] useRevenueDashboard response", {
        role,
        overviewStatus: overviewResponse.status,
        trendsStatus: trendsResponse.status,
      });

      return {
        overview: overviewResponse.payload?.data,
        trends: trendsResponse.payload?.data || [],
      };
    },
    enabled: !!role,
  });
};