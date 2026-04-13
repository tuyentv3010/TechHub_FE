import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import revenueApiRequest, {
  CreateRevenuePolicyPayload,
  RevenuePolicyScope,
  RevenueQueryParams,
} from "@/apiRequests/revenue";

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

export const useActiveRevenuePolicy = (
  role: "ADMIN" | "INSTRUCTOR" | null,
  params: { instructorId?: string; courseId?: string; refTime?: string } = {}
) => {
  return useQuery({
    queryKey: ["active-revenue-policy", role, params],
    queryFn: async () => {
      const response = await revenueApiRequest.getActiveRevenuePolicy(params);
      return response.payload?.data;
    },
    enabled: role === "ADMIN",
  });
};

export const useRevenuePolicies = (
  role: "ADMIN" | "INSTRUCTOR" | null,
  scope: RevenuePolicyScope
) => {
  return useQuery({
    queryKey: ["revenue-policies", role, scope],
    queryFn: async () => {
      const response = await revenueApiRequest.getRevenuePolicies(scope);
      return response.payload?.data || [];
    },
    enabled: role === "ADMIN",
  });
};

export const useCreateRevenuePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRevenuePolicyPayload) => {
      const response = await revenueApiRequest.createRevenuePolicy(payload);
      return response.payload?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-policies"] });
      queryClient.invalidateQueries({ queryKey: ["active-revenue-policy"] });
      queryClient.invalidateQueries({ queryKey: ["revenue-dashboard"] });
    },
  });
};