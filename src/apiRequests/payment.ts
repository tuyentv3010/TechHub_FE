import http from "@/lib/http";

export interface VNPayPaymentRequest {
  amount: number;
  bankCode?: string;
  userId: string;
  courseId: string;
}

export interface VNPayPaymentResponse {
  code: number;
  message: string;
  data: {
    code: string;
    message: string;
    paymentUrl: string;
  };
}

export interface PayPalPaymentResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

const paymentApiRequest = {
  // Create VNPay payment URL
  createVNPayPayment: (params: VNPayPaymentRequest) =>
    http.get<VNPayPaymentResponse>("/app/api/proxy/payments/vn-pay", {
      params: {
        amount: params.amount,
        bankCode: params.bankCode,
        userId: params.userId,
        courseId: params.courseId,
      },
    }),

  // PayPal payment - POST with query params
  createPayPalPayment: (amount: number, userId: string, courseId: string) =>
    http.post<PayPalPaymentResponse>(
      "/app/api/proxy/payments/paypal/create",
      {}, // body - empty object
      {
        params: {
          amount: amount,
          userId: userId,
          courseId: courseId,
        },
      } // options with params
    ),
};

export default paymentApiRequest;
