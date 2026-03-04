
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password - MedicsOnline',
  description: 'Reset your MedicsOnline account password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ForgotPasswordForm />
    </div>
  );
}
