import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

type HomepageFaqItem = {
  question: string;
  answer: string;
};

type HomepageStep = {
  title: string;
  description: string;
};

type HomepageHighlight = {
  text: string;
};

type HomepageTestimonial = {
  rating: number;
  text: string;
  author: string;
  location: string;
  bgColor: string;
};

type HomepageContent = {
  siteName: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  howTitle: string;
  howSubtitle: string;
  howSteps: HomepageStep[];
  howHighlights: HomepageHighlight[];
  faqTitle: string;
  faqSubtitle: string;
  faqItems: HomepageFaqItem[];
  footerIntro: string;
  footerContactPhone: string;
  footerContactEmail: string;
  footerContactLocation: string;
  testimonials?: HomepageTestimonial[];
};

type HomepageRow = {
  id: string;
  config: HomepageContent | null;
};

export async function GET() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("homepage_content")
    .select("id,config")
    .limit(1)
    .maybeSingle<HomepageRow>();

  if (error) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({ config: data?.config ?? null });
}
