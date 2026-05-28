"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import instructorProfileApi, {
  InstructorProfile,
} from "@/apiRequests/instructor-profile";
import InstructorProfileView from "@/components/instructor-profile-view";

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

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  if (!profile) return <div className="p-6 text-sm text-muted-foreground">Không tìm thấy giảng viên</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <header>
        <h1 className="text-2xl font-bold">{profile.fullName || "Giảng viên"}</h1>
        {profile.cvLocation && (
          <p className="text-sm text-muted-foreground">{profile.cvLocation}</p>
        )}
      </header>
      <InstructorProfileView profile={profile} variant="public" />
    </div>
  );
}
