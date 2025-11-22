/**
 * Course utility functions
 * Tương tự như blog.ts
 */

/**
 * Slugify - chuyển string thành slug
 */
export const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/**
 * Tạo slug từ title và id để đảm bảo unique
 * Format: title-slug-fullId
 * VD: web-development-fully-complete-guideline-123e4567-e89b-12d3-a456-426614174000
 */
export const createCourseSlug = (title: string, id: string): string => {
  const titleSlug = slugify(title);
  // Sử dụng full UUID để đảm bảo có thể query được từ backend
  return `${titleSlug}-${id}`;
};

/**
 * Extract ID từ slug
 * Format: title-slug-fullId
 * VD: web-development-fully-complete-guideline-123e4567-e89b-12d3-a456-426614174000
 * => 123e4567-e89b-12d3-a456-426614174000
 */
export const extractIdFromSlug = (slug: string): string => {
  // ID là phần cuối của slug, là UUID đầy đủ
  const parts = slug.split("-");
  // UUID có format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 parts khi split by -)
  // Lấy 5 phần cuối và join lại
  if (parts.length >= 5) {
    return parts.slice(-5).join("-");
  }
  // Fallback: return slug as is nếu không match format
  return slug;
};

/**
 * Format course level thành readable text
 */
export const formatCourseLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
    ALL_LEVELS: "Tất cả cấp độ",
  };
  return levelMap[level] || level;
};

/**
 * Format language thành readable text
 */
export const formatLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    VI: "Tiếng Việt",
    EN: "English",
    JA: "日本語",
  };
  return languageMap[language] || language;
};

/**
 * Format price thành currency
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  discountPrice: number
): number => {
  if (!discountPrice || discountPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};

/**
 * Format duration từ minutes thành readable text
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${remainingMinutes} phút`;
};

/**
 * Format tag label
 * Handles both string and object formats from backend
 */
export const formatTagLabel = (tag: string | { name: string } | any): string => {
  // Extract string value if tag is an object
  const tagString = typeof tag === 'string' ? tag : (tag?.name || String(tag));
  
  return tagString
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};
