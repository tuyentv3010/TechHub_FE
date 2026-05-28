"use client";

import type { InstructorProfile } from "@/apiRequests/instructor-profile";

type Variant = "full" | "public";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3">
      <div className="w-44 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{String(value)}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

function JsonList({ data }: { data: any }) {
  if (!data) return <p className="text-xs text-muted-foreground">Không có</p>;
  if (Array.isArray(data) && data.every((x) => typeof x === "string")) {
    return (
      <div className="flex flex-wrap gap-2">
        {data.map((s, i) => (
          <span key={i} className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
            {s}
          </span>
        ))}
      </div>
    );
  }
  return (
    <pre className="max-h-[260px] overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function InstructorProfileView({
  profile,
  variant = "full",
}: {
  profile: InstructorProfile;
  variant?: Variant;
}) {
  const showCccd = variant === "full";

  return (
    <div className="space-y-4">
      <Section title="Thông tin cá nhân">
        <Row label="Họ tên" value={profile.fullName} />
        <Row label="Email" value={profile.cvEmail} />
        <Row label="Số điện thoại" value={profile.cvPhone} />
        <Row label="Vị trí" value={profile.cvLocation} />
        <Row label="LinkedIn" value={profile.linkedinUrl} />
        <Row label="GitHub" value={profile.githubUrl} />
        <Row label="Portfolio" value={profile.portfolioUrl} />
        <Row label="Số năm KN" value={profile.yearsOfExperience} />
      </Section>

      {showCccd && (
        <Section title="CCCD">
          <Row label="Số CCCD" value={profile.idNumber} />
          <Row label="Ngày sinh" value={profile.dateOfBirth} />
          <Row label="Giới tính" value={profile.gender} />
          <Row label="Quốc tịch" value={profile.nationality} />
          <Row label="Quê quán" value={profile.placeOfOrigin} />
          <Row label="Nơi thường trú" value={profile.placeOfResidence} />
          <Row label="Ngày cấp" value={profile.cccdIssueDate} />
          <Row label="Nơi cấp" value={profile.cccdIssuePlace} />
          <Row label="Đặc điểm nhận dạng" value={profile.identifyingFeatures} />
        </Section>
      )}

      {profile.cvSummary && (
        <Section title="Giới thiệu bản thân">
          <p className="text-sm leading-relaxed">{profile.cvSummary}</p>
        </Section>
      )}

      <Section title="Kỹ năng">
        <JsonList data={profile.skills} />
      </Section>

      <Section title="Ngôn ngữ">
        <JsonList data={profile.languages} />
      </Section>

      <Section title="Học vấn">
        <JsonList data={profile.education} />
      </Section>

      <Section title="Kinh nghiệm làm việc">
        <JsonList data={profile.experience} />
      </Section>

      <Section title="Dự án">
        <JsonList data={profile.projects} />
      </Section>

      <Section title="Chứng chỉ (từ CV)">
        <JsonList data={profile.cvCertifications} />
      </Section>

      <Section title="Chứng chỉ đã upload">
        <JsonList data={profile.certificates} />
      </Section>
    </div>
  );
}
