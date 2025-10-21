import { z } from "zod";

export const BlogStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const BlogAttachmentSchema = z.object({
  type: z.enum(["image", "pdf"]),
  url: z.string().url().max(2048, "URL is too long"),
  caption: z
    .string()
    .max(255, "Caption cannot exceed 255 characters")
    .nullable()
    .optional(),
  altText: z
    .string()
    .max(255, "Alt text cannot exceed 255 characters")
    .nullable()
    .optional(),
});

export const BlogAttachmentInputSchema = z.object({
  type: z.enum(["image", "pdf"]),
  url: z.string().url("Attachment URL is invalid"),
  caption: z.string().max(255).optional().or(z.literal("")),
  altText: z.string().max(255).optional().or(z.literal("")),
});

export const BlogSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  status: BlogStatusEnum,
  tags: z.array(z.string()),
  attachments: z.array(BlogAttachmentSchema),
  authorId: z.string().uuid(),
  created: z.string(),
  updated: z.string(),
  active: z.boolean().optional(),
});

export type BlogType = z.infer<typeof BlogSchema>;

export const BlogListResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.array(BlogSchema),
  pagination: z.object({
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    first: z.boolean(),
    last: z.boolean(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
  timestamp: z.string(),
  path: z.string().optional(),
  code: z.number(),
});

export type BlogListResponseType = z.infer<typeof BlogListResponseSchema>;

export const BlogResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: BlogSchema,
  timestamp: z.string(),
  path: z.string().optional(),
  code: z.number(),
});

export type BlogResponseType = z.infer<typeof BlogResponseSchema>;

export type BlogCommentType = {
  id: string;
  content: string;
  userId: string;
  parentId?: string | null;
  created: string;
  replies: BlogCommentType[];
};

export const BlogCommentSchema: z.ZodType<BlogCommentType> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    content: z.string(),
    userId: z.string().uuid(),
    parentId: z.string().uuid().nullable().optional(),
    created: z.string(),
    replies: z.array(BlogCommentSchema),
  })
);

export const BlogCommentListResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.array(BlogCommentSchema),
  timestamp: z.string(),
  path: z.string().optional(),
  code: z.number(),
});

export type BlogCommentListResponseType = z.infer<
  typeof BlogCommentListResponseSchema
>;

export const BlogCommentResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: BlogCommentSchema,
  timestamp: z.string(),
  path: z.string().optional(),
  code: z.number(),
});

export type BlogCommentResponseType = z.infer<
  typeof BlogCommentResponseSchema
>;

export const BlogMutationResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.null().optional(),
  timestamp: z.string(),
  path: z.string().optional(),
  code: z.number(),
});

export type BlogMutationResponseType = z.infer<
  typeof BlogMutationResponseSchema
>;

export const CreateBlogBodySchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  content: z.string().min(1, "Nội dung không được để trống"),
  status: BlogStatusEnum.default("DRAFT"),
  tags: z.array(z.string()).default([]),
  attachments: z.array(BlogAttachmentInputSchema).default([]),
});

export const UpdateBlogBodySchema = CreateBlogBodySchema.extend({
  status: BlogStatusEnum,
});

export type CreateBlogBodyType = z.infer<typeof CreateBlogBodySchema>;
export type UpdateBlogBodyType = z.infer<typeof UpdateBlogBodySchema>;

export const BlogCommentBodySchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung bình luận không được để trống")
    .max(2000, "Nội dung bình luận tối đa 2000 ký tự"),
  parentId: z.string().uuid().nullable().optional(),
});

export type BlogCommentBodyType = z.infer<typeof BlogCommentBodySchema>;

export const BlogTagsResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.array(z.string()),
  timestamp: z.string(),
  path: z.string().optional(),
  code: z.number(),
});

export type BlogTagsResponseType = z.infer<typeof BlogTagsResponseSchema>;
