import { useQuery } from "@tanstack/react-query";
import revenueApiRequest, { RevenueQueryParams } from "@/apiRequests/revenue";

export const useRevenueDashboard = (
  role: "ADMIN" | "INSTRUCTOR",
  params: RevenueQueryParams
) => {
  return useQuery({
    queryKey: ["revenue-dashboard", role, params],
    queryFn: async () => {
      const [overviewResponse, trendsResponse] =
        role === "ADMIN"
          ? await revenueApiRequest.getAdminDashboard(params)
          : await revenueApiRequest.getInstructorDashboard(params);

      return {
        overview: overviewResponse.payload?.data,
        trends: trendsResponse.payload?.data || [],
      };
    },
    enabled: !!role,
  });
};