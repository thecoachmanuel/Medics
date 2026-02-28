"use server";

import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function toggleRoadmapItemAction(weekIndex: number, itemIndex: number, completed: boolean) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("medics_admin")?.value === "1";

  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = getServiceSupabase();

  // Fetch current config
  const { data: existing, error: loadError } = await supabase
    .from("homepage_content")
    .select("id,config")
    .limit(1)
    .maybeSingle();

  if (loadError) {
    return { success: false, error: "Database error" };
  }

  const config = (existing?.config || {}) as any;
  const roadmapProgress = config.roadmapProgress || {};
  
  // Create a unique key for the item
  const key = `${weekIndex}-${itemIndex}`;
  
  // Update the status
  roadmapProgress[key] = completed;
  
  const newConfig = {
    ...config,
    roadmapProgress
  };

  // Save back
  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("homepage_content")
      .update({ config: newConfig })
      .eq("id", existing.id);
      
    if (updateError) return { success: false, error: "Update failed" };
  } else {
    const { error: insertError } = await supabase
      .from("homepage_content")
      .insert({ config: newConfig });
      
    if (insertError) return { success: false, error: "Insert failed" };
  }

  revalidatePath("/roadmap");
  return { success: true };
}

export async function getRoadmapProgress() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("homepage_content")
    .select("config")
    .limit(1)
    .maybeSingle();

  if (error || !data?.config) return {};
  
  return (data.config as any).roadmapProgress || {};
}
