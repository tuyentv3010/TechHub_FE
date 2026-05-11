import http from "@/lib/http";
import {
  FileResponseType,
  FileListResponseType,
  FolderResponseType,
  FolderListResponseType,
  FileStatisticsResponseType,
  FileUsageListResponseType,
  DeleteResponseType,
  CreateFolderBodyType,
  UpdateFolderBodyType,
  UpdateFileBodyType,
  TrackFileUsageBodyType,
} from "@/schemaValidations/file.schema";

const fileApiRequest = {
  // ========== FILE MANAGEMENT ==========

  // Upload file (multipart form-data)
  uploadFile: (formData: FormData) =>
    http.post<FileResponseType>(`/api/proxy/files/upload`, formData, {
      baseUrl: "",
    }),

  // Upload multiple files (multipart form-data)
  uploadMultipleFiles: (formData: FormData) =>
    http.post<FileListResponseType>(`/api/proxy/files/upload/multiple`, formData, {
      baseUrl: "",
    }),

  // Get all files by user (GET /api/files?userId={userId}&page={page}&size={size})
  getFilesByUser: (userId: string, page: number = 0, size: number = 10, keyword?: string) => {
    const params = new URLSearchParams({
      userId,
      page: String(page),
      size: String(size),
    });
    const normalizedKeyword = keyword?.trim();

    if (normalizedKeyword) {
      params.set("keyword", normalizedKeyword);
    }

    return http.get<FileListResponseType>(`/app/api/proxy/files?${params.toString()}`);
  },

  // Get files by folder (GET /api/files/folder/{folderId}?userId={userId})
  getFilesByFolder: (
    folderId: string,
    userId: string,
    page: number = 0,
    size: number = 10,
    keyword?: string
  ) => {
    const params = new URLSearchParams({
      userId,
      page: String(page),
      size: String(size),
    });
    const normalizedKeyword = keyword?.trim();

    if (normalizedKeyword) {
      params.set("keyword", normalizedKeyword);
    }

    return http.get<FileListResponseType>(
      `/app/api/proxy/files/folder/${folderId}?${params.toString()}`
    );
  },

  // Get file by id (GET /api/files/{id}?userId={userId})
  getFileById: (id: string, userId: string) =>
    http.get<FileResponseType>(`/app/api/proxy/files/${id}?userId=${userId}`),

  // Search files (GET /api/files?userId={userId}&page={page}&size={size})
  searchFiles: (userId: string, keyword?: string, page: number = 0, size: number = 10) =>
    fileApiRequest.getFilesByUser(userId, page, size, keyword),

  // Update file metadata (PUT /api/files/{id}?userId={userId})
  updateFile: (id: string, userId: string, body: UpdateFileBodyType) =>
    http.put<FileResponseType>(`/app/api/proxy/files/${id}?userId=${userId}`, body),

  // Delete file (DELETE /api/files/{id}?userId={userId})
  deleteFile: (id: string, userId: string) =>
    http.delete<DeleteResponseType>(`/app/api/proxy/files/${id}?userId=${userId}`),

  // Get file statistics (GET /api/files/statistics?userId={userId})
  getFileStatistics: (userId: string) =>
    http.get<FileStatisticsResponseType>(
      `/app/api/proxy/files/statistics?userId=${userId}`
    ),

  // ========== FOLDER MANAGEMENT ==========

  // Create folder (POST /api/proxy/files/folders) - userId in body
  createFolder: (body: CreateFolderBodyType) =>
    http.post<FolderResponseType>(`/app/api/proxy/files/folders`, body),

  // Get all folders by user (GET /api/proxy/files/folders/user/{userId})
  getFoldersByUser: (userId: string) =>
    http.get<FolderListResponseType>(`/app/api/proxy/files/folders/user/${userId}`),

  // Get folder tree (GET /api/proxy/files/folders/{folderId}/tree?userId={userId})
  getFolderTree: (folderId: string, userId: string) =>
    http.get<FolderResponseType>(`/app/api/proxy/files/folders/${folderId}/tree?userId=${userId}`),

  // Get folder by id (GET /api/proxy/files/folders/{id}?userId={userId})
  getFolderById: (id: string, userId: string) =>
    http.get<FolderResponseType>(`/app/api/proxy/files/folders/${id}?userId=${userId}`),

  // Update folder (PUT /api/proxy/files/folders/{id}?userId={userId})
  updateFolder: (id: string, userId: string, body: UpdateFolderBodyType) =>
    http.put<FolderResponseType>(`/app/api/proxy/files/folders/${id}?userId=${userId}`, body),

  // Delete folder (DELETE /api/proxy/files/folders/{id}?userId={userId})
  deleteFolder: (id: string, userId: string) =>
    http.delete<DeleteResponseType>(`/app/api/proxy/files/folders/${id}?userId=${userId}`),
};

export default fileApiRequest;
