import http from "@/lib/http";
import {
  AccountResType,
  AccountListResType,
  CreateEmployeeAccountBodyType,
  UpdateEmployeeAccountBodyType,
} from "@/schemaValidations/account.schema";

const accountApiRequest = {
  // Get user profile
  getProfile: () =>
    http.get<AccountResType>("/app/api/proxy/users/profile"),

  // Update current user profile
  updateProfile: (body: UpdateEmployeeAccountBodyType) =>
    http.put<AccountResType>("/app/api/proxy/users/profile", body),

  // Get all accounts (with pagination)
  getAccountList: (page: number = 1, size: number = 10) =>
    http.get<AccountListResType>(`/app/api/proxy/users?page=${page - 1}&size=${size}`),

  // Get account by email
  getAccountByEmail: (email: string) =>
    http.get<AccountResType>(`/app/api/proxy/users/email/${encodeURIComponent(email)}`),

  // Get account by ID
  getAccountById: (id: string) =>
    http.get<AccountResType>(`/app/api/proxy/users/${id}`),

  // Create new account
  createAccount: (body: CreateEmployeeAccountBodyType) =>
    http.post<AccountResType>("/app/api/proxy/users", body),

  // Update account
  updateAccount: (id: string, body: UpdateEmployeeAccountBodyType) =>
    http.put<AccountResType>(`/app/api/proxy/users/${id}`, body),

  // Delete account
  deleteAccount: (id: string) =>
    http.delete<{ success: boolean; message: string }>(`/app/api/proxy/users/${id}`),

  // Upload avatar (if you have this endpoint)
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post<{ url: string }>("/app/api/proxy/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default accountApiRequest;
