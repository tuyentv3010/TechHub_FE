'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  BookOpen,
  Award,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useProfile, useUpdateProfile } from '@/hooks/use-auth';

const profileSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuthStore();
  const { data: profileData } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const currentUser = profileData || user;

  // Mock extended user data
  const extendedUser = {
    ...currentUser,
    phone: '+84 123 456 789',
    bio: 'Passionate learner với hơn 5 năm kinh nghiệm trong lĩnh vực công nghệ thông tin.',
    location: 'TP. Hồ Chí Minh, Việt Nam'
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: extendedUser?.name || '',
      email: extendedUser?.email || '',
      phone: extendedUser?.phone || '',
      bio: extendedUser?.bio || '',
      location: extendedUser?.location || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancelEdit = () => {
    reset();
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = [
    { label: 'Khóa học đã hoàn thành', value: '12', icon: Award },
    { label: 'Khóa học đang học', value: '3', icon: BookOpen },
    { label: 'Tổng thời gian học', value: '156h', icon: Clock },
    { label: 'Điểm trung bình', value: '8.5', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="stats">Thống kê học tập</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Summary */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={extendedUser?.avatar} alt={extendedUser?.name} />
                    <AvatarFallback className="text-lg">
                      {extendedUser?.name ? getInitials(extendedUser.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle>{extendedUser?.name}</CardTitle>
                <CardDescription>{extendedUser?.email}</CardDescription>
                <div className="flex justify-center mt-2">
                  <Badge variant={extendedUser?.role === 'INSTRUCTOR' ? 'default' : 'secondary'}>
                    {extendedUser?.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {extendedUser?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{extendedUser.phone}</span>
                    </div>
                  )}
                  {extendedUser?.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{extendedUser.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Tham gia từ {new Date().getFullYear()}</span>
                  </div>
                </div>
                
                {extendedUser?.bio && (
                  <div>
                    <Separator className="my-4" />
                    <h4 className="text-sm font-medium mb-2">Giới thiệu</h4>
                    <p className="text-sm text-muted-foreground">{extendedUser.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thông tin chi tiết</CardTitle>
                      <CardDescription>
                        Cập nhật thông tin cá nhân của bạn
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleCancelEdit} variant="outline" size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Hủy
                        </Button>
                        <Button 
                          onClick={handleSubmit(onSubmit)} 
                          size="sm"
                          disabled={updateProfileMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          disabled={!isEditing}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          disabled={!isEditing}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          {...register('phone')}
                          disabled={!isEditing}
                          placeholder="0123456789"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Địa chỉ</Label>
                        <Input
                          id="location"
                          {...register('location')}
                          disabled={!isEditing}
                          placeholder="Thành phố của bạn"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Giới thiệu bản thân</Label>
                      <textarea
                        id="bio"
                        {...register('bio')}
                        disabled={!isEditing}
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Viết vài dòng giới thiệu về bản thân..."
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt tài khoản</CardTitle>
              <CardDescription>
                Quản lý cài đặt bảo mật và tùy chọn tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tính năng đang phát triển...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}