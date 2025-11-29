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
  discountPrice: number;
  promoEndDate: string | null;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: "VI" | "EN";
  categories: any | null;
  skills: Skill[];
  tags: Tag[];
  objectives: string[];
  requirements: string[];
  instructorId: string;
  thumbnail: FileInfo;
  introVideo: FileInfo;
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
  instructor: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  badge?: string;
  hours?: number;
  lectures?: number;
  lessons?: number;
  students?: number;
  instructorAvatar?: string;
  skills?: Skill[];
}

// Course API Response Type
export type CoursesResponse = ApiResponse<ApiCourse[]>;

// Transform function to convert ApiCourse to Course
export function transformApiCourse(apiCourse: ApiCourse, additionalData?: any): Course {
  // If we have additional data from your sample format, use it
  if (additionalData) {
    return {
      id: additionalData.id,
      title: additionalData.title,
      instructor: additionalData.instructor,
      image: additionalData.image,
      rating: additionalData.rating,
      reviews: additionalData.reviews,
      price: additionalData.price,
      badge: additionalData.badge,
      hours: additionalData.hours,
      lessons: additionalData.lessons,
      students: additionalData.students,
      instructorAvatar: additionalData.instructorAvatar,
    };
  }

  // Default transformation from ApiCourse format
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    instructor: "Instructor", // Will be fetched separately
    image: apiCourse.thumbnail.url,
    rating: apiCourse.averageRating || 0,
    reviews: apiCourse.ratingCount,
    price: apiCourse.discountPrice || apiCourse.price,
    badge: apiCourse.level,
    students: apiCourse.totalEnrollments,
    skills: apiCourse.skills,
  };
}