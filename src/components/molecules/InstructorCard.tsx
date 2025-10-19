import Image from "next/image";

interface InstructorCardProps {
  name: string;
  image: string;
  specialty: string;
}

export function InstructorCard({ name, image, specialty }: InstructorCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center border dark:border-gray-700">
      <div className="relative w-24 h-24 mx-auto mb-4">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded-full"
        />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{name}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{specialty}</p>
    </div>
  );
}