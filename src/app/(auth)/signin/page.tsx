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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    <CardAnimation>
      <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            <TypewriterText 
              text="Đăng nhập" 
              speed={0.1}
              showCursor={false}
            />
          </CardTitle>
          <FadeInText delay={0.8}>
            <CardDescription className="text-center">
              Nhập email và mật khẩu để truy cập tài khoản
            </CardDescription>
          </FadeInText>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FadeInText delay={1.0}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@demo.com"
                  {...register('email')}
                  disabled={loginMutation.isPending}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </FadeInText>

            <FadeInText delay={1.2}>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="123456"
                    {...register('password')}
                    disabled={loginMutation.isPending}
                    className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </FadeInText>

            <FadeInText delay={1.4}>
              <Button
                type="submit"
                className="w-full transition-all duration-200 hover:scale-[1.02]"
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
                <span className="text-muted-foreground">Chưa có tài khoản? </span>
                <Link href="/signup" className="text-primary hover:underline transition-colors">
                  Đăng ký ngay
                </Link>
              </div>
            </FadeInText>
          </form>

          <FadeInText delay={1.8}>
            <Separator className="my-6" />
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Tài khoản demo để test:
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">Admin:</span>
                  <span className="text-muted-foreground">admin@demo.com / 123456</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Giảng viên:</span>
                  <span className="text-muted-foreground">instructor@demo.com / 123456</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Học viên:</span>
                  <span className="text-muted-foreground">learner@demo.com / 123456</span>
                </div>
              </div>
            </div>
          </FadeInText>
        </CardContent>
      </Card>
    </CardAnimation>
  );
}