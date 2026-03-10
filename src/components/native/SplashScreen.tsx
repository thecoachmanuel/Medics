import { Stethoscope } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="bg-blue-600 p-5 rounded-3xl mb-6 shadow-xl shadow-blue-200 animate-pulse">
          <Stethoscope className="w-16 h-16 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">MedicsOnline</h1>
        <p className="text-base text-gray-500 mt-2 font-medium">Healthcare Simplified</p>
      </div>
    </div>
  );
}
