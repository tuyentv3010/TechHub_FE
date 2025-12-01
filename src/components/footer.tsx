"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useBlogs } from "@/queries/useBlog";
import { useGetSkills } from "@/queries/useCourse";

export default function Footer() {
  const t = useTranslations("HomePage");
  const footerT = useTranslations("Footer");

  // Fetch latest 6 blogs for gallery
  const { data: blogsData } = useBlogs({ page: 1, size: 6 });
  const blogs = blogsData?.payload?.data || [];

  // Fetch skills
  const { data: skillsData } = useGetSkills();
  const skills = skillsData?.payload?.data || [];

  console.log("🔐 Footer - blogs:", blogs);
  console.log("🔐 Footer - skills:", skills);

  return (
    <footer className="bg-slate-900 text-white py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/logo.png" alt="TechHub Logo" width={80} height={80} />
              </Link>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              TechHub - Nền tảng học tập công nghệ trực tuyến hàng đầu. Khám phá các khóa học chất lượng cao, lộ trình học tập cá nhân hóa và cộng đồng học viên năng động.
            </p>
            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              <Link
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Link>
              <Link
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
              <Link
                href="https://www.twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Kỹ năng:</h3>
            <ul className="space-y-3">
              {skills.slice(0, 6).map((skill: any) => (
                <li key={skill.id}>
                  <Link 
                    href={`/skills/${skill.id}`} 
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {skill.name}
                  </Link>
                </li>
              ))}
              {skills.length === 0 && (
                <>
                  <li><span className="text-gray-300 text-sm">Web Development</span></li>
                  <li><span className="text-gray-300 text-sm">Mobile Development</span></li>
                  <li><span className="text-gray-300 text-sm">Data Science</span></li>
                  <li><span className="text-gray-300 text-sm">DevOps</span></li>
                  <li><span className="text-gray-300 text-sm">UI/UX Design</span></li>
                </>
              )}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Liên kết nhanh:</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about-us" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Khóa học
                </Link>
              </li>
              <li>
                <Link href="/learning-paths" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Lộ trình học tập
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Blog & Tin tức
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* Blog Gallery */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Bài viết mới</h3>
            <div className="grid grid-cols-3 gap-2">
              {blogs.length > 0 ? (
                blogs.slice(0, 6).map((blog: any) => (
                  <Link 
                    key={blog.id} 
                    href={`/blog/${blog.slug || blog.id}`}
                    className="aspect-square bg-gray-700 rounded overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={blog.thumbnail || blog.coverImage || "/blogs/default-blog.jpg"}
                      alt={blog.title || "Blog image"}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))
              ) : (
                // Fallback images when no blogs
                <>
                  <div className="aspect-square bg-gray-700 rounded overflow-hidden">
                    <Image
                      src="/gallery/gallery-1.jpg"
                      alt="Gallery image 1"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square bg-gray-700 rounded overflow-hidden">
                    <Image
                      src="/gallery/gallery-2.jpg"
                      alt="Gallery image 2"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square bg-gray-700 rounded overflow-hidden">
                    <Image
                      src="/gallery/gallery-3.jpg"
                      alt="Gallery image 3"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square bg-gray-700 rounded overflow-hidden">
                    <Image
                      src="/gallery/gallery-4.jpg"
                      alt="Gallery image 4"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square bg-gray-700 rounded overflow-hidden">
                    <Image
                      src="/gallery/gallery-5.jpg"
                      alt="Gallery image 5"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square bg-gray-700 rounded overflow-hidden">
                    <Image
                      src="/gallery/gallery-6.jpg"
                      alt="Gallery image 6"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Copyright © 2024 <span className="text-white font-medium">TechHub</span> || All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
