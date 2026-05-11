import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/molecules/SearchBar";
import Button from "@/components/atoms/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-6 border-b border-border bg-card px-8">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="TechHub home"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white shadow-sm">
            <Image
              src="/brand-mark.png"
              alt=""
              width={34}
              height={34}
              className="h-8 w-8 object-contain"
              priority
            />
          </span>
          <span className="text-lg font-extrabold leading-none tracking-normal text-foreground">
            Tech<span className="text-primary">Hub</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium text-foreground lg:flex">
          <Link href="#" className="hover:text-primary">Categories</Link>
          <Link href="#" className="hover:text-primary">Business</Link>
          <Link href="#" className="hover:text-primary">Teach</Link>
        </nav>
        <div className="hidden md:block">
          <SearchBar />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Cart</Link>
        <Button variant="ghost" size="sm" className="text-sm">Log in</Button>
        <Button variant="secondary" size="sm" className="text-sm">Sign up</Button>
      </div>
    </header>
  );
}

export default Header;

