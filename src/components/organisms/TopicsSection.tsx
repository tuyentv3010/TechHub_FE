import { topicsByCategory } from "@/constants/homeData";
import Link from "next/link";

export function TopicsSection() {
  return (
    <section className="py-16 px-6 md:px-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Featured topics by category</h2>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {topicsByCategory.map(col => (
            <div key={col.category} className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm tracking-wide uppercase">{col.category}</h3>
              <ul className="space-y-2 text-sm">
                {col.topics.map(t => (
                  <li key={t}>
                    <Link href="#" className="text-purple-700 font-medium hover:underline">{t}</Link>
                  </li>
                ))}
              </ul>
              <Link href="#" className="text-xs text-purple-700 font-semibold hover:underline">Explore more</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopicsSection;

