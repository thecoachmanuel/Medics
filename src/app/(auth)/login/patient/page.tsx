import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: 'Patient Login - MedicsOnline',
  description: 'Sign in to your MedicsOnline account to access healthcare consultations.',
};

export default function PatientLoginPage() {
  return  <AuthForm type='login' userRole='patient'/>
}
