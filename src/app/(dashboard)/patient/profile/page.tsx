import ProfilePage from "@/components/ProfilePage/ProfilePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Profile | MedicsOnline",
  description: "View and manage your doctor profile in MedicsOnline platform.",
};

export default function Page() {
  return  <ProfilePage userType='patient'/>
}
