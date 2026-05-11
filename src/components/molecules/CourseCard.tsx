import { BusinessCourseCard } from "@/components/common/business-course-card";
import { createCourseSlug } from "@/lib/course";
import { useGetCourseById } from "@/queries/useCourse";
import { Course } from "@/types/course";
import { useTranslations } from "next-intl";

export interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const t = useTranslations("courses");
  const courseSlug = course.id ? createCourseSlug(course.title, course.id) : "#";
  const { data: courseDetailResponse } = useGetCourseById(course.id || "");
  const courseDetail = courseDetailResponse?.payload?.data;
  const isEnrolled = courseDetail?.enrolled || false;
  const finalPrice =
    courseDetail?.summary?.discountPrice ??
    courseDetail?.summary?.price ??
    course.price ??
    0;
  const isFree = finalPrice === 0;

  const lessons = courseDetail?.totalLessons || course.lessons || 0;
  const hours = courseDetail?.totalEstimatedDurationMinutes
    ? Math.round((courseDetail.totalEstimatedDurationMinutes / 60) * 10) / 10
    : course.hours || 0;

  return (
    <BusinessCourseCard
      course={{
        href: `/courses/${courseSlug}`,
        title: course.title,
        image: course.image || "/courses/Thumbnail.png",
        instructor: course.instructor,
        instructorAvatar: course.instructorAvatar,
        rating: course.rating ?? 0,
        reviews: course.reviews || 0,
        priceLabel: isFree ? t("free") : `${finalPrice.toFixed(2)} USD`,
        badge: course.badge,
        lessons,
        hours,
        students: course.students,
        ctaLabel: isEnrolled
          ? t("enterToLearn")
          : isFree
            ? t("startLearning")
            : t("enroll"),
      }}
    />
  );
};

export default CourseCard;
