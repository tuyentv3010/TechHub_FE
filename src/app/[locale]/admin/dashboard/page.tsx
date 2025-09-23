'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/common/liquid-glass-background';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveText } from '@/components/common/responsive-components';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCheck,
  GraduationCap,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Settings,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { AnimatedLogo } from '@/components/common/animated-logo';
import { FadeInText, TypewriterText } from '@/components/common/text-animations';
import { CardAnimation, StaggerContainer } from '@/components/common/page-transitions';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Tổng người dùng',
      value: '12,483',
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Tổng khóa học',
      value: '1,247',
      change: '+8.2%',
      changeType: 'positive',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Doanh thu tháng',
      value: '₫2.4M',
      change: '+15.3%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      title: 'Tăng trưởng',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  const quickActions = [
    {
      title: 'Quản lý người dùng',
      description: 'Thêm, sửa, xóa và phân quyền người dùng',
      icon: UserCheck,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/users',
    },
    {
      title: 'Quản lý khóa học',
      description: 'Tạo mới, chỉnh sửa và quản lý nội dung khóa học',
      icon: GraduationCap,
      color: 'from-green-500 to-green-600',
      href: '/admin/courses',
    },
    {
      title: 'Theo dõi hoạt động',
      description: 'Xem log hoạt động và báo cáo hệ thống',
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/activities',
    },
    {
      title: 'Thống kê & Báo cáo',
      description: 'Xem thống kê và phân tích dữ liệu',
      icon: PieChart,
      color: 'from-orange-500 to-orange-600',
      href: '/admin/analytics',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'Nguyễn Văn A',
      action: 'đã tạo khóa học mới',
      course: 'React Advanced',
      time: '2 phút trước',
      type: 'create',
    },
    {
      id: 2,
      user: 'Trần Thị B',
      action: 'đã hoàn thành khóa học',
      course: 'JavaScript Fundamentals',
      time: '5 phút trước',
      type: 'complete',
    },
    {
      id: 3,
      user: 'Lê Văn C',
      action: 'đã đăng ký',
      course: 'Node.js Backend',
      time: '10 phút trước',
      type: 'register',
    },
    {
      id: 4,
      user: 'Phạm Thị D',
      action: 'đã cập nhật hồ sơ',
      course: '',
      time: '15 phút trước',
      type: 'update',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
                text="Dashboard Quản trị"
                className="text-3xl font-bold text-gray-900 dark:text-white"
                speed={0.05}
                showCursor={false}
              />
              <FadeInText delay={1.5}>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Chào mừng {user?.name}, quản lý và theo dõi hệ thống TechHub
                </p>
              </FadeInText>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-gray-900 dark:text-white hover:bg-white/30">
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-gray-900 dark:text-white hover:bg-white/30">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <CardAnimation key={stat.title} delay={index * 0.1}>
              <GlassCard className="p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-green-600">
                      {stat.change} từ tháng trước
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </GlassCard>
            </CardAnimation>
          ))}
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <FadeInText delay={0.8}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Thao tác nhanh
              </h2>
            </FadeInText>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <CardAnimation key={action.title} delay={0.9 + index * 0.1}>
                  <GlassCard className={`p-6 cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-r ${action.color} text-white`}>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-full">
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                </CardAnimation>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <FadeInText delay={1.0}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Hoạt động gần đây
              </h2>
            </FadeInText>
            <GlassCard className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-white/10 dark:bg-white/5 rounded-lg border border-white/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'create' ? 'bg-green-100 text-green-600' :
                      activity.type === 'complete' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'register' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}
                        {activity.course && (
                          <span className="font-medium"> {activity.course}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <Button variant="outline" size="sm" className="w-full bg-white/20 border-white/30 text-gray-900 dark:text-white hover:bg-white/30">
                  Xem tất cả hoạt động
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* System Overview */}
        <div className="mt-8">
          <FadeInText delay={1.6}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Tổng quan hệ thống
            </h2>
          </FadeInText>
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hiệu suất</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hệ thống hoạt động ổn định</p>
                <Badge variant="outline" className="mt-2">Excellent</Badge>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Người dùng online</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">1,247 đang trực tuyến</p>
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">Active</Badge>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sự kiện hôm nay</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">8 buổi học được lên lịch</p>
                <Badge variant="outline" className="mt-2 text-blue-600 border-blue-600">Scheduled</Badge>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}