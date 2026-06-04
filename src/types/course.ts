// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  status: string;
  message: string;
  data: T;
  pagination?: Pagination;
  timestamp: string;
  path: string;
  code: number;
}

export interface Pagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Course Types
export interface Skill {
  id: string;
  name: string;
  thumbnail: string;
  category: "LANGUAGE" | "FRAMEWORK" | "TOOL";
}

export interface Tag {
  id: string;
  name: string;
}

export interface FileInfo {
  fileId: string | null;
  name: string | null;
  originalName: string | null;
  url: string;
  secureUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
}

export interface ApiCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string | null;
  discountPrice: number;
  promoEndDate: string | null;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: "VI" | "EN";
  categories: unknown | null;
  skills: Skill[];
  tags: Tag[];
  objectives: string[];
  requirements: string[];
  instructorId: string;
  thumbnail: FileInfo | null;
  introVideo: FileInfo | null;
  created: string;
  updated: string;
  active: boolean;
  totalEnrollments: number;
  averageRating: number | null;
  ratingCount: number;
}

// Legacy Course interface for backward compatibility
export interface Course {
  id?: string;
  title: string;
  description?: string;
  instructor: string;
  image: string | null;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  badge?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  language?: "VI" | "EN" | "JA" | string;
  hours?: number;
  lectures?: number;
  lessons?: number;
  students?: number;
  instructorAvatar?: string;
  instructorId?: string;
  skills?: Skill[];
  promoEndDate?: string | null;
  createdAt?: string;
  currency?: string;
}

// Course API Response Type
export type CoursesResponse = ApiResponse<ApiCourse[]>;

// Transform function to convert ApiCourse to Course
export function transformApiCourse(apiCourse: ApiCourse, additionalData?: unknown): Course {
  // If we have additional data from your sample format, use it
  if (additionalData && typeof additionalData === "object") {
    const data = additionalData as Partial<Course>;
    return {
      id: data.id,
      title: data.title ?? apiCourse.title,
      instructor: data.instructor ?? "Instructor",
      image: data.image ?? null,
      rating: data.rating ?? 0,
      reviews: data.reviews ?? 0,
      price: data.price ?? 0,
      badge: data.badge,
      hours: data.hours,
      lessons: data.lessons,
      students: data.students,
      instructorAvatar: data.instructorAvatar,
    };
  }

  // Default transformation from ApiCourse format
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    instructor: "Instructor", // Will be fetched separately
    image: apiCourse.thumbnail?.secureUrl || apiCourse.thumbnail?.url || null,
    rating: apiCourse.averageRating || 0,
    reviews: apiCourse.ratingCount,
    price: apiCourse.discountPrice || apiCourse.price,
    badge: apiCourse.level,
    students: apiCourse.totalEnrollments,
    instructorId: apiCourse.instructorId,
    skills: apiCourse.skills,
    promoEndDate: apiCourse.promoEndDate,
    createdAt: apiCourse.created,
  };
}
