"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function ContactPage() {
  const t = useTranslations("ContactPage");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    toast({
      title: t("messageSent"),
      description: t("messageSentDescription"),
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[400px] md:min-h-[500px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/aboutUs/Thumbnail.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-[400px] flex-col items-center justify-center px-4 text-center md:min-h-[500px]">
          <h1 className="mb-4 text-3xl font-bold italic text-white md:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="text-base text-white/90 md:text-lg max-w-3xl">
            {t("heroDescription")}
          </p>
        </div>
      </section>

      {/* Contact Info & Form Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {t("contactInfo")}
              </h2>
              
              {/* Contact Cards */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t("email")}</h3>
                    <p className="text-gray-600 dark:text-gray-300">support@techhub.com</p>
                    <p className="text-gray-600 dark:text-gray-300">info@techhub.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t("phone")}</h3>
                    <p className="text-gray-600 dark:text-gray-300">84+ 0808080808</p>
                    <p className="text-gray-600 dark:text-gray-300">84+ 0909090908</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="w-12 h-12 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t("address")}</h3>
                    <p className="text-gray-600 dark:text-gray-300">Trường Đại học Sư phạm Kỹ thuật Thành phố Hồ Chí Minh</p>
                    <p className="text-gray-600 dark:text-gray-300">01 Đ. Võ Văn Ngân, Linh Chiểu, Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam</p>
                  </div>
                </div>
              </div>

              {/* Image Placeholders - 3 images */}
              <div className="grid grid-cols-3 gap-4">
                {/* Image Placeholder 1 */}
                <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all">
                  {/* Add your image URL here */}
                  <Image
                    src="/aboutUs/image_1.png"
                    alt="Team member 1"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Image Placeholder 2 */}
                <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all">
                  {/* Add your image URL here */}
                  <Image
                    src="/aboutUs/image_2.png"
                    alt="Team member 2"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Image Placeholder 3 */}
                <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all">
                  {/* Add your image URL here */}
                  <Image
                    src="/aboutUs/image_3.png"
                    alt="Team member 3"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {t("sendMessage")}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                    {t("yourName")}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("namePlaceholder")}
                    required
                    className="mt-2 bg-white dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    {t("emailAddress")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("emailPlaceholder")}
                    required
                    className="mt-2 bg-white dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-gray-700 dark:text-gray-300">
                    {t("subject")}
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t("subjectPlaceholder")}
                    required
                    className="mt-2 bg-white dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">
                    {t("message")}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t("messagePlaceholder")}
                    rows={6}
                    required
                    className="mt-2 bg-white dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-600"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {t("sendButton")}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            {t("visitOffice")}
          </h2>
          <div className="relative h-96 rounded-2xl overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.3030246301596!2d106.7693381750897!3d10.850632389302671!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752763f23816ab%3A0x282f711441b6916f!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBTxrAgcGjhuqFtIEvhu7kgdGh14bqtdCBUaMOgbmggcGjhu5EgSOG7kyBDaMOtIE1pbmg!5e1!3m2!1svi!2sus!4v1764214923760!5m2!1svi!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-2xl"
            ></iframe>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
