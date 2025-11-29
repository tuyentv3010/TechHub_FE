import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import accountApiRequest from "@/apiRequests/account";
import {
  CreateEmployeeAccountBodyType,
  UpdateEmployeeAccountBodyType,
  UpdateProfileBodyType,
} from "@/schemaValidations/account.schema";

// Get user profile
export const useAccountProfile = () => {
  return useQuery({
    queryKey: ["account-profile"],
    queryFn: () => accountApiRequest.getProfile(),
  });
};

// Get account list with pagination
export const useGetAccountList = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ["account-list", page, pageSize],
    queryFn: () => accountApiRequest.getAccountList(page, pageSize),
  });
};

// Get account by email
export const useGetAccountByEmail = (email: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["account-by-email", email],
    queryFn: () => accountApiRequest.getAccountByEmail(email),
    enabled: enabled && !!email,
  });
};

// Get account by ID
export const useGetAccount = ({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) => {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => accountApiRequest.getAccountById(id),
    enabled: enabled && !!id,
  });
};

// Create account mutation
export const useAddAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      body,
      avatarFile,
    }: {
      body: CreateEmployeeAccountBodyType;
      avatarFile?: File;
    }) => {
      // If you need to upload avatar first, do it here
      // For now, just create the account
      return accountApiRequest.createAccount(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-list"] });
    },
  });
};

// Update account mutation
export const useUpdateAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
      avatarFile,
    }: {
      id: string;
      body: UpdateEmployeeAccountBodyType;
      avatarFile?: File;
    }) => {
      // If you need to upload avatar first, do it here
      // For now, just update the account
      return accountApiRequest.updateAccount(id, body);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["account-list"] });
      queryClient.invalidateQueries({ queryKey: ["account", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
    },
  });
};

// Delete account mutation
export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountApiRequest.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-list"] });
    },
  });
};

// Update current user profile mutation
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProfileBodyType) => 
      accountApiRequest.updateProfile(body as UpdateEmployeeAccountBodyType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
    },
  });
};

// Get user permissions
export const useUserPermissions = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => accountApiRequest.getUserPermissions(userId),
    enabled: enabled && !!userId,
  });
};

// Get public instructors (no auth required)
export const useGetPublicInstructors = (page: number = 0, size: number = 4) => {
  return useQuery({
    queryKey: ["public-instructors", page, size],
    queryFn: () => accountApiRequest.getPublicInstructors(page, size),
  });
};
