import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Stethoscope, Video, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 1,
    title: "Find Expert Doctors",
    description: "Connect with certified specialists from around the world for top-tier medical advice.",
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: 2,
    title: "Video Consultations",
    description: "Get diagnosed and treated from the comfort of your home via secure video calls.",
    icon: Video,
    color: "bg-purple-100 text-purple-600"
  },
  {
    id: 3,
    title: "Manage Appointments",
    description: "Book and manage your medical appointments with our easy-to-use scheduling system.",
    icon: CalendarCheck,
    color: "bg-emerald-100 text-emerald-600"
  }
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Skip Button */}
      <div className="absolute top-12 right-6 z-30">
        <button 
          onClick={handleSkip}
          className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-8 pb-20 pt-20 relative overflow-hidden">
        {/* Background blobs for decoration */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[50%] bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[50%] bg-purple-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center w-full max-w-sm z-10"
          >
            <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm ${slides[currentSlide].color}`}>
              <CurrentIcon className="w-14 h-14" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">{slides[currentSlide].title}</h2>
            <p className="text-gray-500 leading-relaxed text-lg">{slides[currentSlide].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="px-6 pb-12 pt-4 bg-white/80 backdrop-blur-sm z-20">
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <div 
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Button 
            onClick={handleNext} 
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
        >
            {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
            {currentSlide !== slides.length - 1 && <ChevronRight className="ml-2 w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
