"use client";

import { useEffect, useState } from "react";
import instructorProfileApi, {
  InstructorProfile,
} from "@/apiRequests/instructor-profile";
import InstructorProfileView from "@/components/instructor-profile-view";

export default function InstructorProfilePage() {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await instructorProfileApi.getMine();
        const data = res?.payload?.data || res?.payload;
        setProfile(data);
      } catch (e: any) {
        setError(e?.payload?.message || "Không có profile giảng viên");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {error || "Bạn chưa có profile giảng viên. Hoàn tất đơn ứng tuyển để tạo profile."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <header>
        <h1 className="text-2xl font-bold">Profile giảng viên</h1>
        <p className="text-sm text-muted-foreground">
          Thông tin được trích xuất tự động từ hồ sơ bạn nộp. Liên hệ admin nếu cần chỉnh sửa.
        </p>
      </header>
      <InstructorProfileView profile={profile} variant="full" />
    </div>
  );
}
