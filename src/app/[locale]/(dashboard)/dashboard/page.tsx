'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  Star,
  Play,
  ChevronRight,
  Award,
  Video,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useCourses } from '@/hooks/use-courses';
import { AnimatedLogo } from '@/components/common/animated-logo';
import { FadeInText, TypewriterText } from '@/components/common/text-animations';
import { CardAnimation, StaggerContainer, FloatingElement } from '@/components/common/page-transitions';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: courses, isLoading } = useCourses();

  const stats = [
    {
      title: 'Khóa học đã đăng ký',
      value: '12',
      change: '+3 tuần này',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Giờ học hoàn thành',
      value: '156',
      change: '+24 tuần này',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Chứng chỉ đạt được',
      value: '8',
      change: '+2 tuần này',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Điểm trung bình',
      value: '4.8/5',
      change: '+0.3 điểm',
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  const featuredCourses = courses?.data?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header với Animated Logo */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <AnimatedLogo size="lg" />
            <div>
              <TypewriterText 
                text={`Chào mừng trở lại, ${user?.name || 'Học viên'}!`}
                className="text-3xl font-bold text-gray-900 dark:text-white"
                speed={0.05}
                showCursor={false}
              />
              <FadeInText delay={1.5}>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Hãy tiếp tục hành trình học tập của bạn
                </p>
              </FadeInText>
            </div>
          </div>
          <FloatingElement>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Play className="w-4 h-4 mr-2" />
              Học ngay
            </Button>
          </FloatingElement>
        </motion.div>

        {/* Statistics Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <CardAnimation key={stat.title} delay={index * 0.1}>
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardAnimation>
          ))}
        </StaggerContainer>

        {/* Featured Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Khóa học nổi bật
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Những khóa học được đánh giá cao nhất
              </p>
            </div>
            <Button variant="outline" className="group">
              Xem tất cả
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course, index) => (
                <CardAnimation key={course.id} delay={index * 0.1}>
                  <Card className="group border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      <Image
                        src="/api/placeholder/400/240"
                        alt={course.title}
                        width={400}
                        height={240}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button size="sm" className="bg-white/20 backdrop-blur border-white/30">
                          <Play className="w-4 h-4 mr-2" />
                          Học ngay
                        </Button>
                      </div>
                      <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur">
                        Cơ bản
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">4.8</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">1.2k</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {course.price ? `${course.price.toLocaleString()}đ` : 'Miễn phí'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Tiến độ</span>
                          <span className="font-medium">65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </CardAnimation>
              ))}
            </StaggerContainer>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Hành động nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardAnimation delay={0.1}>
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Tham gia lớp học</h3>
                      <p className="text-blue-100">Vào lớp học trực tuyến</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardAnimation>

            <CardAnimation delay={0.2}>
              <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Tải tài liệu</h3>
                      <p className="text-green-100">Tải xuống bài giảng</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardAnimation>

            <CardAnimation delay={0.3}>
              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Lịch học</h3>
                      <p className="text-purple-100">Xem lịch học tuần này</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardAnimation>
          </div>
        </motion.div>
      </div>
    </div>
  );
}