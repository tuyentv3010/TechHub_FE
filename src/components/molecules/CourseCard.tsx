import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, BookOpen, Clock, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { createCourseSlug } from "@/lib/course";

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
}

export interface CourseCardProps {
  course: Course;
}

// Enhanced course card for homepage
const CourseCard = ({ course }: CourseCardProps) => {
  const courseSlug = course.id ? createCourseSlug(course.title, course.id) : "#";
  
  return (
    <Link href={`/courses/${courseSlug}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 relative group cursor-pointer">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Price Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <span className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-bold shadow-md">
            ${course.price.toFixed(2)}
          </span>
        </div>
        
        {/* Category Badge - Bottom Left */}
        {course.badge && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-blue-900 dark:bg-blue-800 text-white px-3 py-1 rounded-md text-sm font-medium">
              {course.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content Area with Gradient Background and Image Overlay */}
      <div className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-6">
        {/* Background Image Overlay - Ảnh nền hiện rõ hơn */}
        <div className="absolute inset-0 opacity-90 dark:opacity-35 bg-gradient-to-br from-purple-100/50 via-blue-100/50 to-pink-100/50 dark:from-purple-900/50 dark:via-blue-900/50 dark:to-pink-900/50">
          <Image
            src="/background/course-pattern.png"
            alt="Course background pattern"
            fill
            className="object-cover object-center mix-blend-overlay"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        </div>
        
        {/* Content with higher z-index */}
        <div className="relative z-10">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(course.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {course.rating} ({formatNumber(course.reviews || 0)})
            </span>
          </div>

          {/* Course Title */}
          <h3 className="font-bold text-xl mb-4 line-clamp-2 text-gray-900 dark:text-white leading-tight">
            {course.title}
          </h3>

          {/* Course Stats */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              {course.lessons && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Lesson {course.lessons}</span>
                </div>
              )}
              {course.hours && (
                <>
                  {course.lessons && <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.hours}h {course.hours > 1 ? '30m' : ''}</span>
                  </div>
                </>
              )}
              {course.students && (
                <>
                  {(course.lessons || course.hours) && <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Students {course.students}+</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instructor and Enroll Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src={course.instructorAvatar || "/avatars/default-instructor.jpg"}
                  alt={course.instructor}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {course.instructor}
              </span>
            </div>
            
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              Enroll →
            </Button>
          </div>
        </div>

        {/* Logo Placeholder Area - Bottom gradient overlay for logo */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/80 to-transparent dark:from-gray-900/80 pointer-events-none z-20"></div>
      </div>
    </div>
    </Link>
  );
};

export default CourseCard;
