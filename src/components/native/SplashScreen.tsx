export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="mb-6 animate-pulse">
          <img 
            src="/MedicsOnline_logo.png" 
            alt="MedicsOnline Logo" 
            className="w-48 h-auto"
          />
        </div>
        <p className="text-base text-gray-500 mt-2 font-medium">Healthcare Simplified</p>
      </div>
    </div>
  );
}
