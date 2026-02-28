"use client";
import React from 'react'
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

  return (
    <section className='py-20 px-4 bg-gradient-to-b from-blue-50 to-white'>

        <div className='container mx-auto text-center'>
            <h1 className='text-5xl md:text-6xl font-bold text-blue-900 leading-tight mb-6'>
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
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
                <EditableElement
                   tag="span"
                   html={heroDescription}
                   isEditable={isEditable}
                   onChange={(val: string) => onUpdate?.('heroDescription', val)}
                />
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
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
            <section className='py-6'>
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
            <div className='flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600'>
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
