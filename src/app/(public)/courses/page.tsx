import { Metadata } from "next";
import { cookies } from "next/headers";
import envConfig from "@/config";
import CoursesClient from "./CoursesClient";

export const metadata: Metadata = {
  title: "Khóa học - TechHub",
  description: "Khám phá các khóa học công nghệ chất lượng cao. Học lập trình, thiết kế, và nhiều kỹ năng IT khác.",
  openGraph: {
    title: "Khóa học - TechHub",
    description: "Khám phá các khóa học công nghệ chất lượng cao. Học lập trình, thiết kế, và nhiều kỹ năng IT khác.",
    type: "website",
  },
};

async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

async function getCourses(accessToken?: string) {
  const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/courses?page=0&size=12`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers,
    });

    if (!res.ok) {
      console.error("[Courses SSR] Failed to fetch courses:", res.status);
      return { data: [], pagination: null };
    }

    const json = await res.json();

    return {
      data: json.data ?? [],
      pagination: json.pagination ?? null,
    };
  } catch (error) {
    console.error("[Courses SSR] Error fetching courses:", error);
    return { data: [], pagination: null };
  }
}

async function getSkills(accessToken?: string) {
  const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/courses/skills`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers,
    });

    if (!res.ok) {
      console.error("[Courses SSR] Failed to fetch skills:", res.status);
      return [];
    }

    const json = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error("[Courses SSR] Error fetching skills:", error);
    return [];
  }
}

async function getTags(accessToken?: string) {
  const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/courses/tags`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers,
    });

    if (!res.ok) {
      console.error("[Courses SSR] Failed to fetch tags:", res.status);
      return [];
    }

    const json = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error("[Courses SSR] Error fetching tags:", error);
    return [];
  }
}

export default async function CoursesPage() {
  const accessToken = await getAccessToken();

  const [coursesResult, skills, tags] = await Promise.all([
    getCourses(accessToken),
    getSkills(accessToken),
    getTags(accessToken),
  ]);

  return (
    <CoursesClient
      initialCourses={coursesResult.data}
      initialSkills={skills}
      initialTags={tags}
      initialPagination={coursesResult.pagination}
    />
  );
}

            