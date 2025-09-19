'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Users,
  Clock,
  Star,
  Search,
  Plus,
  Play,
  DollarSign,
} from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Lập trình React Native toàn diện',
    instructor: 'Nguyễn Văn A',
    description: 'Học xây dựng ứng dụng mobile đa nền tảng với React Native từ cơ bản đến nâng cao.',
    price: 1500000,
    originalPrice: 2000000,
    duration: '12 tuần',
    lessons: 45,
    students: 234,
    rating: 4.8,
    level: 'Trung bình',
    category: 'Mobile Development',
    image: '/placeholder-course.jpg',
    progress: 65,
    status: 'enrolled',
    nextLesson: 'Bài 23: Navigation với React Navigation',
  },
  {
    id: 2,
    title: 'Node.js và Express Framework',
    instructor: 'Trần Thị B',
    description: 'Xây dựng RESTful API và ứng dụng web backend với Node.js và Express.',
    price: 1200000,
    originalPrice: 1600000,
    duration: '8 tuần',
    lessons: 32,
    students: 156,
    rating: 4.6,
    level: 'Cơ bản',
    category: 'Backend Development',
    image: '/placeholder-course.jpg',
    progress: 0,
    status: 'available',
  },
  {
    id: 3,
    title: 'UI/UX Design với Figma',
    instructor: 'Lê Văn C',
    description: 'Thiết kế giao diện người dùng chuyên nghiệp và tạo prototype với Figma.',
    price: 900000,
    originalPrice: 1200000,
    duration: '6 tuần',
    lessons: 28,
    students: 89,
    rating: 4.9,
    level: 'Cơ bản',
    category: 'Design',
    image: '/placeholder-course.jpg',
    progress: 100,
    status: 'completed',
  },
  {
    id: 4,
    title: 'DevOps với Docker và Kubernetes',
    instructor: 'Phạm Văn D',
    description: 'Triển khai và quản lý ứng dụng với containerization và orchestration.',
    price: 1800000,
    originalPrice: 2400000,
    duration: '10 tuần',
    lessons: 38,
    students: 67,
    rating: 4.7,
    level: 'Nâng cao',
    category: 'DevOps',
    image: '/placeholder-course.jpg',
    progress: 0,
    status: 'available',
  },
];

const categories = ['Tất cả', 'Frontend', 'Backend', 'Mobile', 'Design', 'DevOps', 'Data Science'];
const levels = ['Tất cả', 'Cơ bản', 'Trung bình', 'Nâng cao'];

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả');

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || course.category.includes(selectedCategory);
    const matchesLevel = selectedLevel === 'Tất cả' || course.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge className="bg-blue-100 text-blue-800">Đang học</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">Chưa đăng ký</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Khóa học</h1>
          <p className="text-muted-foreground">
            Khám phá và học tập với các khóa học chất lượng cao
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo khóa học
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <div className="absolute top-4 left-4">
                {getStatusBadge(course.status)}
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">{course.level}</Badge>
              </div>
            </div>
            
            <CardHeader>
              <div className="space-y-2">
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription>
                  Giảng viên: {course.instructor}
                </CardDescription>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Course Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {course.lessons} bài học
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.students} học viên
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </div>
                </div>

                {/* Progress for enrolled courses */}
                {course.status === 'enrolled' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tiến độ học tập</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    {course.nextLesson && (
                      <p className="text-xs text-muted-foreground">
                        Tiếp theo: {course.nextLesson}
                      </p>
                    )}
                  </div>
                )}

                {/* Price for available courses */}
                {course.status === 'available' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(course.price)}
                      </span>
                      {course.originalPrice > course.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(course.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  {course.status === 'enrolled' ? (
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Tiếp tục học
                    </Button>
                  ) : course.status === 'completed' ? (
                    <Button variant="outline" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Xem lại
                    </Button>
                  ) : (
                    <Button className="w-full">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Đăng ký ngay
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy khóa học</h3>
          <p className="text-muted-foreground">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm thấy khóa học phù hợp.
          </p>
        </div>
      )}
    </div>
  );
}