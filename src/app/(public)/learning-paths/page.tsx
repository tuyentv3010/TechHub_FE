import { Metadata } from "next";
import { cookies } from "next/headers";
import envConfig from "@/config";
import LearningPathsClient from "./LearningPathsClient";

export const metadata: Metadata = {
  title: "Lộ trình học tập - TechHub",
  description: "Khám phá các lộ trình học tập có cấu trúc, giúp bạn phát triển kỹ năng một cách bài bản và hiệu quả.",
  openGraph: {
    title: "Lộ trình học tập - TechHub",
    description: "Khám phá các lộ trình học tập có cấu trúc, giúp bạn phát triển kỹ năng một cách bài bản và hiệu quả.",
    type: "website",
  },
};

async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

async function getLearningPaths(accessToken?: string) {
  const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/learning-paths?page=0&size=9&sortBy=created&sortDirection=DESC`;

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
      console.error("[Learning Paths SSR] Failed to fetch learning paths:", res.status);
      return { data: [], pagination: null };
    }

    const json = await res.json();

    return {
      data: json.data ?? [],
      pagination: json.pagination ?? null,
    };
  } catch (error) {
    console.error("[Learning Paths SSR] Error fetching learning paths:", error);
    return { data: [], pagination: null };
  }
}

export default async function LearningPathsPage() {
  const accessToken = await getAccessToken();
  const result = await getLearningPaths(accessToken);

  return (
    <main className="min-h-screen bg-background">
      <LearningPathsClient
        initialPaths={result.data}
        initialPagination={result.pagination}
      />
    </main>
  );
}
