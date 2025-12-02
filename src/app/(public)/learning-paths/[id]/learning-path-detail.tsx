"use client";

import { useTranslations } from "next-intl";
import { useGetLearningPathById } from "@/queries/useLearningPath";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Calendar,
  User,
  Target,
  Network,
  List,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { formatDateTimeToLocaleString } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import courseApiRequest from "@/apiRequests/course";
import { CourseItemResType } from "@/schemaValidations/course.schema";
import { CourseInPathType } from "@/schemaValidations/learning-path.schema";
import PathViewer from "./path-viewer";
import envConfig from "@/config";
import { toast } from "sonner";

interface LearningPathDetailProps {
  pathId: string;
}

export default function LearningPathDetail({ pathId }: LearningPathDetailProps) {
  const t = useTranslations("LearningPathDetail");
  const { data, isLoading } = useGetLearningPathById(pathId);
  const [courseDetailsMap, setCourseDetailsMap] = useState<Map<string, CourseItemResType>>(new Map());
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [viewMode, setViewMode] = useState<"diagram" | "list">("diagram");
  const [copied, setCopied] = useState(false);

  // Copy link to clipboard
  const handleCopyLink = async () => {
    const link = `${envConfig.NEXT_PUBLIC_URL}/learning-paths/${pathId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Fetch course details
  useEffect(() => {
    if (data?.payload?.data?.courses) {
      const courses = data.payload.data.courses;
      
      const fetchCourseDetails = async () => {
        setLoadingCourses(true);
        const detailsMap = new Map<string, CourseItemResType>();
        
        await Promise.all(
          courses.map(async (course: CourseInPathType) => {
            try {
              const response = await courseApiRequest.getCourseById(course.courseId);
              if (response.payload?.data?.summary) {
                detailsMap.set(course.courseId, response.payload.data.summary);
              }
            } catch (error) {
              console.error(`Failed to fetch course ${course.courseId}:`, error);
            }
          })
        );
        
        setCourseDetailsMap(detailsMap);
        setLoadingCourses(false);
      };
      
      fetchCourseDetails();
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const path = data?.payload?.data;

  if (!path) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">{t("notFound")}</h2>
        <p className="text-muted-foreground mt-2">{t("notFoundDescription")}</p>
        <Link href="/learning-paths">
          <Button className="mt-4">{t("backToList")}</Button>
        </Link>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/learning-paths" className="hover:text-primary">
            {t("learningPaths")}
          </Link>
          <span>/</span>
          <span>{path.title}</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={getLevelColor(path.level || "")}>
              {t(`level.${path.level || "undefined"}`)}
            </Badge>
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {path.courses?.length || 0} {t("courses")}
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {path.estimatedDuration || 0} {t("hours")}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">{path.title}</h1>
          
          {path.description && (
            <p className="text-xl text-muted-foreground">{path.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Skills Section */}
          {path.skills && path.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t("skillsYouWillLearn")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {path.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-sm py-2 px-4">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Courses Section with Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t("coursesInPath")}
                  </CardTitle>
                  <CardDescription>
                    {path.courses?.length || 0} {t("coursesTotal")}
                  </CardDescription>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "diagram" | "list")} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="diagram" className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      {t("diagramView")}
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      {t("listView")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "diagram" ? (
                <PathViewer pathId={pathId} />
              ) : loadingCourses ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg animate-pulse">
                      <div className="flex-shrink-0 w-48 h-28 bg-muted rounded-md" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : path.courses && path.courses.length > 0 ? (
                <div className="space-y-4">
                  {path.courses
                    .sort((a: CourseInPathType, b: CourseInPathType) => a.order - b.order)
                    .map((course: CourseInPathType, idx: number) => {
                      const courseDetail = courseDetailsMap.get(course.courseId);
                      const thumbnail = courseDetail?.thumbnail?.secureUrl || courseDetail?.thumbnail?.url;
                      
                      return (
                        <Link 
                          key={course.courseId}
                          href={`/courses/${course.courseId}`}
                          className="block"
                        >
                          <div className="flex gap-4 p-4 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all group">
                            {/* Order Badge */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                              {idx + 1}
                            </div>
                            
                            {/* Thumbnail */}
                            <div className="flex-shrink-0 w-48 h-28 rounded-md overflow-hidden bg-muted">
                              {thumbnail ? (
                                <Image
                                  src={thumbnail}
                                  alt={courseDetail?.title || course.title || "Course"}
                                  width={192}
                                  height={112}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 space-y-2">
                              <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                {courseDetail?.title || course.title || `Course ${idx + 1}`}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {courseDetail?.description || course.description || t("noDescription")}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {course.isOptional === "Y" && (
                                  <Badge variant="outline" className="text-xs">
                                    {t("optional")}
                                  </Badge>
                                )}
                                {courseDetail?.level && (
                                  <Badge variant="secondary" className="text-xs">
                                    {courseDetail.level}
                                  </Badge>
                                )}
                                {courseDetail?.totalEnrollments !== undefined && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {courseDetail.totalEnrollments} students
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex-shrink-0 flex items-center">
                              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("noCoursesYet")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("pathInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("duration")}</p>
                  <p className="text-muted-foreground">
                    {path.estimatedDuration || 0} {t("hours")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("level")}</p>
                  <p className="text-muted-foreground">
                    {t(`level.${path.level || "undefined"}`)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("courses")}</p>
                  <p className="text-muted-foreground">
                    {path.courses?.length || 0} {t("coursesTotal")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("created")}</p>
                  <p className="text-muted-foreground">
                    {formatDateTimeToLocaleString(path.created)}
                  </p>
                </div>
              </div>

              <Separator />

              <Button className="w-full" size="lg">
                {t("startLearning")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Share Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("shareThisPath")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("shareDescription")}
              </p>
              <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t("linkCopied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {t("copyLink")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
