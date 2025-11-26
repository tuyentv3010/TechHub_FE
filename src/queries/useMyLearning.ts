import { useQuery } from "@tanstack/react-query";
import courseApiRequest from "@/apiRequests/course";

export const useMyEnrollments = (status?: string) => {
  return useQuery({
    queryKey: ["my-enrollments", status],
    queryFn: () => courseApiRequest.getMyEnrollments(status),
  });
};
