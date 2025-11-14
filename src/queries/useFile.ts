import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import fileApiRequest from "@/apiRequests/file";
import {
  CreateFolderBodyType,
  UpdateFolderBodyType,
  UpdateFileBodyType,
} from "@/schemaValidations/file.schema";

export const useGetFilesByUser = (userId: string, page?: number, size?: number) => {
  return useQuery({
    queryKey: ["files", "user", userId, page, size],
    queryFn: () => fileApiRequest.getFilesByUser(userId, page, size),
    enabled: !!userId,
  });
};

export const useGetFilesByFolder = (folderId: string, userId: string) => {
  return useQuery({
    queryKey: ["files", "folder", folderId, userId],
    queryFn: () => fileApiRequest.getFilesByFolder(folderId, userId),
    enabled: !!folderId && !!userId,
  });
};

export const useGetFile = (id: string, userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["file", id, userId],
    queryFn: () => fileApiRequest.getFileById(id, userId),
    enabled: enabled && !!id && !!userId,
  });
};

export const useGetFileStatistics = (userId: string) => {
  return useQuery({
    queryKey: ["files", "statistics", userId],
    queryFn: () => fileApiRequest.getFileStatistics(userId),
    enabled: !!userId,
  });
};

export const useGetFoldersByUser = (userId: string) => {
  return useQuery({
    queryKey: ["folders", "user", userId],
    queryFn: () => fileApiRequest.getFoldersByUser(userId),
    enabled: !!userId,
  });
};

export const useUploadFileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => fileApiRequest.uploadFile(formData),
    onSuccess: (_data, variables) => {
      const userId = variables.get("userId") as string;
      queryClient.invalidateQueries({ queryKey: ["files", "user", userId] });
      queryClient.invalidateQueries({ queryKey: ["files", "statistics", userId] });
      const folderId = variables.get("folderId") as string;
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ["files", "folder", folderId, userId] });
        queryClient.invalidateQueries({ queryKey: ["folders", "user", userId] });
      }
    },
  });
};

export const useUploadMultipleFilesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => fileApiRequest.uploadMultipleFiles(formData),
    onSuccess: (_data, variables) => {
      const userId = variables.get("userId") as string;
      queryClient.invalidateQueries({ queryKey: ["files", "user", userId] });
      queryClient.invalidateQueries({ queryKey: ["files", "statistics", userId] });
      const folderId = variables.get("folderId") as string;
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ["files", "folder", folderId, userId] });
        queryClient.invalidateQueries({ queryKey: ["folders", "user", userId] });
      }
    },
  });
};

export const useDeleteFileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      fileApiRequest.deleteFile(id, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["files", "user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["files", "statistics", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["folders", "user", variables.userId] });
    },
  });
};

export const useCreateFolderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFolderBodyType) =>
      fileApiRequest.createFolder(body),
    onSuccess: (_data, variables) => {
      const userId = variables.userId;
      queryClient.invalidateQueries({ queryKey: ["folders", "user", userId] });
    },
  });
};
