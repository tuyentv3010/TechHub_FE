import { benefits } from "@/constants/homeData";
import { BenefitCard } from "@/components/molecules/BenefitCard";

export function BenefitsSection() {
  return (
    <section className="py-14 px-6 md:px-12 max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">Why learn here?</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {benefits.map(b => <BenefitCard key={b.id} benefit={b} />)}
      </div>
    </section>
  );
}

export default BenefitsSection;

