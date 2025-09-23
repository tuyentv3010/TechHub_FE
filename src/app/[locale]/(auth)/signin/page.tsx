'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GlassCard } from '@/components/common/liquid-glass-background';
import { ResponsiveContainer, ResponsiveText } from '@/components/common/responsive-components';
import { useLogin } from '@/hooks/use-auth';
import { CardAnimation } from '@/components/common/page-transitions';
import { FadeInText, TypewriterText } from '@/components/common/text-animations';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      router.push('/dashboard');
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <ResponsiveContainer className="min-h-screen flex items-center justify-center py-8">
      <CardAnimation>
        <GlassCard className="w-full max-w-md mx-auto p-6 sm:p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <ResponsiveText size="2xl" className="font-bold text-gray-900 dark:text-white">
                <TypewriterText 
                  text="Đăng nhập" 
                  speed={0.1}
                  showCursor={false}
                />
              </ResponsiveText>
              <FadeInText delay={0.8}>
                <ResponsiveText size="base" className="text-gray-600 dark:text-gray-400">
                  Nhập email và mật khẩu để truy cập tài khoản
                </ResponsiveText>
              </FadeInText>
            </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FadeInText delay={1.0}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@demo.com"
                  {...register('email')}
                  disabled={loginMutation.isPending}
                  className="bg-white/20 border-white/30 text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-violet-500/30"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </FadeInText>

            <FadeInText delay={1.2}>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 dark:text-white">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="123456"
                    {...register('password')}
                    disabled={loginMutation.isPending}
                    className="pr-10 bg-white/20 border-white/30 text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-violet-500/30"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </FadeInText>

            <FadeInText delay={1.4}>
              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 hover:scale-[1.02]"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </FadeInText>

            <FadeInText delay={1.6}>
              <div className="text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Chưa có tài khoản? </span>
                <Link href="/signup" className="text-violet-600 hover:text-violet-700 hover:underline transition-colors">
                  Đăng ký ngay
                </Link>
              </div>
            </FadeInText>
          </form>

          <FadeInText delay={1.8}>
            <Separator className="my-6 bg-white/20" />
            <div className="space-y-3">
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Tài khoản demo để test:
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs bg-white/10 dark:bg-white/5 p-3 rounded-lg border border-white/20">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Admin:</span>
                  <span className="text-gray-600 dark:text-gray-400">admin@demo.com / 123456</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Giảng viên:</span>
                  <span className="text-gray-600 dark:text-gray-400">instructor@demo.com / 123456</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Học viên:</span>
                  <span className="text-gray-600 dark:text-gray-400">learner@demo.com / 123456</span>
                </div>
              </div>
            </div>
          </FadeInText>
        </div>
      </GlassCard>
    </CardAnimation>
    </ResponsiveContainer>
  );
}