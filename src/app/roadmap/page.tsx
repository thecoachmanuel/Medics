import React from "react";
import { cookies } from "next/headers";
import { getRoadmapProgress } from "@/actions/roadmap-actions";
import RoadmapClient from "./RoadmapClient";

export const dynamic = 'force-dynamic';

export default async function RoadmapPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("medics_admin")?.value === "1";
  
  const progress = await getRoadmapProgress();

  return <RoadmapClient isAdmin={isAdmin} progress={progress} />;
}
