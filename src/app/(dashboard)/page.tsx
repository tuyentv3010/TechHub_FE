'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.name || 'Bạn'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Đây là tổng quan về hoạt động học tập của bạn hôm nay.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> từ tháng trước
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Khóa học gần đây</CardTitle>
              <CardDescription>
                Các khóa học bạn đang tham gia hoặc giảng dạy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{course.title}</h3>
                        <Badge
                          variant={course.status === 'active' ? 'default' : 'secondary'}
                        >
                          {course.status === 'active' ? 'Đang học' : 'Hoàn thành'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Giảng viên: {course.instructor}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.students} học viên
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Tiến độ</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Tiếp tục
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Xem tất cả khóa học
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Lịch trình sắp tới</CardTitle>
              <CardDescription>
                Các sự kiện và buổi học trong tuần
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col space-y-2 p-3 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium leading-tight">
                        {event.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.time} - {event.date}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Xem lịch đầy đủ
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="default">
                <BookOpen className="h-4 w-4 mr-2" />
                Tạo khóa học mới
              </Button>
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Mời học viên
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Đặt lịch buổi học
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}