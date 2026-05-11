import http from "@/lib/http";
import envConfig from "@/config";

export type FxRateResponse = {
  from: string;
  to: string;
  rate: number;
};

export const fxApi = {
  getRate: (from: string, to: string) =>
    http.get<{ payload: { data: FxRateResponse } }>(
      `/app/api/proxy/payments/fx/rate?from=${from}&to=${to}`
    ),
};

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

export type PaymentHistoryParams = {
  page?: number;
  size?: number;
};

export type PaymentPageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type GlobalResponse<T> = {
  success: boolean;
  status: string;
  message: string;
  data: T;
  timestamp?: string;
  code?: number;
};

export type PaymentTransactionItem = {
  id?: string;
  paymentId?: string;
  transactionId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  courseId?: string;
  courseName?: string;
  amount?: number;
  grossAmount?: number;
  instructorAmount?: number;
  adminAmount?: number;
  paymentMethod?: string;
  status?: string;
  created?: string;
  createdAt?: string;
  updated?: string;
  updatedAt?: string;
  currency?: string;
  [key: string]: unknown;
};

export type PayoutBalanceResponse = {
  instructorId: string;
  totalEarned: number;
  pendingAmount: number;
  availableAmount: number;
  totalEarnedUsd?: number;
  pendingAmountUsd?: number;
  availableAmountUsd?: number;
  usdRate?: number;
  currency?: string;
};

export type CreatePayoutRequestPayload = {
  amount: number;
  note?: string;
  currency?: "VND" | "USD";
};

export type PayoutRequestResponse = {
  id: string;
  instructorId: string;
  batchId?: string | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  amount: number;
  status: string;
  note?: string | null;
  reviewNote?: string | null;
  paymentReference?: string | null;
  approvedAt?: string | null;
  markedPaidAt?: string | null;
  created?: string | null;
  updated?: string | null;
};

export type PayoutInvoiceResponse = {
  id: string;
  invoiceNumber: string;
  payoutRequestId: string;
  instructorId: string;
  amount: number;
  transferReference?: string | null;
  status: string;
  emailSent?: boolean | null;
  uiVisible?: boolean | null;
  pdfUrl?: string | null;
  created?: string | null;
  updated?: string | null;
};

export type PayoutBatchResponse = {
  id: string;
  batchName: string;
  periodKey?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  status: string;
  totalRequests: number;
  totalAmount: number;
  created?: string | null;
};

export type ReviewPayoutRequestPayload = {
  note?: string;
};

export type MarkPaidPayoutRequestPayload = {
  paymentReference: string;
  note?: string;
};

export type CreateManualPayoutBatchPayload = {
  name?: string;
  fromDate: string;
  toDate: string;
};

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

  getPaymentHistory: (params: PaymentHistoryParams = {}) =>
    http.get<GlobalResponse<PaymentPageResponse<PaymentTransactionItem>>>("/app/api/proxy/payments/history", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }),

  getPaymentDetail: (paymentId: string) =>
    http.get(`/app/api/proxy/payments/${paymentId}`),

  getPayoutBalance: (instructorId?: string) =>
    http.get<GlobalResponse<PayoutBalanceResponse>>("/app/api/proxy/payments/payouts/balance", {
      params: instructorId ? { instructorId } : undefined,
    }),

  createPayoutRequest: (payload: CreatePayoutRequestPayload) =>
    http.post<GlobalResponse<PayoutRequestResponse>>("/app/api/proxy/payments/payouts/requests", payload),

  listPayoutRequests: () =>
    http.get<GlobalResponse<PayoutRequestResponse[]>>("/app/api/proxy/payments/payouts/requests"),

  getPayoutRequest: (requestId: string) =>
    http.get<GlobalResponse<PayoutRequestResponse>>(`/app/api/proxy/payments/payouts/requests/${requestId}`),

  approvePayoutRequest: (requestId: string, payload: ReviewPayoutRequestPayload = {}) =>
    http.put<GlobalResponse<PayoutRequestResponse>>(
      `/app/api/proxy/payments/payouts/requests/${requestId}/approve`,
      payload
    ),

  settleApprovedPayoutRequest: (requestId: string, payload: ReviewPayoutRequestPayload = {}) =>
    http.put<GlobalResponse<PayoutRequestResponse>>(
      `/app/api/proxy/payments/payouts/requests/${requestId}/settle`,
      payload
    ),

  rejectPayoutRequest: (requestId: string, payload: ReviewPayoutRequestPayload = {}) =>
    http.put<GlobalResponse<PayoutRequestResponse>>(
      `/app/api/proxy/payments/payouts/requests/${requestId}/reject`,
      payload
    ),

  markPayoutRequestPaid: (requestId: string, payload: MarkPaidPayoutRequestPayload) =>
    http.put<GlobalResponse<PayoutRequestResponse>>(
      `/app/api/proxy/payments/payouts/requests/${requestId}/mark-paid`,
      payload
    ),

  listPayoutBatches: () =>
    http.get<GlobalResponse<PayoutBatchResponse[]>>("/app/api/proxy/payments/payouts/batches"),

  listPayoutInvoices: (instructorId?: string) =>
    http.get<GlobalResponse<PayoutInvoiceResponse[]>>("/app/api/proxy/payments/payouts/invoices", {
      params: instructorId ? { instructorId } : undefined,
    }),

  getPayoutInvoice: (invoiceId: string) =>
    http.get<GlobalResponse<PayoutInvoiceResponse>>(`/app/api/proxy/payments/payouts/invoices/${invoiceId}`),

  downloadPayoutInvoicePdf: async (invoiceId: string) => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const res = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/payments/payouts/invoices/${invoiceId}/pdf`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/pdf",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }
    );

    if (!res.ok) {
      throw new Error("Could not download invoice PDF");
    }

    return res.blob();
  },

  createMonthlyPayoutBatch: (period?: string) =>
    http.post<GlobalResponse<PayoutBatchResponse>>("/app/api/proxy/payments/payouts/batches/monthly", null, {
      params: period ? { period } : undefined,
    }),

  createManualPayoutBatch: (payload: CreateManualPayoutBatchPayload) =>
    http.post<GlobalResponse<PayoutBatchResponse>>("/app/api/proxy/payments/payouts/batches/manual", null, {
      params: {
        name: payload.name,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
      },
    }),
};

export default paymentApiRequest;
