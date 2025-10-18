import { BlogCard } from "@/components/molecules/BlogCard";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";

interface BlogSectionProps {
  title: string;
  subtitle: string;
}

export function BlogSection({ title, subtitle }: BlogSectionProps) {
  const blogs = [
    {
      title: "10 Essential Programming Skills for 2024",
      excerpt: "Discover the most in-demand programming skills that will boost your career in the coming year.",
      image: "/blog1.jpg",
      date: "Oct 15, 2024",
      readTime: "5 min read"
    },
    {
      title: "The Future of Online Learning",
      excerpt: "Explore how technology is transforming education and what it means for learners worldwide.",
      image: "/blog2.jpg",
      date: "Oct 12, 2024", 
      readTime: "7 min read"
    },
    {
      title: "How to Build a Successful Career in Tech",
      excerpt: "Learn practical tips and strategies from industry experts on building a thriving tech career.",
      image: "/blog3.jpg",
      date: "Oct 10, 2024",
      readTime: "6 min read"
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {blogs.map((blog, index) => (
            <BlogCard key={index} {...blog} />
          ))}
        </div>
        
        <div className="text-center">
          <PrimaryButton size="lg" variant="outline">
            View All Posts
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}