import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/molecules/SearchBar";
import Button from "@/components/atoms/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center px-8 gap-6">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <Link href="/" className="shrink-0" aria-label="Logo">
          <Image src="/file.svg" alt="Logo" width={90} height={36} />
        </Link>
        <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-gray-800">
          <Link href="#" className="hover:text-purple-600">Categories</Link>
          <Link href="#" className="hover:text-purple-600">Business</Link>
          <Link href="#" className="hover:text-purple-600">Teach</Link>
        </nav>
        <div className="hidden md:block">
          <SearchBar />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="#" className="text-sm hover:text-purple-600">Cart</Link>
        <Button variant="ghost" size="sm" className="text-sm">Log in</Button>
        <Button variant="secondary" size="sm" className="text-sm">Sign up</Button>
      </div>
    </header>
  );
}

export default Header;

