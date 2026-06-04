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
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

const EMPTY = <p className="text-xs text-muted-foreground">Không có</p>;

function isEmptyValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined || data === "") return [];
  return [data];
}

// Humanize a camelCase / snake_case key into a readable label.
function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function ScalarValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string" || typeof item === "number")) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, idx) => (
            <span key={idx} className="rounded bg-muted px-2 py-0.5 text-xs">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        {value.map((item, idx) => (
          <ObjectCard key={idx} obj={item} />
        ))}
      </div>
    );
  }
  if (value && typeof value === "object") {
    return <ObjectCard obj={value} />;
  }
  return <span className="text-sm text-foreground">{String(value)}</span>;
}

// Render a single object as label/value rows. Strings/numbers render inline.
function ObjectCard({ obj }: { obj: any }) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") {
    return <p className="text-sm leading-relaxed">{String(obj)}</p>;
  }

  const entries = Object.entries(obj).filter(([, value]) => !isEmptyValue(value));
  if (entries.length === 0) return null;

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <div className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {humanizeKey(key)}
            </div>
            <div className="min-w-0 flex-1">
              <ScalarValue value={value} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chips for a plain string list (skills, etc.).
function Chips({ data }: { data: any }) {
  const items = toArray(data).filter((item) => !isEmptyValue(item));
  if (items.length === 0) return EMPTY;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <span key={idx} className="rounded bg-muted px-2 py-1 text-xs">
          {typeof item === "string" ? item : item?.name || JSON.stringify(item)}
        </span>
      ))}
    </div>
  );
}

// Languages: render "name — level" rows.
function LanguageList({ data }: { data: any }) {
  const items = toArray(data).filter((item) => !isEmptyValue(item));
  if (items.length === 0) return EMPTY;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => {
        const name = typeof item === "string" ? item : item?.name;
        const level = typeof item === "object" ? item?.level : undefined;
        return (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs"
          >
            <span className="font-medium text-foreground">{name}</span>
            {level && <span className="text-muted-foreground">· {level}</span>}
          </span>
        );
      })}
    </div>
  );
}

// Generic list of objects (education, experience, projects, certifications).
function ObjectList({ data }: { data: any }) {
  const items = toArray(data).filter((item) => !isEmptyValue(item));
  if (items.length === 0) return EMPTY;

  // A list of plain strings -> chips.
  if (items.every((item) => typeof item === "string" || typeof item === "number")) {
    return <Chips data={items} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <ObjectCard key={idx} obj={item} />
      ))}
    </div>
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

      {!isEmptyValue(profile.skills) && (
        <Section title="Kỹ năng">
          <Chips data={profile.skills} />
        </Section>
      )}

      {!isEmptyValue(profile.languages) && (
        <Section title="Ngôn ngữ">
          <LanguageList data={profile.languages} />
        </Section>
      )}

      {!isEmptyValue(profile.education) && (
        <Section title="Học vấn">
          <ObjectList data={profile.education} />
        </Section>
      )}

      {!isEmptyValue(profile.experience) && (
        <Section title="Kinh nghiệm làm việc">
          <ObjectList data={profile.experience} />
        </Section>
      )}

      {!isEmptyValue(profile.projects) && (
        <Section title="Dự án">
          <ObjectList data={profile.projects} />
        </Section>
      )}

      {!isEmptyValue(profile.cvCertifications) && (
        <Section title="Chứng chỉ (từ CV)">
          <ObjectList data={profile.cvCertifications} />
        </Section>
      )}

      {!isEmptyValue(profile.certificates) && (
        <Section title="Chứng chỉ đã upload">
          <ObjectList data={profile.certificates} />
        </Section>
      )}
    </div>
  );
}
