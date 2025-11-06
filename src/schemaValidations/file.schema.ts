import { z } from "zod";

// File Type enum
export const FileTypeEnum = z.enum([
  "IMAGE",
  "VIDEO",
  "DOCUMENT",
  "AUDIO",
  "OTHER",
]);

// File schema
export const FileSchema = z.object({
  id: z.string(), // UUID
  name: z.string().min(1, "File name is required"),
  originalName: z.string().optional(),
  cloudinaryPublicId: z.string(),
  cloudinaryUrl: z.string().url(),
  cloudinarySecureUrl: z.string().url(),
  fileType: FileTypeEnum,
  fileSize: z.number(),
  mimeType: z.string(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
  format: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  altText: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  folderName: z.string().nullable().optional(),
  userId: z.string(),
  uploadSource: z.string().optional(),
  referenceId: z.string().nullable().optional(),
  referenceType: z.string().nullable().optional(),
  created: z.string(),
  updated: z.string(),
  isActive: z.string().default("Y").optional(),
});

export type FileType = z.infer<typeof FileSchema>;

// Folder schema
export const FolderSchema = z.object({
  id: z.string(), // UUID
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().nullable().optional(),
  path: z.string(),
  description: z.string().nullable().optional(),
  userId: z.string(),
  isSystem: z.boolean().nullable().optional(),
  fileCount: z.number().default(0),
  totalSize: z.number().default(0),
  children: z.array(z.any()).nullable().optional(),
  created: z.string(),
  updated: z.string(),
  isActive: z.string().default("Y").optional(),
});

export type FolderType = z.infer<typeof FolderSchema>;

// File Statistics schema
export const FileStatisticsSchema = z.object({
  totalFiles: z.number(),
  totalSize: z.number(),
  byType: z.record(
    z.object({
      count: z.number(),
      size: z.number(),
    })
  ),
});

export type FileStatisticsType = z.infer<typeof FileStatisticsSchema>;

// File Usage schema
export const FileUsageSchema = z.object({
  id: z.string(),
  fileId: z.string(),
  entityType: z.string(), // e.g., "BLOG", "COURSE", "LESSON"
  entityId: z.string(),
  entityName: z.string().nullable().optional(),
  created: z.string(),
});

export type FileUsageType = z.infer<typeof FileUsageSchema>;

// Create/Update body schemas
export const CreateFolderBody = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().nullable().optional(),
  description: z.string().optional(),
});

export type CreateFolderBodyType = z.infer<typeof CreateFolderBody>;

export const UpdateFolderBody = z.object({
  name: z.string().min(1, "Folder name is required"),
});

export type UpdateFolderBodyType = z.infer<typeof UpdateFolderBody>;

export const UpdateFileBody = z.object({
  name: z.string().min(1, "File name is required").optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
});

export type UpdateFileBodyType = z.infer<typeof UpdateFileBody>;

export const TrackFileUsageBody = z.object({
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().min(1, "Entity ID is required"),
  entityName: z.string().nullable().optional(),
});

export type TrackFileUsageBodyType = z.infer<typeof TrackFileUsageBody>;

// Response wrappers
export const FileResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: FileSchema,
});

export type FileResponseType = z.infer<typeof FileResponseSchema>;

export const FileListResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: z.union([
    z.array(FileSchema), // For /upload/multiple
    z.object({
      content: z.array(FileSchema),
      pageable: z.object({
        pageNumber: z.number(),
        pageSize: z.number(),
        sort: z.object({
          empty: z.boolean(),
          sorted: z.boolean(),
          unsorted: z.boolean(),
        }),
        offset: z.number(),
        paged: z.boolean(),
        unpaged: z.boolean(),
      }),
      last: z.boolean(),
      totalPages: z.number(),
      totalElements: z.number(),
      first: z.boolean(),
      size: z.number(),
      number: z.number(),
      sort: z.object({
        empty: z.boolean(),
        sorted: z.boolean(),
        unsorted: z.boolean(),
      }),
      numberOfElements: z.number(),
      empty: z.boolean(),
    }), // For paginated list
  ]),
});

export type FileListResponseType = z.infer<typeof FileListResponseSchema>;

export const FolderResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: FolderSchema,
});

export type FolderResponseType = z.infer<typeof FolderResponseSchema>;

export const FolderListResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: z.array(FolderSchema),
});

export type FolderListResponseType = z.infer<typeof FolderListResponseSchema>;

export const FileStatisticsResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: FileStatisticsSchema,
});

export type FileStatisticsResponseType = z.infer<
  typeof FileStatisticsResponseSchema
>;

export const FileUsageListResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: z.array(FileUsageSchema),
});

export type FileUsageListResponseType = z.infer<
  typeof FileUsageListResponseSchema
>;

export const DeleteResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
});

export type DeleteResponseType = z.infer<typeof DeleteResponseSchema>;
