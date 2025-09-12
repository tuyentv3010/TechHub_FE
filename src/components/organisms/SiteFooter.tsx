import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-neutral-900 text-neutral-200 mt-20 pt-14 pb-8 px-8 text-sm">
      <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Image src="/file.svg" alt="Logo" width={100} height={40} />
          <p className="text-neutral-400">© {new Date().getFullYear()} Tech Hub, Inc.</p>
        </div>
        <div className="grid gap-10 grid-cols-2 sm:grid-cols-3">
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:underline">About</Link></li>
              <li><Link href="#" className="hover:underline">Careers</Link></li>
              <li><Link href="#" className="hover:underline">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:underline">Help Center</Link></li>
              <li><Link href="#" className="hover:underline">Contact</Link></li>
              <li><Link href="#" className="hover:underline">Status</Link></li>
            </ul>
          </div>
          <div className="hidden sm:block">
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:underline">Privacy</Link></li>
              <li><Link href="#" className="hover:underline">Terms</Link></li>
              <li><Link href="#" className="hover:underline">Cookies</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

