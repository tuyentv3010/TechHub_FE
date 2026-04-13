import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import paymentApiRequest, {
  CreateManualPayoutBatchPayload,
  CreatePayoutRequestPayload,
  MarkPaidPayoutRequestPayload,
  ReviewPayoutRequestPayload,
  VNPayPaymentRequest,
} from "@/apiRequests/payment";

export const useCreateVNPayPayment = () => {
  return useMutation({
    mutationFn: (params: VNPayPaymentRequest) =>
      paymentApiRequest.createVNPayPayment(params),
  });
};

export const useCreatePayPalPayment = () => {
  return useMutation({
    mutationFn: ({ amount, userId, courseId }: { amount: number; userId: string; courseId: string }) =>
      paymentApiRequest.createPayPalPayment(amount, userId, courseId),
  });
};

export const usePayoutBalance = (instructorId?: string) => {
  return useQuery({
    queryKey: ["payout-balance", instructorId || "me"],
    queryFn: async () => {
      const response = await paymentApiRequest.getPayoutBalance(instructorId);
      return response.payload?.data;
    },
  });
};

export const usePayoutRequests = () => {
  return useQuery({
    queryKey: ["payout-requests"],
    queryFn: async () => {
      const response = await paymentApiRequest.listPayoutRequests();
      return response.payload?.data || [];
    },
  });
};

export const usePayoutBatches = () => {
  return useQuery({
    queryKey: ["payout-batches"],
    queryFn: async () => {
      const response = await paymentApiRequest.listPayoutBatches();
      return response.payload?.data || [];
    },
  });
};

export const useCreatePayoutRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayoutRequestPayload) => paymentApiRequest.createPayoutRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["payout-balance"] });
    },
  });
};

export const usePayoutRequestDetail = (requestId?: string) => {
  return useQuery({
    queryKey: ["payout-request-detail", requestId],
    queryFn: async () => {
      if (!requestId) {
        return null;
      }
      const response = await paymentApiRequest.getPayoutRequest(requestId);
      return response.payload?.data || null;
    },
    enabled: !!requestId,
  });
};

export const useApprovePayoutRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload?: ReviewPayoutRequestPayload }) =>
      paymentApiRequest.approvePayoutRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["payout-batches"] });
    },
  });
};

export const useRejectPayoutRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload?: ReviewPayoutRequestPayload }) =>
      paymentApiRequest.rejectPayoutRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["payout-batches"] });
    },
  });
};

export const useMarkPayoutRequestPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: MarkPaidPayoutRequestPayload }) =>
      paymentApiRequest.markPayoutRequestPaid(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["payout-batches"] });
    },
  });
};

export const useCreateMonthlyPayoutBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (period?: string) => paymentApiRequest.createMonthlyPayoutBatch(period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-batches"] });
    },
  });
};

export const useCreateManualPayoutBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManualPayoutBatchPayload) => paymentApiRequest.createManualPayoutBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-batches"] });
    },
  });
};
