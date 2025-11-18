import { useMutation } from "@tanstack/react-query";
import paymentApiRequest, { VNPayPaymentRequest } from "@/apiRequests/payment";

export const useCreateVNPayPayment = () => {
  return useMutation({
    mutationFn: (params: VNPayPaymentRequest) =>
      paymentApiRequest.createVNPayPayment(params),
  });
};

export const useCreatePayPalPayment = () => {
  return useMutation({
    mutationFn: (amount: number) =>
      paymentApiRequest.createPayPalPayment(amount),
  });
};
