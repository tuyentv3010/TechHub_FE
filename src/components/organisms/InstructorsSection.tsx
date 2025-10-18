import { InstructorCard } from "@/components/molecules/InstructorCard";

interface InstructorsSectionProps {
  title: string;
}

export function InstructorsSection({ title }: InstructorsSectionProps) {
  const instructors = [
    {
      name: "Sarah Wilson",
      image: "/instructor1.jpg",
      specialty: "Web Development Expert"
    },
    {
      name: "David Chen",
      image: "/instructor2.jpg", 
      specialty: "Data Science Specialist"
    },
    {
      name: "Emily Johnson",
      image: "/instructor3.jpg",
      specialty: "UX/UI Design Master"
    },
    {
      name: "Michael Brown",
      image: "/instructor4.jpg",
      specialty: "Marketing Strategist"
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {instructors.map((instructor, index) => (
            <InstructorCard key={index} {...instructor} />
          ))}
        </div>
      </div>
    </section>
  );
}