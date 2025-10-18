import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("HomePage");
  const footerT = await getTranslations("Footer");

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
              Interdum velit laoreet id donec ultrices tincidunt arcu. Tincidunt tortor aliquam nulla facilisi cras fermentum odio eu.
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
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.197-1.559-.748-.948-1.197-2.265-1.197-3.702 0-1.437.449-2.754 1.197-3.702.749-.948 1.9-1.559 3.197-1.559 1.297 0 2.448.611 3.197 1.559.748.948 1.197 2.265 1.197 3.702 0 1.437-.449 2.754-1.197 3.702-.749.948-1.9 1.559-3.197 1.559zm7.138 0c-1.297 0-2.448-.611-3.197-1.559-.748-.948-1.197-2.265-1.197-3.702 0-1.437.449-2.754 1.197-3.702.749-.948 1.9-1.559 3.197-1.559 1.297 0 2.448.611 3.197 1.559.748.948 1.197 2.265 1.197 3.702 0 1.437-.449 2.754-1.197 3.702-.749.948-1.9 1.559-3.197 1.559z"/>
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

          {/* Our Services */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Our Services:</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/web-development" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/ui-ux-design" className="text-gray-300 hover:text-white transition-colors text-sm">
                  UI/UX Design
                </Link>
              </li>
              <li>
                <Link href="/management" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Management
                </Link>
              </li>
              <li>
                <Link href="/digital-marketing" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Digital Marketing
                </Link>
              </li>
              <li>
                <Link href="/blog-news" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Blog News
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links:</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/templates" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Blog And Article
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/webinars" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Webinars
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Privacy & Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Gallery */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Gallery</h3>
            <div className="grid grid-cols-3 gap-2">
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
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Copyright © 2024 <span className="text-white font-medium">edunity</span> || All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
