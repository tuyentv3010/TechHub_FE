import Image from "next/image";
import { Course } from "@/types/home";
import Badge from "@/components/atoms/Badge";
import StarRating from "@/components/atoms/StarRating";
import { formatNumber } from "@/lib/format";

export interface CourseCardProps {
  course: Course;
}

// Simple presentational card for a course
const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <div className="relative bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      {course.badge && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant={course.badge === 'Bestseller' ? 'success' : 'default'}>{course.badge}</Badge>
        </div>
      )}
      <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center">
        <Image src={course.image} alt={course.title} fill className="object-contain p-6 group-hover:scale-105 transition-transform" />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold min-h-[2.5rem] overflow-hidden line-clamp-2">{course.title}</h3>
        <p className="text-xs text-gray-500">{course.instructor}</p>
        {typeof course.rating === 'number' && (
          <div className="flex items-center gap-2 text-[11px]">
            <StarRating value={course.rating} />
            {course.reviews && <span className="text-gray-500">({formatNumber(course.reviews)})</span>}
          </div>
        )}
        <p className="text-sm font-bold">${course.price.toFixed(2)}</p>
        {(course.hours || course.lectures) && (
          <p className="text-[11px] text-gray-500">{course.hours ? `${course.hours}h` : ''}{course.hours && course.lectures ? ' • ' : ''}{course.lectures ? `${course.lectures} lectures` : ''}</p>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
