"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetCourseById } from "@/queries/useCourse";
import { extractIdFromSlug } from "@/lib/course";
import { useAccountProfile } from "@/queries/useAccount";
import CourseLearningLayout from "@/components/course/CourseLearningLayout";
import CourseOnboardingTour from "@/components/course/CourseOnboardingTour";

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const courseId = extractIdFromSlug(slug);

  const { data: courseResponse, isLoading } = useGetCourseById(courseId);
  const { data: profileData } = useAccountProfile();
  const course = courseResponse?.payload?.data;
  const user = profileData?.payload?.data;

  const [showTour, setShowTour] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải khóa học...</p>
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
