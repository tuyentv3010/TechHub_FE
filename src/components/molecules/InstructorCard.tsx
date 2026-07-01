import Image from "next/image";

interface InstructorCardProps {
  name: string;
  image: string;
  specialty: string;
}

export function InstructorCard({ name, image, specialty }: InstructorCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center border border-border">
      <div className="relative w-24 h-24 mx-auto mb-4">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded-full"
        />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{name}</h3>
      <p className="text-muted-foreground text-sm">{specialty}</p>
    </div>
  );
}