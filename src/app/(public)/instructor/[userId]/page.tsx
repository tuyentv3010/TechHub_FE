"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import instructorProfileApi, {
  InstructorProfile,
} from "@/apiRequests/instructor-profile";
import InstructorProfileView from "@/components/instructor-profile-view";
import CourseCard from "@/components/molecules/CourseCard";
import { useGetAccount } from "@/queries/useAccount";
import { useGetCourses } from "@/queries/useCourse";
import { normalizePersistedMediaUrl } from "@/lib/file-media";

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";

export default function PublicInstructorProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res: any = await instructorProfileApi.getByUserId(userId);
        const data = res?.payload?.data || res?.payload;
        setProfile(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Account info (username + avatar) — instructor profile (CV) has no avatar.
  const { data: accountResponse } = useGetAccount({
    id: userId || "",
    enabled: !!userId,
  });
  const account = accountResponse?.payload?.data;
  const avatarUrl = normalizePersistedMediaUrl(account?.avatar) || DEFAULT_AVATAR;

  // Published courses of this instructor.
  const { data: coursesResponse, isLoading: isLoadingCourses } = useGetCourses({
    instructorId: userId,
    status: "PUBLISHED",
    size: 24,
  });
  const courses = coursesResponse?.transformedData || [];

  const displayName =
    profile?.fullName || account?.username || "Giảng viên";

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  }
  if (!profile && !account) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Không tìm thấy giảng viên
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-20 w-20 rounded-full object-cover border"
          onError={(event) => {
            (event.target as HTMLImageElement).src = DEFAULT_AVATAR;
          }}
        />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Giảng viên
          </p>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {profile?.cvLocation && (
            <p className="text-sm text-muted-foreground">{profile.cvLocation}</p>
          )}
        </div>
      </header>

      {/* Courses of this instructor */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Khóa học của giảng viên
          {courses.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({courses.length})
            </span>
          )}
        </h2>
        {isLoadingCourses ? (
          <p className="text-sm text-muted-foreground">Đang tải khóa học...</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Giảng viên chưa có khóa học nào được xuất bản.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* CV / profile info extracted from the uploaded CV (n8n scan) */}
      {profile && <InstructorProfileView profile={profile} variant="public" />}
    </div>
  );
}
