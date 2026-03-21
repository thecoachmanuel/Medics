import DoctorPaymentsContent from "@/components/doctor/DoctorPaymentsContent";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-16" />}> 
      <DoctorPaymentsContent />
    </Suspense>
  );
}
