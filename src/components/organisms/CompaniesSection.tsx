import Image from "next/image";
import { companyLogos } from "@/constants/homeData";

export function CompaniesSection() {
  return (
    <section className="py-12 px-6 md:px-12 bg-white border-t border-b border-gray-200">
      <div className="max-w-5xl mx-auto text-center">
        <h3 className="text-sm font-medium text-gray-600">Trusted by teams worldwide</h3>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-10">
          {companyLogos.map(c => (
            <div key={c.id} className="relative h-10 w-28 grayscale opacity-80 hover:opacity-100 transition-opacity">
              <Image src={c.logo} alt={c.name} fill className="object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CompaniesSection;

