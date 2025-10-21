import { z } from "zod";

// Status enum used by API
export const BlogStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);

// Attachment schema used in blog content
export const BlogAttachmentSchema = z.object({
  type: z.string(), // e.g. "image", "pdf"
  url: z.string().url(),
  caption: z.string().nullable().optional(),
  altText: z.string().nullable().optional(),
});

// Input attachment is same shape for now
export const BlogAttachmentInputSchema = BlogAttachmentSchema;

export const BlogSchema = z.object({
  id: z.string(), // UUID
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""), // HTML content
  status: BlogStatusEnum,
  tags: z.array(z.string()).default([]),
  attachments: z.array(BlogAttachmentSchema).default([]),
  authorId: z.string(),
  created: z.string(),
  updated: z.string(),
  active: z.boolean().default(true),
});

export type BlogType = z.infer<typeof BlogSchema>;

export const CreateBlogBody = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""),
  status: BlogStatusEnum.default("DRAFT"),
  tags: z.array(z.string()).default([]),
  attachments: z.array(BlogAttachmentInputSchema).default([]),
});

export type CreateBlogBodyType = z.infer<typeof CreateBlogBody>;

export const UpdateBlogBody = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""),
  status: BlogStatusEnum,
  tags: z.array(z.string()).default([]),
  attachments: z.array(BlogAttachmentInputSchema).default([]),
});

export type UpdateBlogBodyType = z.infer<typeof UpdateBlogBody>;

// Recursive comment schema
export const BlogCommentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    content: z.string(),
    userId: z.string(),
    parentId: z.string().nullable().optional(),
    created: z.string(),
    replies: z.array(BlogCommentSchema).default([]),
  })
);

export type BlogCommentType = z.infer<typeof BlogCommentSchema>;

export const BlogCommentBodySchema = z.object({
  content: z.string().min(1, "Content is required"),
  parentId: z.string().optional().nullable(),
});

export type BlogCommentBodyType = z.infer<typeof BlogCommentBodySchema>;

// Response wrappers
export const BlogResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: BlogSchema,
  timestamp: z.string(),
  path: z.string(),
  code: z.number(),
});

export type BlogResponseType = z.infer<typeof BlogResponseSchema>;

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
  path: z.string(),
  code: z.number(),
});

export type BlogListResponseType = z.infer<typeof BlogListResponseSchema>;

export const BlogTagsResponseSchema = z.object({
  success: z.boolean().optional(),
  status: z.string().optional(),
  message: z.string().optional(),
  data: z.array(z.string()),
  timestamp: z.string().optional(),
  path: z.string().optional(),
  code: z.number().optional(),
});

export type BlogTagsResponseType = z.infer<typeof BlogTagsResponseSchema>;

export const BlogCommentListResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string(),
  data: z.array(BlogCommentSchema),
  timestamp: z.string(),
  path: z.string(),
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
  path: z.string(),
  code: z.number(),
});

export type BlogCommentResponseType = z.infer<
  typeof BlogCommentResponseSchema
>;

// Mutation response alias
export type BlogMutationResponseType = BlogResponseType;
