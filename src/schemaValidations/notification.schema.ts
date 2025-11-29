import { z } from "zod";

// Notification Type enum matching BE
export const NotificationTypeEnum = z.enum([
  "ACCOUNT",
  "BLOG",
  "PROGRESS",
  "COMMENT",
  "SYSTEM",
]);

// Notification Delivery Method enum matching BE
export const NotificationDeliveryMethodEnum = z.enum([
  "EMAIL",
  "PUSH",
  "IN_APP",
]);

// Schema for a single notification
export const NotificationSchema = z.object({
  id: z.string(), // UUID
  type: NotificationTypeEnum,
  title: z.string(),
  message: z.string(),
  deliveryMethod: NotificationDeliveryMethodEnum,
  read: z.boolean(),
  createdAt: z.string(),
  sentAt: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

export type NotificationType = z.TypeOf<typeof NotificationSchema>;

// Page response for notifications
export const NotificationPageSchema = z.object({
  content: z.array(NotificationSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  size: z.number(),
  number: z.number(), // current page (0-indexed)
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
});

export type NotificationPageType = z.TypeOf<typeof NotificationPageSchema>;

// API Response wrapper
export const NotificationResSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: NotificationSchema,
});

export const NotificationListResSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: NotificationPageSchema,
});

export type NotificationResType = z.TypeOf<typeof NotificationResSchema>;
export type NotificationListResType = z.TypeOf<typeof NotificationListResSchema>;

// Unread count response
export const UnreadCountResSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.number(),
});

export type UnreadCountResType = z.TypeOf<typeof UnreadCountResSchema>;
