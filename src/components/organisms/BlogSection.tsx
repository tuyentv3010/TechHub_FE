import Image from "next/image";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { MapPin, Clock } from "lucide-react";

interface BlogSectionProps {
  title: string;
  subtitle: string;
}

export function BlogSection({ title, subtitle }: BlogSectionProps) {
  const blogs = [
    {
      title: "print, and publishing industries for previewing",
      excerpt: "Lorem ipsum dolor sit amet, consectetur elit, sed doeiusmod tempor",
      image: "/blogs/blog1.jpg",
      date: "08",
      month: "October",
      time: "11:00am 03:00pm",
      location: "USA"
    },
    {
      title: "print, and publishing industries for previewing",
      excerpt: "Lorem ipsum dolor sit amet, consectetur elit, sed doeiusmod tempor",
      image: "/blogs/blog2.jpg",
      date: "05",
      month: "October", 
      time: "11:00am 03:00pm",
      location: "USA"
    },
    {
      title: "print, and publishing industries for previewing",
      excerpt: "Lorem ipsum dolor sit amet, consectetur elit, sed doeiusmod tempor",
      image: "/blogs/blog3.jpg",
      date: "25",
      month: "October",
      time: "11:00am 03:00pm",
      location: "USA"
    },
    {
      title: "print, and publishing industries for previewing",
      excerpt: "Lorem ipsum dolor sit amet, consectetur elit, sed doeiusmod tempor",
      image: "/blogs/blog4.jpg",
      date: "08",
      month: "October",
      time: "11:00am 03:00pm",
      location: "USA"
    },
    {
      title: "print, and publishing industries for previewing",
      excerpt: "Lorem ipsum dolor sit amet, consectetur elit, sed doeiusmod tempor",
      image: "/blogs/blog5.jpg",
      date: "05",
      month: "October",
      time: "11:00am 03:00pm",
      location: "USA"
    },
    {
      title: "print, and publishing industries for previewing",
      excerpt: "Lorem ipsum dolor sit amet, consectetur elit, sed doeiusmod tempor",
      image: "/blogs/blog6.jpg",
      date: "25",
      month: "October",
      time: "11:00am 03:00pm",
      location: "USA"
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>
        
        {/* Blog Grid - 2 rows, 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {blogs.map((blog, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              {/* Blog Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Date Badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-yellow-400 dark:bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg shadow-lg">
                    <div className="text-xl font-bold leading-none">{blog.date}</div>
                    <div className="text-xs font-medium uppercase">{blog.month}</div>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {blog.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                  {blog.excerpt}
                </p>
                
                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-teal-600 dark:text-teal-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Time: {blog.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location: {blog.location}</span>
                  </div>
                </div>
              </div>
            </div>
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