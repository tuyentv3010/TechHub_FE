import Image from "next/image";
import Badge from "@/components/atoms/Badge";
import StarRating from "@/components/atoms/StarRating";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { formatNumber } from "@/lib/utils";

export interface Course {
  title: string;
  instructor: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  badge?: string;
  hours?: number;
  lectures?: number;
}

export interface CourseCardProps {
  course: Course;
}

// Enhanced course card for homepage
const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border dark:border-gray-700">
      <div className="relative h-48">
        {course.badge && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant={course.badge === 'Bestseller' ? 'success' : 'default'}>{course.badge}</Badge>
          </div>
        )}
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">{course.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{course.instructor}</p>
        
        {typeof course.rating === 'number' && (
          <div className="flex items-center gap-2 mb-3">
            <StarRating value={course.rating} />
            {course.reviews && <span className="text-sm text-gray-500 dark:text-gray-400">({formatNumber(course.reviews)})</span>}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">${course.price.toFixed(2)}</span>
          </div>
          <PrimaryButton size="sm">Enroll Now</PrimaryButton>
        </div>
        
        {(course.hours || course.lectures) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{course.hours ? `${course.hours}h` : ''}{course.hours && course.lectures ? ' • ' : ''}{course.lectures ? `${course.lectures} lectures` : ''}</p>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
