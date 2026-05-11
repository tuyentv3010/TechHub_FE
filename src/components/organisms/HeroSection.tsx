import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

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
            <Link 
            href="/courses"
            className="
              inline-flex items-center justify-center
              rounded-lg bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground
              shadow-sm transition-colors hover:bg-primary/90
            "
          >
            {buttonText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
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
                        <Avatar key={instructor.id} className="w-10 h-10 border-2 border-white dark:border-gray-800">
                          <AvatarImage 
                            src={instructor.avatar || "/instructors/Square.png"} 
                            alt={instructor.username}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                            {instructor.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {instructors.length > 4 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary dark:border-gray-800">
                          <span className="text-sm font-semibold text-white">+{instructors.length - 4}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    // Fallback avatars when no data
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground dark:border-gray-800">
                        <span className="text-white text-sm font-semibold">A</span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-learning text-learning-foreground dark:border-gray-800">
                        <span className="text-white text-sm font-semibold">B</span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-muted text-foreground dark:border-gray-800">
                        <span className="text-sm font-semibold">C</span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[hsl(var(--warning))] text-white dark:border-gray-800">
                        <span className="text-white text-sm font-semibold">D</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main hero image */}
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm lg:h-[560px]">
              <Image
                src="/hero/hero.png"
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

