'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/common/liquid-glass-background';
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
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: '87.3%',
      change: '+3.2%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  const recentActivities = [
    { id: 1, user: 'Nguyễn Văn A', action: 'đã đăng ký khóa học', course: 'React Fundamentals', time: '5 phút trước' },
    { id: 2, user: 'Trần Thị B', action: 'đã hoàn thành', course: 'JavaScript Advanced', time: '10 phút trước' },
    { id: 3, user: 'Lê Văn C', action: 'đã tạo khóa học mới', course: 'Node.js Backend', time: '15 phút trước' },
    { id: 4, user: 'Phạm Thị D', action: 'đã đánh giá', course: 'UI/UX Design', time: '20 phút trước' },
    { id: 5, user: 'Hoàng Văn E', action: 'đã thanh toán', course: 'Python for Beginners', time: '25 phút trước' },
  ];

  const quickActions = [
    {
      title: 'Quản lý người dùng',
      description: 'Xem và quản lý tài khoản người dùng',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/users',
    },
    {
      title: 'Quản lý khóa học',
      description: 'Duyệt và quản lý khóa học',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      href: '/admin/courses',
    },
    {
      title: 'Báo cáo tài chính',
      description: 'Xem báo cáo doanh thu và tài chính',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/finance',
    },
    {
      title: 'Phân tích hệ thống',
      description: 'Xem thống kê và phân tích dữ liệu',
      icon: PieChart,
      color: 'from-orange-500 to-orange-600',
      href: '/admin/analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
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
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </Button>
          </div>
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
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className={`text-sm mt-1 ${
                        stat.changeType === 'positive' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.change} so với tháng trước
                      </p>
                    </div>
                    <div className={`p-4 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardAnimation>
          ))}
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Hành động nhanh
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action, index) => (
                  <CardAnimation key={action.title} delay={index * 0.1}>
                    <Card className={`border-0 shadow-lg bg-gradient-to-r ${action.color} text-white hover:shadow-xl transition-all duration-300 cursor-pointer`}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white/20 rounded-full">
                            <action.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{action.title}</h3>
                            <p className="text-white/80 text-sm">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardAnimation>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Activities */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Hoạt động gần đây
              </h2>
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                            <span className="font-medium text-blue-600">{activity.course}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Xem tất cả hoạt động
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Charts Section */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Biểu đồ thống kê
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Doanh thu 12 tháng</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500">Biểu đồ doanh thu sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Phân bố người dùng theo vai trò</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500">Biểu đồ phân bố sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}