import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-muted/60 px-8 pb-8 pt-14 text-sm text-foreground">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Image src="/file.svg" alt="Logo" width={100} height={40} />
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Tech Hub, Inc.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <h4 className="mb-3 font-semibold">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Status
                </Link>
              </li>
            </ul>
          </div>
          <div className="hidden sm:block">
            <h4 className="mb-3 font-semibold">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
