export interface Course {
  id: string;
  title: string;
  instructor: string;
  price: number;
  image: string;
  rating?: number; // 0 - 5
  reviews?: number; // total number of reviews
  hours?: number; // total hours of content
  lectures?: number; // total lectures
  badge?: string; // e.g., "Bestseller"
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
}
