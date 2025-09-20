'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/common/liquid-glass-background';
import { GradientButton, ShimmerButton } from '@/components/common/gradient-button';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveText } from '@/components/common/responsive-components';
import { TechnologyLogoLoop } from '@/components/common/technology-logo-loop';
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
  const t = useTranslations();

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
            <p className="text-muted-foreground">{t('common.redirecting')}</p>
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
                  <Link href="/signin">{t('auth.signIn')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">{t('auth.signUp')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <ResponsiveContainer className="py-10 sm:py-20">
        <div className="text-center space-y-6 sm:space-y-8">
          <SlideInText direction="up" delay={0.2}>
            <ResponsiveText size="5xl" className="font-bold tracking-tight">
              <GradientText animate>
                TechHub
              </GradientText>
            </ResponsiveText>
          </SlideInText>

          <FadeInText delay={0.5}>
            <ResponsiveText size="2xl" className="text-muted-foreground">
              <TypewriterText 
                text={t('homepage.subtitle')} 
                speed={0.08}
                delay={0.5}
                showCursor={false}
              />
            </ResponsiveText>
          </FadeInText>

          <FadeInText delay={1.5}>
            <ResponsiveText size="lg" className="text-muted-foreground max-w-2xl mx-auto px-4">
              {t('homepage.description')}
            </ResponsiveText>
          </FadeInText>

          <FadeInText delay={2.0}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <ShimmerButton size="lg" onClick={() => router.push('/signup')} className="w-full sm:w-auto">
                <span className="flex items-center justify-center">
                  {t('homepage.startLearning')}
                  <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
                </span>
              </ShimmerButton>
              <GradientButton variant="secondary" size="lg" onClick={() => router.push('/signin')} className="w-full sm:w-auto">
                {t('auth.signIn')}
              </GradientButton>
            </div>
          </FadeInText>
        </div>

        {/* Technology Logo Loop */}
        <FadeInText delay={2.5}>
          <TechnologyLogoLoop />
        </FadeInText>

        {/* Features Section */}
        <StaggerContainer className="mt-16 sm:mt-32">
          <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="lg" className="max-w-5xl mx-auto">
            <StaggerItem>
              <FloatingElement intensity={5}>
                <GlassCard className="text-center p-4 sm:p-6 hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-violet-600" />
                  </div>
                  <ResponsiveText size="xl" className="font-semibold mb-2 text-gray-900 dark:text-white">{t('features.qualityCourses.title')}</ResponsiveText>
                  <ResponsiveText size="base" className="text-gray-600 dark:text-gray-400">
                    {t('features.qualityCourses.description')}
                  </ResponsiveText>
                </GlassCard>
              </FloatingElement>
            </StaggerItem>

            <StaggerItem>
              <FloatingElement intensity={5} className="animation-delay-200">
                <GlassCard className="text-center p-4 sm:p-6 hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <ResponsiveText size="xl" className="font-semibold mb-2 text-gray-900 dark:text-white">{t('features.community.title')}</ResponsiveText>
                  <ResponsiveText size="base" className="text-gray-600 dark:text-gray-400">
                    {t('features.community.description')}
                  </ResponsiveText>
                </GlassCard>
              </FloatingElement>
            </StaggerItem>

            <StaggerItem>
              <FloatingElement intensity={5} className="animation-delay-400">
                <GlassCard className="text-center p-4 sm:p-6 hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600" />
                  </div>
                  <ResponsiveText size="xl" className="font-semibold mb-2 text-gray-900 dark:text-white">{t('features.certificates.title')}</ResponsiveText>
                  <ResponsiveText size="base" className="text-gray-600 dark:text-gray-400">
                    {t('features.certificates.description')}
                  </ResponsiveText>
                </GlassCard>
              </FloatingElement>
            </StaggerItem>
          </ResponsiveGrid>
        </StaggerContainer>
      </ResponsiveContainer>
    </div>
  );
}
