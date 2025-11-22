"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Globe,
  Award,
  CheckCircle,
  PlayCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCourseById, useEnrollCourseMutation, useGetSkills, useGetTags } from "@/queries/useCourse";
import { useGetAccount } from "@/queries/useAccount";
import {
  extractIdFromSlug,
  formatCourseLevel,
  formatLanguage,
  formatPrice,
  calculateDiscountPercentage,
  formatDuration,
  formatTagLabel,
} from "@/lib/course";
import { useToast } from "@/hooks/use-toast";
import { 
  useCourseComments, 
  useAddCourseCommentMutation 
} from "@/queries/useCourseComments";
import { CourseCommentsList } from "@/components/course/CourseCommentsList";

export default function CourseDetailPage() {
  const params = useParams();
  const t = useTranslations("Course");
  const { toast } = useToast();
  const slug = params.slug as string;
  const courseId = extractIdFromSlug(slug);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const { data: courseResponse, isLoading, error } = useGetCourseById(courseId);
  const enrollMutation = useEnrollCourseMutation();
  
  // Fetch skills and tags from backend
  const { data: skillsData } = useGetSkills();
  const { data: tagsData } = useGetTags();
  const allSkills = skillsData?.payload?.data ?? [];
  const allTags = tagsData?.payload?.data ?? [];

  const course = courseResponse?.payload?.data;
  const courseSummary = course?.summary;
  const chapters = course?.chapters || [];

  // Transform skills/categories from backend format (could be IDs, names, or objects)
  // Backend may return: skills array (names or objects) OR categories array
  const rawSkillsOrCategories = courseSummary?.skills || courseSummary?.categories || [];
  const rawTags = courseSummary?.tags || [];
  
  // Map to actual skill/tag names by looking up in the fetched data
  const skills = rawSkillsOrCategories.map((item: any) => {
    if (typeof item === 'string') {
      // Could be ID or name, try to find in allSkills
      const found = allSkills.find((s: any) => s.id === item || s.name === item);
      return found?.name || item;
    }
    return item?.name || item;
  }).filter(Boolean);

  const tags = rawTags.map((item: any) => {
    if (typeof item === 'string') {
      // Could be ID or name, try to find in allTags
      const found = allTags.find((t: any) => t.id === item || t.name === item);
      return found?.name || item;
    }
    return item?.name || item;
  }).filter(Boolean);

  // Fetch course comments
  const { data: commentsResponse, isLoading: isLoadingComments } = useCourseComments(
    courseId,
    !!courseId
  );
  const comments = commentsResponse?.payload?.data ?? [];

  // Add course comment mutation
  const addCommentMutation = useAddCourseCommentMutation();

  const handleSubmitComment = (content: string) => {
    if (!courseId) {
      toast({
        title: "Không thể gửi bình luận",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(
      {
        courseId: courseId,
        body: {
          content: content,
          parentId: undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Đã gửi bình luận",
          });
        },
        onError: () => {
          toast({
            title: "Không thể gửi bình luận",
            description: "Vui lòng đăng nhập và thử lại.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSubmitReply = (parentId: string, content: string) => {
    if (!courseId) {
      toast({
        title: "Không thể gửi phản hồi",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(
      {
        courseId: courseId,
        body: {
          content: content,
          parentId: parentId,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Đã gửi phản hồi",
          });
        },
        onError: () => {
          toast({
            title: "Không thể gửi phản hồi",
            description: "Vui lòng đăng nhập và thử lại.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Fetch instructor info
  const { data: instructorResponse } = useGetAccount({
    id: courseSummary?.instructorId || "",
    enabled: !!courseSummary?.instructorId,
  });
  const instructor = instructorResponse?.payload?.data;

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync(courseId);
      toast({
        title: "Đăng ký thành công!",
        description: "Bạn đã đăng ký khóa học thành công.",
      });
      
      // Redirect to learning page
      window.location.href = `/courses/${slug}/learn`;
    } catch (error: any) {
      toast({
        title: "Đăng ký thất bại",
        description: error?.message || "Có lỗi xảy ra khi đăng ký khóa học.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-24">
        <div className="container mx-auto px-4">
          <Skeleton className="h-96 w-full rounded-xl" />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !courseSummary) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-24">
        <div className="container mx-auto px-4">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-12 text-center">
              <p className="text-destructive">
                Không thể tải thông tin khóa học. Vui lòng thử lại sau.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const discountPercentage = courseSummary.discountPrice
    ? calculateDiscountPercentage(courseSummary.price, courseSummary.discountPrice)
    : 0;

  const finalPrice = courseSummary.discountPrice || courseSummary.price;

  return (
    <main className="min-h-screen bg-background pb-20 pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Content */}
            <div className="lg:col-span-2">
              {/* Thumbnail */}
              {courseSummary.thumbnail?.url && (
                <div className="mb-6 overflow-hidden rounded-xl border-4 border-white/20 shadow-2xl">
                  <img
                    src={courseSummary.thumbnail.url}
                    alt={`${courseSummary.title} - Course thumbnail`}
                    className="h-64 w-full object-cover"
                  />
                </div>
              )}
                
              <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
                {courseSummary.title}
              </h1>
              <p className="mb-6 text-lg text-white/90">
                {courseSummary.description}
              </p>

              {/* Stats */}
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {courseSummary.averageRating?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-white/80">
                    ({courseSummary.ratingCount} đánh giá)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{courseSummary.totalEnrollments} học viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{course.totalLessons} bài học</span>
                </div>
                {course.totalEstimatedDurationMinutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{formatDuration(course.totalEstimatedDurationMinutes)}</span>
                  </div>
                )}
              </div>

              {/* Instructor */}
              {instructor && (
                <div className="flex items-center gap-3">
                  {instructor.avatar ? (
                    <img
                      src={instructor.avatar}
                      alt={instructor.username || instructor.name || "Instructor"}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-semibold uppercase text-white">
                      {(instructor.username || instructor.name)?.slice(0, 2).toUpperCase() || "IN"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-white/80">{t("instructor")}</p>
                    <p className="font-semibold">{instructor.username || instructor.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right - Video Preview */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {courseSummary.introVideo?.url ? (
                    <div className="relative aspect-video bg-black">
                      <video
                        src={courseSummary.introVideo.url}
                        controls
                        className="h-full w-full object-contain"
                        poster={courseSummary.thumbnail?.url || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : courseSummary.thumbnail?.url ? (
                    <div className="relative aspect-video">
                      <img
                        src={courseSummary.thumbnail.url}
                        alt={`${courseSummary.title} - Course thumbnail`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <PlayCircle className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                      <PlayCircle className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Price */}
                    <div className="mb-4">
                      {courseSummary.discountPrice ? (
                        <>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-3xl font-bold text-purple-600">
                              {formatPrice(courseSummary.discountPrice)}
                            </span>
                            <Badge variant="destructive" className="text-sm">
                              -{discountPercentage}%
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(courseSummary.price)}
                          </div>
                        </>
                      ) : (
                        <div className="text-3xl font-bold text-purple-600">
                          {formatPrice(courseSummary.price)}
                        </div>
                      )}
                    </div>

                    {/* Enroll Button */}
                    <Button
                      onClick={() => {
                        if (course.enrolled) {
                          window.location.href = `/courses/${slug}/learn`;
                        } else {
                          handleEnroll();
                        }
                      }}
                      disabled={enrollMutation.isPending}
                      className="mb-3 w-full bg-purple-600 py-6 text-lg font-semibold hover:bg-purple-700"
                    >
                      {course.enrolled ? "Vào học ngay" : "Đăng ký ngay"}
                    </Button>

                    {/* Course Info */}
                    <div className="space-y-3 border-t pt-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cấp độ</span>
                        <span className="font-medium">
                          {formatCourseLevel(courseSummary.level)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ngôn ngữ</span>
                        <span className="font-medium">
                          {formatLanguage(courseSummary.language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Số chương</span>
                        <span className="font-medium">{course.totalChapters}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Số bài học</span>
                        <span className="font-medium">{course.totalLessons}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Learning Objectives */}
            {courseSummary.objectives && courseSummary.objectives.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                    <Award className="h-6 w-6 text-purple-600" />
                    {t("whatYouWillLearn")}
                  </h2>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {courseSummary.objectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Course Content (Chapters & Lessons) */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                  {t("courseContent")}
                </h2>
                <div className="space-y-2">
                  {chapters.map((chapter: any, index: number) => {
                    const isExpanded = expandedChapters.has(chapter.id);
                    return (
                      <div
                        key={chapter.id}
                        className="overflow-hidden rounded-lg border"
                      >
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="flex w-full items-center justify-between bg-muted/50 p-4 text-left hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-600 dark:bg-purple-900">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="font-semibold">{chapter.title}</h3>
                              {chapter.description && (
                                <p className="text-sm text-muted-foreground">
                                  {chapter.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>

                        {isExpanded && chapter.lessons && (
                          <div className="border-t bg-background p-4">
                            <ul className="space-y-2">
                              {chapter.lessons.map((lesson: any) => (
                                <li
                                  key={lesson.id}
                                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
                                >
                                  <div className="flex items-center gap-2">
                                    {lesson.contentType === "VIDEO" ? (
                                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="text-sm">{lesson.title}</span>
                                    {lesson.isFree && (
                                      <Badge variant="secondary" className="text-xs">
                                        Miễn phí
                                      </Badge>
                                    )}
                                  </div>
                                  {lesson.estimatedDuration && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatDuration(lesson.estimatedDuration)}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {courseSummary.requirements && courseSummary.requirements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                    {t("requirements")}
                  </h2>
                  <ul className="space-y-2">
                    {courseSummary.requirements.map((requirement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-600" />
                        <span className="text-sm">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {courseSummary.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                    <FileText className="h-6 w-6 text-purple-600" />
                    {t("description")}
                  </h2>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-muted-foreground">
                      {courseSummary.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <CourseCommentsList
              comments={comments}
              isLoading={isLoadingComments}
              isSubmitting={addCommentMutation.isPending}
              onSubmitComment={handleSubmitComment}
              onSubmitReply={handleSubmitReply}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Skills & Tags */}
            {(skills.length > 0 || tags.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  {skills.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-2 font-semibold">Kỹ năng</h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill: string, idx: number) => (
                          <Badge key={`${skill}-${idx}`} variant="secondary">
                            {formatTagLabel(skill)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div>
                      <h3 className="mb-2 font-semibold">Thẻ</h3>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag: string, idx: number) => (
                          <Badge key={`${tag}-${idx}`} variant="outline">
                            #{formatTagLabel(tag)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
