import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, BookOpen, Clock, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { createCourseSlug } from "@/lib/course";
import { Course, Skill } from "@/types/course";
import { useGetCourseById } from "@/queries/useCourse";
import { useTranslations } from "next-intl";

export interface CourseCardProps {
  course: Course;
}

// Enhanced course card for homepage
const CourseCard = ({ course }: CourseCardProps) => {
  const t = useTranslations("courses");
  const courseSlug = course.id ? createCourseSlug(course.title, course.id) : "#";
  
  // Fetch detailed course information to get lessons count and duration
  const { data: courseDetailResponse } = useGetCourseById(course.id || "");
  const courseDetail = courseDetailResponse?.payload?.data;
  
  // Check if user is enrolled
  const isEnrolled = courseDetail?.enrolled || false;
  
  // Get final price (discountPrice or price)
  const finalPrice = courseDetail?.summary?.discountPrice ?? courseDetail?.summary?.price ?? course.price ?? 0;
  const isFree = finalPrice === 0;
  
  // Enhanced course data with fetched details
  const enhancedCourse = {
    ...course,
    lessons: courseDetail?.totalLessons || course.lessons || 0,
    hours: courseDetail?.totalEstimatedDurationMinutes 
      ? Math.round(courseDetail.totalEstimatedDurationMinutes / 60 * 10) / 10 // Round to 1 decimal
      : course.hours || 0,
    skills: courseDetail?.summary?.skills || course.skills || [],
    price: finalPrice,
  };

  
  return (
    <Link href={`/courses/${courseSlug}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 relative group cursor-pointer">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={enhancedCourse.image}
          alt={enhancedCourse.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Price Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-md ${
            isFree 
              ? 'bg-[#3dcbb1] text-white' 
              : 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400'
          }`}>
            {isFree ? t("free") : `${enhancedCourse.price.toFixed(2)} USD`}
          </span>
        </div>
        
        {/* Category Badge - Bottom Left */}
        {enhancedCourse.badge && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-blue-900 dark:bg-blue-800 text-white px-3 py-1 rounded-md text-sm font-medium">
              {enhancedCourse.badge}
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
                  i < Math.floor(enhancedCourse.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {enhancedCourse.rating} ({formatNumber(enhancedCourse.reviews || 0)})
            </span>
          </div>

          {/* Course Title */}
          <h3 className="font-bold text-xl text-gray-900 dark:text-white leading-tight overflow-hidden" 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
                hyphens: 'auto',
                minHeight: '3.5rem', // Fixed height for 2 lines
                maxHeight: '3.5rem'
              }}>
            {enhancedCourse.title}
          </h3>

          {/* Course Stats */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              {enhancedCourse.lessons > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{enhancedCourse.lessons} bài học</span>
                </div>
              )}
              {enhancedCourse.hours > 0 && (
                <>
                  {enhancedCourse.lessons > 0 && <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{enhancedCourse.hours}h</span>
                  </div>
                </>
              )}
              {enhancedCourse.students && enhancedCourse.students > 0 && (
                <>
                  {(enhancedCourse.lessons > 0 || enhancedCourse.hours > 0) && <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{enhancedCourse.students} học viên</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {enhancedCourse.skills && enhancedCourse.skills.length > 0 && (
            <div className="h-12"> {/* Fixed height container */}
              <div className="flex flex-wrap gap-1.5 overflow-hidden h-8"> {/* Fixed height for skills */}
                {enhancedCourse.skills.slice(0, 3).map((skill: Skill, index: number) => (
                  <div 
                    key={skill.id || index}
                    className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-xs whitespace-nowrap"
                  >
                    {skill.thumbnail && (
                      <div className="relative w-3 h-3 flex-shrink-0">
                        <Image
                          src={skill.thumbnail}
                          alt={skill.name}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                    )}
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[60px]">
                      {skill.name}
                    </span>
                  </div>
                ))}
                {enhancedCourse.skills.length > 3 && (
                  <div className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    +{enhancedCourse.skills.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructor and Enroll Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src={enhancedCourse.instructorAvatar || "/avatars/default-instructor.jpg"}
                  alt={enhancedCourse.instructor}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {enhancedCourse.instructor}
              </span>
            </div>
            
            <Button 
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                isEnrolled 
                  ? 'bg-[#3dcbb1] hover:bg-[#35b5a0] text-white'
                  : isFree
                    ? 'bg-[#3dcbb1] hover:bg-[#35b5a0] text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isEnrolled 
                ? t("enterToLearn") 
                : isFree 
                  ? t("startLearning")
                  : t("enroll")
              } →
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
