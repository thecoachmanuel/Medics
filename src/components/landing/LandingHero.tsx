"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { healthcareCategories } from '@/lib/constant'
import { useRouter } from 'next/navigation';
import { userAuthStore } from '@/store/authStore';
import EditableElement from './EditableElement';

interface LandingHeroProps {
  title?: string;
  highlight?: string;
  description?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  isEditable?: boolean;
  onUpdate?: (key: string, value: string) => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({
  title,
  highlight,
  description,
  primaryCtaLabel,
  secondaryCtaLabel,
  isEditable = false,
  onUpdate,
}) => {
 const {isAuthenticated} = userAuthStore();
   const router = useRouter();
   const sectionRef = useRef<HTMLElement | null>(null);
   const [isRevealed, setIsRevealed] = useState(false);

   useEffect(() => {
     if (typeof window === "undefined") return;
     if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
       setIsRevealed(true);
       return;
     }

     const el = sectionRef.current;
     if (!el) return;

     const observer = new IntersectionObserver(
       (entries) => {
         const first = entries[0];
         if (first?.isIntersecting) {
           setIsRevealed(true);
           observer.disconnect();
         }
       },
       { root: null, threshold: 0.25 }
     );

     observer.observe(el);
     return () => observer.disconnect();
   }, []);


   const handleBookConsultation= () => {
    if(isAuthenticated) {
        router.push('/doctor-list');
    }else{
        router.push('/signup/patient')
    }
   }


    const handleCategoryClick = (categoryTitle:string) => {
           if(isAuthenticated){
            router.push(`/doctor-list?category=${categoryTitle}`)
           }else{
            router.push('/signup/patient')
           }
    }
  const headingLine = title && title.trim().length > 0 ? title : 'Connect with doctors';
  const headingHighlight = highlight && highlight.trim().length > 0 ? highlight : 'anytime, anywhere';
  const heroDescription = description && description.trim().length > 0
    ? description
    : 'Book appointments, consult via video, and manage your healthcare journey all in one secure platform';
  const primaryLabel = primaryCtaLabel && primaryCtaLabel.trim().length > 0 ? primaryCtaLabel : 'Find Doctors';
  const secondaryLabel = secondaryCtaLabel && secondaryCtaLabel.trim().length > 0 ? secondaryCtaLabel : 'Login as Doctor';

  const heroBgIcons = useMemo(() => {
    const picks = healthcareCategories.slice(0, 6);
    const placements = [
      { top: "-6%", left: "6%", size: 96, opacity: 0.12, dur: "18s", delay: "-6s" },
      { top: "10%", right: "8%", size: 72, opacity: 0.1, dur: "22s", delay: "-10s" },
      { bottom: "14%", left: "10%", size: 88, opacity: 0.1, dur: "26s", delay: "-14s" },
      { bottom: "-8%", right: "18%", size: 110, opacity: 0.12, dur: "30s", delay: "-18s" },
      { top: "42%", left: "-2%", size: 64, opacity: 0.08, dur: "24s", delay: "-12s" },
      { top: "46%", right: "-1%", size: 64, opacity: 0.08, dur: "20s", delay: "-8s" },
    ];

    return picks.map((cat, i) => ({ cat, style: placements[i] }));
  }, []);

  return (
    <section ref={sectionRef} className='relative overflow-hidden py-20 px-4 bg-gradient-to-b from-blue-50 to-white'>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_55%)]" />
          {heroBgIcons.map(({ cat, style }, idx) => (
            <div
              key={`${cat.id}-${idx}`}
              className="absolute text-blue-600/30 mo-hero-float"
              style={
                {
                  ...style,
                  width: `${style.size}px`,
                  height: `${style.size}px`,
                  opacity: style.opacity,
                  ["--mo-dur" as any]: style.dur,
                  ["--mo-delay" as any]: style.delay,
                } as React.CSSProperties
              }
            >
              <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
                <path d={cat.icon} />
              </svg>
            </div>
          ))}
        </div>

        <div className='container mx-auto text-center relative'>
            <h1
              className={`text-5xl md:text-6xl font-bold text-blue-900 leading-tight mb-6 mo-reveal ${
                isRevealed ? "mo-reveal-in" : ""
              }`}
              style={{ ["--mo-delay" as any]: "0ms" } as React.CSSProperties}
            >
                <EditableElement
                   tag="span"
                   html={headingLine}
                   isEditable={isEditable}
                   onChange={(val: string) => onUpdate?.('heroTitle', val)}
                /> <br/>
                <span className='text-blue-600'>
                    <EditableElement
                       tag="span"
                       html={headingHighlight}
                       isEditable={isEditable}
                       onChange={(val: string) => onUpdate?.('heroHighlight', val)}
                    />
                </span>
            </h1>
            <p
              className={`text-xl text-gray-600 mb-8 max-w-2xl mx-auto mo-reveal ${
                isRevealed ? "mo-reveal-in" : ""
              }`}
              style={{ ["--mo-delay" as any]: "120ms" } as React.CSSProperties}
            >
                <EditableElement
                   tag="span"
                   html={heroDescription}
                   isEditable={isEditable}
                   onChange={(val: string) => onUpdate?.('heroDescription', val)}
                />
            </p>
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 mo-reveal ${
                isRevealed ? "mo-reveal-in" : ""
              }`}
              style={{ ["--mo-delay" as any]: "220ms" } as React.CSSProperties}
            >
                     <Button onClick={handleBookConsultation} size='lg' className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full px-8 py-3 text-lg'> 
                        {primaryLabel}
                     </Button>
                     <Link href='/login/doctor'>
                        <Button size='lg' variant='outline' className='w-full border-blue-600 text-blue-600   hover:bg-blue-50 rounded-full px-8 py-3 text-lg'> 
                         {secondaryLabel}
                     </Button>
                     </Link>
                      
            </div>

            {/* Healgthcare categories */}
            <section
              className={`py-6 mo-reveal ${isRevealed ? "mo-reveal-in" : ""}`}
              style={{ ["--mo-delay" as any]: "320ms" } as React.CSSProperties}
            >
                 <div className='container mx-auto px-4'>
                 <div className='flex justify-center items-center overflow-x-auto gap-6 pb-2 scrollbar-hide mx-auto'>
                     {healthcareCategories.map((category) => (
                        <button
                         key={category.id}
                         onClick={() => handleCategoryClick(category.title)}
                         className='flex flex-col items-center min-w-[100px] group transition-transform'
                        >
                         <div
                          className={`w-12 h-12 ${category.color} rounded-2xl flex items-center justify-center mb-2 group-hover:shadow-xl transition-all duration-200`} 
                         >
                             <svg className='w-6 h-6 text-white ' fill='currentColor' viewBox='0 0 24 24'>
                                <path d={category.icon}/>
                             </svg>
                         </div>
                         <span className='text-xs font-medium text-blue-900 text-center leading-tight'>
                            {category.title}
                         </span>
                        </button>
                     ))}
                 </div>
                 </div>
            </section>

            {/* Trust Indicator */}
            <div
              className={`flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 mo-reveal ${
                isRevealed ? "mo-reveal-in" : ""
              }`}
              style={{ ["--mo-delay" as any]: "420ms" } as React.CSSProperties}
            >
                <div className='flex items-center space-x-2'>
                     <div className='w-2 h-2 bg-green-500 rounded-full'>
                     </div>
                     <span>50+ Certified Doctors</span>
                </div>
                      <div className='flex items-center space-x-2'>
                     <div className='w-2 h-2 bg-green-500 rounded-full'>
                     </div>
                     <span>500+ Satisfied Patients</span>
                </div>
                      <div className='flex items-center space-x-2'>
                     <div className='w-2 h-2 bg-green-500 rounded-full'>
                     </div>
                     <span>24/7 Available</span>
                </div>
            </div>

        </div>
    </section>
  )
}

export default LandingHero
