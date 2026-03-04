
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password - MedicsOnline',
  description: 'Set a new password for your MedicsOnline account.',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ResetPasswordForm />
    </div>
  );
}
