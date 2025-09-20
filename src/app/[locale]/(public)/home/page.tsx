'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Star,
  Clock,
  Users,
  Play,
  Search,
  TrendingUp,
  Award,
  Heart,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useCourses } from '@/hooks/use-courses';
import { FadeInText, TypewriterText } from '@/components/common/text-animations';
import { CardAnimation, StaggerContainer, FloatingElement } from '@/components/common/page-transitions';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HomePage() {
  const { user } = useAuthStore();
  const { data: courses, isLoading } = useCourses();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tất cả', count: 245 },
    { id: 'programming', name: 'Lập trình', count: 89 },
    { id: 'design', name: 'Thiết kế', count: 67 },
    { id: 'business', name: 'Kinh doanh', count: 45 },
    { id: 'marketing', name: 'Marketing', count: 44 },
  ];

  const featuredCourses = courses?.data?.slice(0, 8) || [];
  const trendingCourses = courses?.data?.slice(8, 12) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TypewriterText
              text={`Xin chào ${user?.name || 'Học viên'}! 👋`}
              className="text-5xl font-bold mb-6"
              speed={0.05}
              showCursor={false}
            />
            <FadeInText delay={1.5}>
              <p className="text-xl text-blue-100 mb-8">
                Khám phá hàng nghìn khóa học chất lượng cao từ các chuyên gia hàng đầu
              </p>
            </FadeInText>
            
            {/* Search Bar */}
            <FadeInText delay={2.0}>
              <div className="relative max-w-2xl mx-auto mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm khóa học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-4 text-lg border-0 shadow-lg bg-white/95 backdrop-blur"
                />
                <Button className="absolute right-2 top-2 bottom-2 px-6">
                  Tìm kiếm
                </Button>
              </div>
            </FadeInText>

            {/* Quick Stats */}
            <FadeInText delay={2.5}>
              <div className="flex justify-center space-x-8 text-sm">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>1000+ Khóa học</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>50k+ Học viên</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>200+ Chứng chỉ</span>
                </div>
              </div>
            </FadeInText>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Categories */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Danh mục phổ biến
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="h-auto p-4 flex flex-col items-center space-y-1"
              >
                <span className="font-semibold">{category.name}</span>
                <span className="text-xs opacity-75">{category.count} khóa học</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Course Tabs */}
        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="featured" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Nổi bật</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Xu hướng</span>
            </TabsTrigger>
            <TabsTrigger value="recommended" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Đề xuất</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            <CourseGrid courses={featuredCourses} isLoading={isLoading} title="Khóa học nổi bật" />
          </TabsContent>

          <TabsContent value="trending">
            <CourseGrid courses={trendingCourses} isLoading={isLoading} title="Khóa học xu hướng" />
          </TabsContent>

          <TabsContent value="recommended">
            <CourseGrid courses={featuredCourses} isLoading={isLoading} title="Khóa học đề xuất cho bạn" />
          </TabsContent>
        </Tabs>

        {/* Instructor CTA (if user is instructor) */}
        {user?.role === 'INSTRUCTOR' && (
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-2xl">
              <CardContent className="p-12">
                <h3 className="text-3xl font-bold mb-4">Chia sẻ kiến thức của bạn</h3>
                <p className="text-lg text-purple-100 mb-8">
                  Tạo khóa học và kiếm thu nhập từ việc dạy học
                </p>
                <Button size="lg" variant="secondary">
                  Tạo khóa học mới
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Course Grid Component
interface Course {
  id: string;
  title: string;
  description: string;
  price?: number;
}

function CourseGrid({ courses, isLoading, title }: { courses: Course[], isLoading: boolean, title: string }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h3>
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course, index) => (
          <CardAnimation key={course.id} delay={index * 0.1}>
            <Card className="group border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="relative">
                <Image
                  src="/api/placeholder/320/180"
                  alt={course.title}
                  width={320}
                  height={180}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button size="sm" className="bg-white/20 backdrop-blur border-white/30">
                    <Play className="w-4 h-4 mr-2" />
                    Xem trước
                  </Button>
                </div>
                <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur">
                  Mới
                </Badge>
                <FloatingElement>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-3 left-3 text-white hover:bg-white/20"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </FloatingElement>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {course.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                      <span className="text-xs text-gray-500">(1.2k)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">12h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-primary">
                    {course.price ? `${course.price.toLocaleString()}đ` : 'Miễn phí'}
                  </div>
                  <Button size="sm" className="px-4">
                    Đăng ký
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardAnimation>
        ))}
      </StaggerContainer>
    </div>
  );
}