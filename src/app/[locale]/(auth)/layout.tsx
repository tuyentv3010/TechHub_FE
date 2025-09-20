import Link from 'next/link';
import { AnimatedLogo } from '@/components/common/animated-logo';
import { PageTransition } from '@/components/common/page-transitions';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <Link href="/" className="flex items-center space-x-2">
            <AnimatedLogo size="md" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <PageTransition className="w-full max-w-md">
          {children}
        </PageTransition>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4 bg-background/50">
        <div className="container max-w-screen-2xl text-center text-sm text-muted-foreground">
          © 2025 TechHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}