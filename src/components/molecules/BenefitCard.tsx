import { Benefit } from "@/types/home";

interface Props { benefit: Benefit }

export function BenefitCard({ benefit }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-8 w-80 text-center shadow-sm hover:shadow transition-shadow">
      <h3 className="text-base font-semibold">{benefit.title}</h3>
      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{benefit.description}</p>
    </div>
  );
}

export default BenefitCard;

