import { motion } from 'framer-motion';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoleSelectionScreenProps {
  onSelect: (role: 'patient' | 'doctor') => void;
}

export default function RoleSelectionScreen({ onSelect }: RoleSelectionScreenProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col justify-center px-6 py-12">
      <div className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          Choose your role
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 text-lg"
        >
          How would you like to use MedicsOnline?
        </motion.p>
      </div>

      <div className="space-y-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSelect('patient')}
          className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-transparent hover:border-blue-200 rounded-3xl p-6 flex items-center transition-all duration-200 group"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-200">
            <User size={32} />
          </div>
          <div className="ml-6 text-left flex-1">
            <h3 className="text-xl font-bold text-gray-900">Patient</h3>
            <p className="text-gray-500 text-sm mt-1">Find doctors & book appointments</p>
          </div>
          <ArrowRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onSelect('doctor')}
          className="w-full bg-purple-50 hover:bg-purple-100 border-2 border-transparent hover:border-purple-200 rounded-3xl p-6 flex items-center transition-all duration-200 group"
        >
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-200">
            <Stethoscope size={32} />
          </div>
          <div className="ml-6 text-left flex-1">
            <h3 className="text-xl font-bold text-gray-900">Doctor</h3>
            <p className="text-gray-500 text-sm mt-1">Consult with patients & manage practice</p>
          </div>
          <ArrowRight className="text-gray-400 group-hover:text-purple-600 transition-colors" />
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-gray-500">
          Already have an account?{' '}
          <button 
            onClick={() => router.push('/login/patient')} 
            className="text-blue-600 font-semibold hover:underline"
          >
            Log in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
