'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, Award } from 'lucide-react';
import { AnimatedLogo } from '@/components/common/animated-logo';
import { 
  FadeInText, 
  TypewriterText, 
  SlideInText,
  GradientText 
} from '@/components/common/text-animations';
import { 
  StaggerContainer, 
  StaggerItem,
  FloatingElement 
} from '@/components/common/page-transitions';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Delay redirect to show landing page briefly
    const timer = setTimeout(() => {
      if (!isLoading && user) {
        setShouldRedirect(true);
        router.push('/dashboard');
      }
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, [user, isLoading, router]);

  if (shouldRedirect && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AnimatedLogo size="lg" className="justify-center mb-4" />
          <FadeInText>
            <p className="text-muted-foreground">Đang chuyển hướng...</p>
          </FadeInText>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <AnimatedLogo size="md" />
          <div className="flex items-center space-x-4">
            {user ? (
              <Button onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/signin">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Đăng ký</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <SlideInText direction="up" delay={0.2}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <GradientText animate>
                TechHub
              </GradientText>
            </h1>
          </SlideInText>

          <FadeInText delay={0.5}>
            <h2 className="text-2xl md:text-3xl text-muted-foreground">
              <TypewriterText 
                text="Nền tảng học lập trình hiện đại" 
                speed={0.08}
                delay={0.5}
              />
            </h2>
          </FadeInText>

          <FadeInText delay={1.5}>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Khám phá thế giới lập trình với các khóa học chất lượng cao, 
              giảng viên kinh nghiệm và cộng đồng học tập sôi động.
            </p>
          </FadeInText>

          <FadeInText delay={2.0}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/signup">
                  Bắt đầu học ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link href="/signin">
                  Đăng nhập
                </Link>
              </Button>
            </div>
          </FadeInText>
        </div>

        {/* Features Section */}
        <StaggerContainer className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <StaggerItem>
            <FloatingElement intensity={5}>
              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur border hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Khóa học chất lượng</h3>
                <p className="text-muted-foreground">
                  Học từ các chuyên gia với kinh nghiệm thực tế trong ngành
                </p>
              </div>
            </FloatingElement>
          </StaggerItem>

          <StaggerItem>
            <FloatingElement intensity={5} className="animation-delay-200">
              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur border hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cộng đồng sôi động</h3>
                <p className="text-muted-foreground">
                  Kết nối với hàng nghìn lập trình viên và chia sẻ kinh nghiệm
                </p>
              </div>
            </FloatingElement>
          </StaggerItem>

          <StaggerItem>
            <FloatingElement intensity={5} className="animation-delay-400">
              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur border hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Chứng chỉ uy tín</h3>
                <p className="text-muted-foreground">
                  Nhận chứng chỉ được công nhận bởi các doanh nghiệp hàng đầu
                </p>
              </div>
            </FloatingElement>
          </StaggerItem>
        </StaggerContainer>
      </main>
    </div>
  );
}
