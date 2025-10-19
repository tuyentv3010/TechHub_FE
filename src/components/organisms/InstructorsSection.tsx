import Image from "next/image";

interface InstructorsSectionProps {
  title: string;
  subtitle: string;
}

export function InstructorsSection({ title, subtitle }: InstructorsSectionProps) {
  const instructors = [
    {
      name: "Alexander Bastian",
      image: "/instructors/Square.png",
      specialty: "Expert Mobile Engineer"
    },
    {
      name: "Labie Carthaline",
      image: "/instructors/Square1.png", 
      specialty: "Marketing Specialist"
    },
    {
      name: "Jonathan Doe",
      image: "/instructors/Square3.png",
      specialty: "Financial Strategist"
    },
    {
      name: "Kitani Sarasvati",
      image: "/instructors/Square1.png",
      specialty: "Film Maker & Director"
    }
  ];

  return (
    <section className="relative py-16 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Background Gradient Image - Absolute positioned */}
      <div className="absolute bottom-0 left-0 right-0 h-64 md:h-80 lg:h-96 z-0">
        <Image
          src="/background/instructor-gradient-bg.png"
          alt="Instructor background gradient"
          fill
          className="object-cover object-top"
          priority={false}
        />
        {/* Optional overlay to ensure content readability */}
        <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <div className="text-left mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {subtitle}
          </p>
        </div>
        
        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {instructors.map((instructor, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Instructor Image */}
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src={instructor.image}
                    alt={instructor.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Linear Gradient Overlay as Image */}
                  <div className="absolute bottom-0 left-0 right-0 h-full overflow-hidden">
                    <Image
                     src="/background/instructor-gradient-bg.png"
                      alt="Gradient overlay"
                      fill
                      className="object-cover object-bottom"
                    />
                  </div>
                  
                  {/* Text Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-1">{instructor.name}</h3>
                    <p className="text-white/90 text-sm">{instructor.specialty}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}