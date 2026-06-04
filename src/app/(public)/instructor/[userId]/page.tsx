"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import instructorProfileApi from "@/apiRequests/instructor-profile";
import { useGetAccount } from "@/queries/useAccount";
import { useGetCourses } from "@/queries/useCourse";
import { normalizePersistedMediaUrl } from "@/lib/file-media";
import type { InstructorAccount, InstructorProfile } from "@/types/instructor";
import { InstructorProfileView } from "@/components/instructor-profile-view";

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";

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
    size: 24,
  });
  const courses = coursesResponse?.transformedData || [];

  // CV profile (extracted from the uploaded CV via n8n scan).
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setProfileLoading(true);
    (async () => {
      try {
        const res: any = await instructorProfileApi.getByUserId(userId);
        const data = res?.payload?.data || res?.payload || null;
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

  return (
    <main className="min-h-screen bg-background">
      <InstructorProfileView
        account={normalizedAccount}
        profile={(profile ?? {}) as InstructorProfile}
        courses={courses}
        isLoading={isLoading}
      />
    </main>
  );
}
