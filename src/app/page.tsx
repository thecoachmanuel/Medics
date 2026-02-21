'use client'
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import LandingHero from "@/components/landing/LandingHero";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import { CalendarCheck, ShieldCheck, Smartphone, Stethoscope, Video } from "lucide-react";
import { userAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
 const {user} = userAuthStore();
  const router = useRouter();

  useEffect(() => {
    if(user?.type === 'doctor') {
      router.replace('/doctor/dashboard')
    }
  },[user,router])

  if(user?.type === 'doctor'){
    return null;
  }

  return (
     <div className="min-h-screen bg-white">
      <Header showDashboardNav={false}/>
      <main className="pt-16">
         <LandingHero/>

         <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
           <div className="max-w-7xl mx-auto">
             <div className="max-w-3xl mx-auto text-center mb-12">
               <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
                 How MedicsOnline Works
               </h2>
               <p className="text-lg md:text-xl text-gray-600">
                 From finding the right doctor to getting your treatment plan, everything happens
                 securely on your phone in a few simple steps.
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
                   Create your account
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   Sign up in minutes and securely share the basic details your doctor needs to care
                   for you.
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
                   Find the right doctor
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   Browse verified doctors by specialty, experience, and fees, then choose who you
                   want to speak with.
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
                   Join your consultation
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   Connect via secure HD video or voice call from anywhere in Nigeria, at the time
                   that works for you.
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
                   Get your plan & follow-up
                 </h3>
                 <p className="text-sm md:text-base text-gray-600">
                   Receive your doctor&apos;s notes, prescriptions, and follow-up instructions all in
                   one secure place.
                 </p>
               </div>
             </div>

             <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-3 text-sm md:text-base text-gray-600">
                 <CalendarCheck className="w-5 h-5 text-green-600" />
                 <span>Most patients speak to a doctor within the same day.</span>
               </div>
               <div className="flex items-center gap-3 text-sm md:text-base text-gray-600">
                 <ShieldCheck className="w-5 h-5 text-blue-600" />
                 <span>All consultations are encrypted and handled by licensed Nigerian doctors.</span>
               </div>
             </div>
           </div>
         </section>

         <TestimonialsSection/>
         <FAQSection/>
         <Footer/>
      </main>
     </div>
  );
}
