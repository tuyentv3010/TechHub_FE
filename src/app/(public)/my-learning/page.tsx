"use client";

import { useState } from "react";
import { useMyEnrollments } from "@/queries/useMyLearning";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, CheckCircle, PlayCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyLearningPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useMyEnrollments(statusFilter);
    console.log("asdasdas das dasd " , data);
  const enrollments = data?.payload?.data || [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      ENROLLED: { label: "Đang học", variant: "default" },
      IN_PROGRESS: { label: "Đang tiến hành", variant: "secondary" },
      COMPLETED: { label: "Hoàn thành", variant: "outline" },
      DROPPED: { label: "Đã bỏ", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-24">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-24">
        <div className="container mx-auto px-4">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-12 text-center">
              <p className="text-destructive">
                Không thể tải danh sách khóa học. Vui lòng đăng nhập và thử lại.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20 pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Khóa học của tôi</h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi tiến độ học tập của bạn
          </p>
        </div>

        {/* Filters */}
        <Tabs defaultValue="all" className="mb-8" onValueChange={(value) => {
          setStatusFilter(value === "all" ? undefined : value.toUpperCase());
        }}>
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="enrolled">Đang học</TabsTrigger>
            <TabsTrigger value="in_progress">Tiến hành</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
            <TabsTrigger value="dropped">Đã bỏ</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Course Grid */}
        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Chưa có khóa học nào</h3>
              <p className="text-muted-foreground mb-6">
                Bạn chưa đăng ký khóa học nào. Khám phá các khóa học và bắt đầu học ngay!
              </p>
              <Button asChild>
                <Link href="/courses">Khám phá khóa học</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Tìm thấy {enrollments.length} khóa học
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment: any) => (
                <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Course Image Placeholder */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <PlayCircle className="h-16 w-16 text-white opacity-80" />
                    </div>

                    <div className="p-6">
                      {/* Course Title */}
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">
                        {enrollment.courseName || "Untitled Course"}
                      </h3>

                      {/* Status Badge */}
                      <div className="mb-4">
                        {getStatusBadge(enrollment.status)}
                      </div>

                      {/* Enrollment Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Calendar className="h-4 w-4" />
                        <span>Đăng ký: {formatDate(enrollment.enrolledAt)}</span>
                      </div>

                      {/* Completion Date (if completed) */}
                      {enrollment.completedAt && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                          <CheckCircle className="h-4 w-4" />
                          <span>Hoàn thành: {formatDate(enrollment.completedAt)}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button asChild className="w-full" variant={enrollment.status === 'COMPLETED' ? 'outline' : 'default'}>
                        <Link href={`/courses/${enrollment.courseId}/learn`}>
                          {enrollment.status === 'COMPLETED' ? 'Xem lại' : 'Tiếp tục học'}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
