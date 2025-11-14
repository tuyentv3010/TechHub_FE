import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { Input } from "@/components/ui/input";

interface NewsletterSectionProps {
  title: string;
  placeholder: string;
  buttonText: string;
}

export function NewsletterSection({ title, placeholder, buttonText }: NewsletterSectionProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-800 dark:to-purple-900">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            {title}
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder={placeholder}
              className="flex-1 h-12 bg-white dark:bg-gray-800 border-0 dark:text-white"
            />
            <PrimaryButton size="lg" className="bg-yellow-400 text-black hover:bg-yellow-300 dark:bg-yellow-500 dark:hover:bg-yellow-400">
              {buttonText}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}