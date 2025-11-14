import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { Search } from "lucide-react";

interface HeroSearchProps {
  placeholder: string;
  buttonText: string;
}

export function HeroSearch({ placeholder, buttonText }: HeroSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-10 h-12 rounded-full border-0 shadow-lg dark:bg-gray-800 dark:text-white"
        />
      </div>
      <PrimaryButton size="lg" className="px-8">
        {buttonText}
      </PrimaryButton>
    </div>
  );
}