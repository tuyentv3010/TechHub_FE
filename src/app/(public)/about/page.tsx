"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Award, Target } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("AboutPage");

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              About TechHub
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Empowering learners worldwide with quality education and cutting-edge technology
            </p>
          </div>
        </div>
      </section>

      {/* Our Goal Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Our Goal</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Achieve Your Goals With Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              World-class training and development programs developed by top teachers. Build skills
              with courses, certificates, and degrees online from world-class.
            </p>
          </div>

          {/* Image Grid - 3 placeholders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Image Placeholder 1 */}
            <div className="relative h-80 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 group hover:border-blue-500 dark:hover:border-blue-400 transition-all">
              {/* Add your image URL here */}
              <Image
                src="/contact/Mask group (1).png"
                alt="About TechHub 1"
                fill
                className="object-cover"
              />
            </div>

            {/* Image Placeholder 2 */}
            <div className="relative h-80 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 group hover:border-blue-500 dark:hover:border-blue-400 transition-all">
              {/* Add your image URL here */}
              <Image
                src="/contact/Mask group (2).png"
                alt="About TechHub 2"
                fill
                className="object-cover"
              />
            </div>

            {/* Image Placeholder 3 */}
            <div className="relative h-80 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 group hover:border-blue-500 dark:hover:border-blue-400 transition-all">
              {/* Add your image URL here */}
              <Image
                src="/contact/Mask group (3).png"
                alt="About TechHub 3"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                At TechHub, we believe that education should be accessible to everyone, everywhere. 
                Our mission is to provide high-quality, affordable learning experiences that empower 
                individuals to achieve their goals and transform their lives.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Deliver world-class educational content from industry experts
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Foster a global community of lifelong learners
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Provide flexible learning paths for diverse skill levels
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Continuously innovate with cutting-edge technology
                  </span>
                </li>
              </ul>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden">
              {/* Add your mission image URL here */}
              <Image
                src="/contact/Mask group (4).png"
                alt="Our Mission"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                10K+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                500+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                100+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Expert Instructors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                95%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students already learning on TechHub
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Get Started Today
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
