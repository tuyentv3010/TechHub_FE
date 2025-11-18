import http from "@/lib/http";

export interface VNPayPaymentRequest {
  amount: number;
  bankCode?: string;
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
      },
    }),

  // PayPal payment - POST with query params
  createPayPalPayment: (amount: number) =>
    http.post<PayPalPaymentResponse>(
      "/app/api/proxy/payments/paypal/create",
      {}, // body - empty object
      {
        params: {
          amount: amount,
        },
      } // options with params
    ),
};

export default paymentApiRequest;
