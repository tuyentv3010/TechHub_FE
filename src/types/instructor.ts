// src/types/instructor.ts
// Loosely-typed shapes extracted from CV scans — every field is optional.

export interface InstructorAccount {
  username: string;
  email?: string | null;
  /** Already normalized in the page; falls back to "/avatars/default-avatar.svg". */
  avatarUrl: string;
}

export interface CvExperience {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface CvEducation {
  degree?: string | null;
  school?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface CvProject {
  name?: string | null;
  role?: string | null;
  description?: string | null;
  url?: string | null;
  tags?: string[] | null;
}

export interface CvCertification {
  name?: string | null;
  issuer?: string | null;
  date?: string | null;
  credentialUrl?: string | null;
}

export interface InstructorProfile {
  fullName?: string | null;
  cvSummary?: string | null;
  cvLocation?: string | null;
  cvEmail?: string | null;
  cvPhone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  yearsOfExperience?: number | null;
  // skills/languages may arrive as string[] OR a JSON string — normalize with toStringArray().
  skills?: string[] | string | null;
  languages?: string[] | string | null;
  experience?: CvExperience[] | null;
  education?: CvEducation[] | null;
  projects?: CvProject[] | null;
  cvCertifications?: CvCertification[] | null;
  certificates?: CvCertification[] | null;
}

/** Defensive: skills/languages can be a real array, a JSON string, or null. */
export function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return item;
        // Languages often arrive as { name, level }.
        if (typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const name = obj.name ?? obj.label ?? obj.title;
          const level = obj.level ?? obj.proficiency;
          if (name && level) return `${name} · ${level}`;
          if (name) return String(name);
          return "";
        }
        return String(item);
      })
      .filter(Boolean);
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return toStringArray(parsed);
    } catch {
      /* not JSON — fall through to comma-split */
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export function compactNumber(n: number, locale = "vi-VN"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
