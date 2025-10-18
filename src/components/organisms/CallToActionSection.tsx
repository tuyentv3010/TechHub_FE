interface CallToActionSectionProps {
  phoneText: string;
  phoneNumber: string;
}

export function CallToActionSection({ phoneText, phoneNumber }: CallToActionSectionProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-gray-800 to-gray-900">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {phoneText}
          </h2>
          <a 
            href={`tel:${phoneNumber}`}
            className="text-2xl md:text-3xl font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            {phoneNumber}
          </a>
        </div>
      </div>
    </section>
  );
}