import PatientPaymentsContent from "@/components/patient/PatientPaymentsContent";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-16" />}> 
      <PatientPaymentsContent />
    </Suspense>
  );
}
