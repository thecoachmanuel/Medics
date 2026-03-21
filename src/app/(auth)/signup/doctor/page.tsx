import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: 'Join MedicsOnline as Healthcare Provider',
  description: 'Register as a healthcare provider on MedicsOnline to offer online consultations.',
};


export default function DoctorSignUpPage() {
  return  <AuthForm type='signup' userRole='doctor'/>
}
