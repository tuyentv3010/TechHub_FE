import { useQuery } from "@tanstack/react-query";
import courseApiRequest from "@/apiRequests/course";

export const useMyEnrollments = (status?: string) => {
  return useQuery({
    queryKey: ["my-enrollments", status || "all"],
    queryFn: () => courseApiRequest.getMyEnrollments(status),
    staleTime: 60 * 1000,
  });
};
