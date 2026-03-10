import ProfilePage from "@/components/ProfilePage/ProfilePage";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Patient Profile | MedicsOnline",
  description: "View and manage your doctor profile in MedicsOnline platform.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="h-16" />}> 
      <ProfilePage userType='patient'/>
    </Suspense>
  )
}
