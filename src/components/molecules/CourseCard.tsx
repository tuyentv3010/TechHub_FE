import { BusinessCourseCard } from "@/components/common/business-course-card";
import {
  calculateDiscountPercentage,
  createCourseSlug,
  formatPrice,
} from "@/lib/course";
import { useGetCourseById } from "@/queries/useCourse";
import { Course } from "@/types/course";
import { useTranslations } from "next-intl";

export interface CourseCardProps {
  course: Course;
  variant?: "default" | "showcase";
}

const BESTSELLER_STUDENTS = 500;
const BESTSELLER_REVIEWS = 100;
const NEW_DAYS_WINDOW = 30;

function isWithinDays(value: string | undefined, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const diffMs = Date.now() - date.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

function isFutureDate(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

const CourseCard = ({ course, variant = "default" }: CourseCardProps) => {
  const t = useTranslations("courses");
  const courseSlug = course.id ? createCourseSlug(course.title, course.id) : "#";
  const { data: courseDetailResponse } = useGetCourseById(course.id || "");
  const courseDetail = courseDetailResponse?.payload?.data;
  const isEnrolled = courseDetail?.enrolled || false;

  const originalPrice =
    courseDetail?.summary?.price ?? course.originalPrice ?? course.price ?? 0;
  const discountPrice =
    courseDetail?.summary?.discountPrice ?? course.price ?? 0;
  const finalPrice =
    discountPrice && discountPrice > 0 && discountPrice < originalPrice
      ? discountPrice
      : originalPrice;
  const isFree = finalPrice === 0;
  const discountPercent =
    !isFree && originalPrice > 0 && finalPrice < originalPrice
      ? calculateDiscountPercentage(originalPrice, finalPrice)
      : 0;

  const currency = courseDetail?.summary?.currency || course.currency;
  const currencyLabel = (currency || "VND").toUpperCase();
  const description =
    courseDetail?.summary?.description ?? course.description ?? "";
  const lessons = courseDetail?.totalLessons || course.lessons || 0;
  const hours = courseDetail?.totalEstimatedDurationMinutes
    ? Math.round((courseDetail.totalEstimatedDurationMinutes / 60) * 10) / 10
    : course.hours || 0;
  const students = courseDetail?.totalEnrollments ?? course.students ?? 0;
  const reviews = courseDetail?.ratingCount ?? course.reviews ?? 0;
  const skills = courseDetail?.skills ?? course.skills ?? [];
  const level = courseDetail?.level ?? course.level;
  const language = courseDetail?.language ?? course.language;
  const promoEndDate = isFutureDate(courseDetail?.promoEndDate)
    ? courseDetail?.promoEndDate
    : isFutureDate(course.promoEndDate)
      ? course.promoEndDate
      : null;
  const isBestseller =
    students >= BESTSELLER_STUDENTS || reviews >= BESTSELLER_REVIEWS;
  const isNew = isWithinDays(course.createdAt, NEW_DAYS_WINDOW);

  return (
    <BusinessCourseCard
      variant={variant}
      course={{
        href: `/courses/${courseSlug}`,
        title: course.title,
        description,
        image: course.image || null,
        instructor: course.instructor,
        instructorAvatar: course.instructorAvatar,
        instructorVerified: true,
        rating: course.rating ?? 0,
        reviews,
        priceLabel: isFree ? t("free") : formatPrice(finalPrice, currency),
        originalPriceLabel:
          discountPercent > 0 ? formatPrice(originalPrice, currency) : null,
        discountPercent,
        currencyLabel,
        badge: course.badge,
        level,
        language,
        lessons,
        hours,
        students,
        skills,
        isBestseller,
        isNew,
        isFree,
        isEnrolled,
        promoEndDate,
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
