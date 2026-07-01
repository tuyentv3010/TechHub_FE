import Image from "next/image";

interface BlogCardProps {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
}

export function BlogCard({ title, excerpt, image, date, readTime }: BlogCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-border">
      <div className="relative h-48">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>{date}</span>
          <span>•</span>
          <span>{readTime}</span>
        </div>
        <h3 className="text-lg font-semibold mb-3 line-clamp-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-3">{excerpt}</p>
      </div>
    </div>
  );
}