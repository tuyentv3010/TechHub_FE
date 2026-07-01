import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { normalizePersistedMediaUrl } from "@/lib/file-media";

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";

interface Instructor {
  id: string;
  username: string;
  avatar?: string;
  email: string;
}

interface HeroSectionProps {
  welcomeText: string;
  title: string;
  subtitle: string;
  buttonText: string;
  instructorCount: string;
  instructorText: string;
  instructors?: Instructor[];
}

export function HeroSection({
  welcomeText,
  title,
  subtitle,
  buttonText,
  instructorCount,
  instructorText,
  instructors = [],
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="container mx-auto px-4 py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Welcome text */}
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {welcomeText}
              </p>
              
              {/* Main title */}
              <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {title}
              </h1>
              
              {/* Subtitle */}
              <p className="mb-8 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
                {subtitle}
              </p>
            </div>
            
            {/* CTA Button with decorative arrow */}
            <div className="relative">
            <Button asChild size="lg">
              <Link href="/courses">
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            </div>
          </div>
          
          {/* Right content */}
          <div className="relative">
            {/* Instructor count card */}
            <div className="absolute right-4 top-4 z-20 rounded-xl border border-border bg-card p-5 shadow-sm lg:right-8">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-2xl font-semibold text-primary">
                    {instructorCount}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {instructorText}
                  </div>
                </div>
                
                {/* Instructor avatars */}
                <div className="flex -space-x-2">
                  {instructors.length > 0 ? (
                    <>
                      {instructors.slice(0, 4).map((instructor, index) => (
                        <Avatar key={instructor.id} className="w-10 h-10 border-2 border-background">
                          <AvatarImage
                            src={normalizePersistedMediaUrl(instructor.avatar) || DEFAULT_AVATAR}
                            alt={instructor.username}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                            {instructor.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {instructors.length > 4 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary">
                          <span className="text-sm font-semibold text-primary-foreground">+{instructors.length - 4}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    // Fallback avatars when no data
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                        <span className="text-primary-foreground text-sm font-semibold">A</span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-learning text-learning-foreground">
                        <span className="text-learning-foreground text-sm font-semibold">B</span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-foreground">
                        <span className="text-sm font-semibold">C</span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-[hsl(var(--warning))] text-primary-foreground">
                        <span className="text-primary-foreground text-sm font-semibold">D</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main hero image */}
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm lg:h-[560px]">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
                alt="Students in library"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

