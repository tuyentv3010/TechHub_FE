"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import instructorProfileApi from "@/apiRequests/instructor-profile";
import { useGetAccount } from "@/queries/useAccount";
import { useGetCourses } from "@/queries/useCourse";
import { normalizePersistedMediaUrl } from "@/lib/file-media";
import type { InstructorAccount, InstructorProfile } from "@/types/instructor";
import type { Course } from "@/types/course";
import { PublicInstructorProfile } from "@/components/instructor/PublicInstructorProfile";

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";
type InstructorProfileResponse = {
  payload?: {
    data?: InstructorProfile | null;
  } | InstructorProfile | null;
};

const COVER_IMAGES = [
  "/backgroundAvatar/1-14.jpg",
  "/backgroundAvatar/2-15.jpg",
  "/backgroundAvatar/3-13.jpg",
  "/backgroundAvatar/961e70fa08de66a153d72aa05fbd61ad.jpg",
  "/backgroundAvatar/anh-bien-12.webp",
  "/backgroundAvatar/hinh-nen-bien-2.png",
  "/backgroundAvatar/images.jpg",
];

function pickCoverImage(seed?: string) {
  if (!seed) return COVER_IMAGES[0];

  const hash = Array.from(seed).reduce(
    (value, char) => (value * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );
  return COVER_IMAGES[hash % COVER_IMAGES.length];
}

export default function PublicInstructorProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;

  // Account info (username + avatar) — instructor profile (CV) has no avatar.
  const { data: accountResponse, isLoading: accountLoading } = useGetAccount({
    id: userId || "",
    enabled: !!userId,
  });
  const account = accountResponse?.payload?.data;

  // Published courses of this instructor.
  const { data: coursesResponse, isLoading: coursesLoading } = useGetCourses({
    instructorId: userId,
    status: "PUBLISHED",
    size: 100,
  });
  const courses = useMemo<Course[]>(
    () =>
      (coursesResponse?.data || [])
        .filter((course) => course.instructorId === userId)
        .map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description ?? "",
          instructor: account?.username ?? "Instructor",
          instructorAvatar: normalizePersistedMediaUrl(account?.avatar) || undefined,
          image: normalizePersistedMediaUrl(course.thumbnail?.secureUrl || course.thumbnail?.url),
          rating: course.averageRating || 0,
          reviews: course.ratingCount,
          price: course.discountPrice ?? course.price ?? 0,
          originalPrice: course.price ?? 0,
          currency: course.currency ?? undefined,
          badge: course.level,
          level: course.level,
          language: course.language,
          students: course.totalEnrollments,
          instructorId: course.instructorId,
          skills: course.skills,
          promoEndDate: course.promoEndDate,
          createdAt: course.created,
        })),
    [account?.avatar, account?.username, coursesResponse?.data, userId],
  );

  // CV profile (extracted from the uploaded CV via n8n scan).
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setProfileLoading(true);
    (async () => {
      try {
        const res = await instructorProfileApi.getByUserId(userId) as InstructorProfileResponse;
        const payload = res?.payload;
        const data: InstructorProfile | null =
          payload && typeof payload === "object" && "data" in payload
            ? payload.data ?? null
            : (payload as InstructorProfile | null) ?? null;
        if (active) setProfile(data);
      } catch {
        if (active) setProfile(null);
      } finally {
        if (active) setProfileLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const normalizedAccount: InstructorAccount = useMemo(
    () => ({
      username: account?.username ?? "",
      email: account?.email ?? null,
      avatarUrl: normalizePersistedMediaUrl(account?.avatar) || DEFAULT_AVATAR,
    }),
    [account],
  );

  const isLoading = accountLoading || profileLoading || coursesLoading;
  const coverImageUrl = useMemo(() => pickCoverImage(userId), [userId]);

  return (
    <main className="min-h-screen bg-background">
      <PublicInstructorProfile
        account={normalizedAccount}
        profile={(profile ?? {}) as InstructorProfile}
        courses={courses}
        isLoading={isLoading}
        coverImageUrl={coverImageUrl}
      />
    </main>
  );
}
