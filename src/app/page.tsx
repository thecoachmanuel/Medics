"use client";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import LandingHero from "@/components/landing/LandingHero";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import { CalendarCheck, ShieldCheck, Smartphone, Stethoscope, Video } from "lucide-react";
import { userAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type HomepageFaqItem = {
  question: string;
  answer: string;
};

type HomepageStep = {
  title: string;
  description: string;
};

type HomepageHighlight = {
  text: string;
};

type HomepageTestimonial = {
  rating: number;
  text: string;
  author: string;
  location: string;
  bgColor: string;
};

type HomepageContent = {
  siteName: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  howTitle: string;
  howSubtitle: string;
  howSteps: HomepageStep[];
  howHighlights: HomepageHighlight[];
  faqTitle: string;
  faqSubtitle: string;
  faqItems: HomepageFaqItem[];
  footerIntro: string;
  footerContactPhone: string;
  footerContactEmail: string;
  footerContactLocation: string;
  testimonials?: HomepageTestimonial[];
};

export default function Home() {
  const { user } = userAuthStore();
  const router = useRouter();
  const [content, setContent] = useState<HomepageContent | null>(null);

  useEffect(() => {
    if (user?.type === "doctor") {
      router.replace("/doctor/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        const response = await fetch("/api/homepage");
        if (!response.ok) return;
        const json = (await response.json()) as { config?: HomepageContent | null };
        if (!isMounted) return;
        if (json && json.config) {
          setContent(json.config);
        }
      } catch {
        // ignore and fall back to static copy
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  if (user?.type === "doctor") {
    return null;
  }

  const howTitle = content?.howTitle ?? "How MedicsOnline Works";
  const howSubtitle =
    content?.howSubtitle ??
    "From finding the right doctor to getting your treatment plan, everything happens securely on your phone in a few simple steps.";

  const steps: HomepageStep[] =
    content?.howSteps && content.howSteps.length === 4
      ? content.howSteps
      : [
          {
            title: "Create your account",
            description:
              "Sign up in minutes and securely share the basic details your doctor needs to care for you.",
          },
          {
            title: "Find the right doctor",
            description:
              "Browse verified doctors by specialty, experience, and fees, then choose who you want to speak with.",
          },
          {
            title: "Join your consultation",
            description:
              "Connect via secure HD video or voice call from anywhere in Nigeria, at the time that works for you.",
          },
          {
            title: "Get your plan & follow-up",
            description:
              "Receive your doctor's notes, prescriptions, and follow-up instructions all in one secure place.",
          },
        ];

  const highlights: HomepageHighlight[] =
    content?.howHighlights && content.howHighlights.length === 2
      ? content.howHighlights
      : [
          {
            text: "Most patients speak to a doctor within the same day.",
          },
          {
            text: "All consultations are encrypted and handled by licensed Nigerian doctors.",
          },
        ];

  return (
     <div className="min-h-screen bg-white">
      <Header showDashboardNav={false} siteName={content?.siteName} />
      <main className="pt-16">
         <LandingHero
           title={content?.heroTitle}
           highlight={content?.heroHighlight}
           description={content?.heroDescription}
           primaryCtaLabel={content?.heroPrimaryCtaLabel}
           secondaryCtaLabel={content?.heroSecondaryCtaLabel}
         />

         <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
           <div className="max-w-7xl mx-auto">
             <div className="max-w-3xl mx-auto text-center mb-12">
               <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
                 {howTitle}
               </h2>
               <p className="text-lg md:text-xl text-gray-600">
                 {howSubtitle}
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="relative bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col items-center text-center">
                 <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                   1
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                   <Smartphone className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2">
                   {steps[0]?.title}
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   {steps[0]?.description}
                 </p>
               </div>

               <div className="relative bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col items-center text-center">
                 <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                   2
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                   <Stethoscope className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2">
                   {steps[1]?.title}
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   {steps[1]?.description}
                 </p>
               </div>

               <div className="relative bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col items-center text-center">
                 <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                   3
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                   <Video className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2">
                   {steps[2]?.title}
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   {steps[2]?.description}
                 </p>
               </div>

               <div className="relative bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col items-center text-center">
                 <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                   4
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                   <ShieldCheck className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2">
                   {steps[3]?.title}
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   {steps[3]?.description}
                 </p>
               </div>
             </div>

             <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-3 text-sm md:text-base text-gray-600">
                 <CalendarCheck className="w-5 h-5 text-green-600" />
                <span>{highlights[0]?.text}</span>
               </div>
               <div className="flex items-center gap-3 text-sm md:text-base text-gray-600">
                 <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>{highlights[1]?.text}</span>
               </div>
             </div>
           </div>
         </section>

        <TestimonialsSection items={content?.testimonials} />
        <FAQSection
          title={content?.faqTitle}
          subtitle={content?.faqSubtitle}
          items={content?.faqItems}
        />
        <Footer
          introText={content?.footerIntro}
          contactPhone={content?.footerContactPhone}
          contactEmail={content?.footerContactEmail}
          contactLocation={content?.footerContactLocation}
        />
      </main>
     </div>
  );
}
