import { z } from "zod";
import {
  BlogAttachmentInputSchema,
  BlogAttachmentSchema,
  BlogCommentBodySchema,
  BlogCommentListResponseType,
  BlogCommentResponseType,
  BlogCommentType,
  BlogCommentBodyType,
  BlogListResponseType,
  BlogMutationResponseType,
  BlogResponseType,
  BlogStatusEnum,
  BlogTagsResponseType,
  BlogType,
  CreateBlogBodyType,
  UpdateBlogBodyType,
} from "@/schemaValidations/blog.schema";

export type BlogStatus = z.infer<typeof BlogStatusEnum>;
export type Blog = BlogType;
export type BlogAttachment = z.infer<typeof BlogAttachmentSchema>;
export type BlogAttachmentInput = z.infer<typeof BlogAttachmentInputSchema>;
export type BlogResponse = BlogResponseType;
export type BlogListResponse = BlogListResponseType;
export type BlogComment = BlogCommentType;
export type BlogCommentListResponse = BlogCommentListResponseType;
export type BlogCommentResponse = BlogCommentResponseType;
export type BlogTagsResponse = BlogTagsResponseType;
export type BlogMutationResponse = BlogMutationResponseType;
export type CreateBlogBody = CreateBlogBodyType;
export type UpdateBlogBody = UpdateBlogBodyType;
export type BlogCommentBody = BlogCommentBodyType;

export type BlogFilters = {
  page?: number;
  size?: number;
  keyword?: string;
  tags?: string[];
  includeDrafts?: boolean;
};

export type BlogOrderBy = "created" | "updated";

export type BlogListViewMode = "grid" | "list";

export type TocItem = {
  id: string;
  text: string;
  level: number;
};
