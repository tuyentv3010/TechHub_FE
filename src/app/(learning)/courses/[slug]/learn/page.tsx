"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetCourseById } from "@/queries/useCourse";
import { extractIdFromSlug, createCourseSlug } from "@/lib/course";
import { useAccountProfile } from "@/queries/useAccount";
import CourseLearningLayout from "@/components/course/CourseLearningLayout";
import CourseOnboardingTour from "@/components/course/CourseOnboardingTour";
import { useToast } from "@/hooks/use-toast";

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slug = params.slug as string;
  const courseId = extractIdFromSlug(slug);

  const { data: courseResponse, isLoading } = useGetCourseById(courseId);
  const { data: profileData, isLoading: isLoadingProfile } = useAccountProfile();
  const course = courseResponse?.payload?.data;
  const user = profileData?.payload?.data;

  const [showTour, setShowTour] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [hasCheckedEnrollment, setHasCheckedEnrollment] = useState(false);

  // Check enrollment status - redirect if not enrolled and not free course
  useEffect(() => {
    // Wait until both course and profile data are loaded
    if (isLoading || isLoadingProfile) return;
    
    // If user is not logged in, redirect to login
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để truy cập khóa học",
        variant: "destructive",
      });
      router.push(`/login?callbackUrl=/courses/${slug}/learn`);
      return;
    }

    // If course loaded, check enrollment
    if (course && !hasCheckedEnrollment) {
      const isEnrolled = course.enrolled === true;
      const isFree = (course.summary?.price === 0 || course.summary?.discountPrice === 0);
      
      // If not enrolled and not free, redirect to course detail page
      if (!isEnrolled && !isFree) {
        toast({
          title: "Chưa đăng ký khóa học",
          description: "Bạn cần mua khóa học này để truy cập nội dung",
          variant: "destructive",
        });
        const courseSlug = createCourseSlug(course.summary?.title || "", courseId);
        router.push(`/courses/${courseSlug}`);
        return;
      }
      
      setHasCheckedEnrollment(true);
    }
  }, [course, user, isLoading, isLoadingProfile, hasCheckedEnrollment, router, toast, slug, courseId]);

  // Load last lesson position from localStorage
  useEffect(() => {
    if (courseId) {
      const savedPosition = localStorage.getItem(`course_position_${courseId}`);
      if (savedPosition) {
        setCurrentLessonIndex(parseInt(savedPosition, 10));
      }
    }
  }, [courseId]);

  // Save lesson position when it changes
  useEffect(() => {
    if (courseId && currentLessonIndex > 0) {
      localStorage.setItem(`course_position_${courseId}`, currentLessonIndex.toString());
    }
  }, [courseId, currentLessonIndex]);

  // Check if user has seen tour before
  useEffect(() => {
    if (course && user) {
      const tourKey = `course_tour_${courseId}_${user.id}`;
      const hasSeenTour = localStorage.getItem(tourKey);
      
      if (!hasSeenTour) {
        setShowTour(true);
      }
    }
  }, [course, user, courseId]);

  const handleTourComplete = () => {
    if (user) {
      const tourKey = `course_tour_${courseId}_${user.id}`;
      localStorage.setItem(tourKey, "true");
      setShowTour(false);
    }
  };

  const handleTourSkip = () => {
    if (user) {
      const tourKey = `course_tour_${courseId}_${user.id}`;
      localStorage.setItem(tourKey, "true");
      setShowTour(false);
    }
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking enrollment
  if (!hasCheckedEnrollment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Không tìm thấy khóa học</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-primary hover:underline"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CourseLearningLayout
        course={course}
        currentLessonIndex={currentLessonIndex}
        onLessonChange={setCurrentLessonIndex}
        onStartTour={handleStartTour}
      />
      
      {showTour && user && (
        <CourseOnboardingTour
          userName={user.name || user.username || "bạn"}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
}
