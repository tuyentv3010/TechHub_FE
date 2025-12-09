import { Metadata } from "next";
import { cookies } from "next/headers";
import envConfig from "@/config";
import { normalizeTags } from "@/lib/blog";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "Blog - TechHub",
  description: "Khám phá các bài viết về công nghệ, lập trình và nhiều chủ đề thú vị khác.",
  openGraph: {
    title: "Blog - TechHub",
    description: "Khám phá các bài viết về công nghệ, lập trình và nhiều chủ đề thú vị khác.",
    type: "website",
  },
};

async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

async function getBlogs(accessToken?: string) {
  const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/blogs?page=0&size=20`;
  
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
      console.error("[Blog SSR] Failed to fetch blogs:", res.status);
      return { data: [], pagination: null };
    }
    
    const json = await res.json();
    
    return {
      data: json.data ?? [],
      pagination: json.pagination ?? null,
    };
  } catch (error) {
    console.error("[Blog SSR] Error fetching blogs:", error);
    return { data: [], pagination: null };
  }
}

async function getTags(accessToken?: string) {
  const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/blogs/tags`;
  
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
      console.error("[Blog SSR] Failed to fetch tags:", res.status);
      return [];
    }
    
    const json = await res.json();
    const tagsData = json.data ?? [];
    return normalizeTags(tagsData);
  } catch (error) {
    console.error("[Blog SSR] Error fetching tags:", error);
    return [];
  }
}

export default async function BlogListingPage() {
  const accessToken = await getAccessToken();
  
  const [blogsResult, tags] = await Promise.all([
    getBlogs(accessToken),
    getTags(accessToken),
  ]);

  console.log("[Blog SSR] Final blogs count:", blogsResult.data.length);
  console.log("[Blog SSR] Final tags count:", tags.length);
  console.log("[Blog SSR] ========== SSR Complete ==========");

  return (
    <BlogListClient
      initialBlogs={blogsResult.data}
      initialTags={tags}
      initialPagination={blogsResult.pagination}
    />
  );
}
