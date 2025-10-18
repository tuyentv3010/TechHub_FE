import Image from "next/image";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";

interface SkillsSectionProps {
  title: string;
  description: string;
  buttonText: string;
}

export function SkillsSection({ title, description, buttonText }: SkillsSectionProps) {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left image */}
          <div className="relative">
            <div className="relative w-full h-[400px]">
              <Image
                src="/skills-illustration.jpg"
                alt="Skills learning"
                fill
                className="object-contain"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute top-10 right-10 bg-yellow-400 dark:bg-yellow-500 text-black dark:text-gray-900 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
              25+
            </div>
          </div>
          
          {/* Right content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              {description}
            </p>
            <PrimaryButton size="lg">
              {buttonText}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}