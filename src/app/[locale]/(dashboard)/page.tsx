'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/common/liquid-glass-background';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveText } from '@/components/common/responsive-components';
import {
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  Play,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const stats = [
  {
    title: 'Tổng khóa học',
    value: '24',
    change: '+12%',
    icon: BookOpen,
    color: 'text-blue-600',
  },
  {
    title: 'Học viên đang học',
    value: '1,234',
    change: '+8%',
    icon: Users,
    color: 'text-green-600',
  },
  {
    title: 'Buổi học tuần này',
    value: '18',
    change: '+5%',
    icon: Calendar,
    color: 'text-purple-600',
  },
  {
    title: 'Tỷ lệ hoàn thành',
    value: '85%',
    change: '+3%',
    icon: TrendingUp,
    color: 'text-orange-600',
  },
];

const recentCourses = [
  {
    id: 1,
    title: 'Lập trình React Native cơ bản',
    instructor: 'Nguyễn Văn A',
    progress: 75,
    students: 45,
    rating: 4.8,
    duration: '8 tuần',
    status: 'active',
  },
  {
    id: 2,
    title: 'Node.js và Express Framework',
    instructor: 'Trần Thị B',
    progress: 60,
    students: 32,
    rating: 4.6,
    duration: '6 tuần',
    status: 'active',
  },
  {
    id: 3,
    title: 'UI/UX Design với Figma',
    instructor: 'Lê Văn C',
    progress: 90,
    students: 28,
    rating: 4.9,
    duration: '4 tuần',
    status: 'completed',
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Webinar: Xu hướng công nghệ 2024',
    time: '14:00 - 15:30',
    date: 'Hôm nay',
    type: 'webinar',
  },
  {
    id: 2,
    title: 'Workshop: Git và GitHub',
    time: '09:00 - 12:00',
    date: 'Ngày mai',
    type: 'workshop',
  },
  {
    id: 3,
    title: 'Thảo luận: Best Practices trong React',
    time: '19:00 - 20:30',
    date: '25/12',
    type: 'discussion',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <ResponsiveContainer className="py-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <ResponsiveText size="3xl" className="font-bold tracking-tight text-gray-900 dark:text-white">
          {getGreeting()}, {user?.name || 'Bạn'}! 👋
        </ResponsiveText>
        <ResponsiveText size="base" className="text-muted-foreground mt-2">
          Đây là tổng quan về hoạt động học tập của bạn hôm nay.
        </ResponsiveText>
      </div>

      {/* Stats Cards */}
      <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }} gap="md" className="mb-6 sm:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.title} className="p-4 sm:p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <ResponsiveText size="sm" className="font-medium text-gray-700 dark:text-gray-300">
                  {stat.title}
                </ResponsiveText>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <ResponsiveText size="2xl" className="font-bold text-gray-900 dark:text-white">{stat.value}</ResponsiveText>
                <ResponsiveText size="xs" className="text-gray-600 dark:text-gray-400">
                  <span className="text-green-600">{stat.change}</span> từ tháng trước
                </ResponsiveText>
              </div>
            </GlassCard>
          );
        })}
      </ResponsiveGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Khóa học gần đây</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Các khóa học bạn đang tham gia hoặc giảng dạy
              </p>
            </div>
            <div className="space-y-4">
              {recentCourses.map((course, index) => (
                <div
                  key={course.id}
                  className={`flex items-center justify-between p-4 rounded-lg hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r ${
                    index % 3 === 0 ? 'from-violet-500/80 to-purple-600/80' :
                    index % 3 === 1 ? 'from-purple-500/80 to-indigo-600/80' :
                    'from-indigo-500/80 to-violet-600/80'
                  } backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{course.title}</h3>
                      <Badge
                        variant={course.status === 'active' ? 'default' : 'secondary'}
                        className="bg-white/20 text-white border-white/30"
                      >
                        {course.status === 'active' ? 'Đang học' : 'Hoàn thành'}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/80">
                      Giảng viên: {course.instructor}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.students} học viên
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                        {course.rating}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-white">
                        <span>Tiến độ</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2 bg-white/20" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Play className="h-4 w-4 mr-2" />
                    Tiếp tục
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-white/20 border-white/30 text-gray-900 dark:text-white hover:bg-white/30">
              Xem tất cả khóa học
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </GlassCard>
        </div>

        {/* Upcoming Events */}
        <div>
          <GlassCard className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lịch trình sắp tới</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Các sự kiện và buổi học trong tuần
              </p>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col space-y-2 p-3 bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium leading-tight text-gray-900 dark:text-white">
                      {event.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {event.time} - {event.date}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-white/20 border-white/30 text-gray-900 dark:text-white hover:bg-white/30">
              Xem lịch đầy đủ
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="mt-6 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Thao tác nhanh</h2>
            </div>
            <div className="space-y-2">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                <BookOpen className="h-4 w-4 mr-2" />
                Tạo khóa học mới
              </Button>
              <Button className="w-full bg-white/20 border-white/30 text-gray-900 dark:text-white hover:bg-white/30" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Mời học viên
              </Button>
              <Button className="w-full bg-white/20 border-white/30 text-gray-900 dark:text-white hover:bg-white/30" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Đặt lịch buổi học
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </ResponsiveContainer>
  );
}