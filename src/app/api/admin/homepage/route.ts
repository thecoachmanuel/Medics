import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

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
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("homepage_content")
    .select("id,config")
    .limit(1)
    .maybeSingle<HomepageRow>();

  if (error) {
    return NextResponse.json(
      { error: "Unable to load homepage content" },
      { status: 500 },
    );
  }

  return NextResponse.json({ config: data?.config ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 },
    );
  }

  const config = body as HomepageContent;

  const { data: existing, error: loadError } = await supabase
    .from("homepage_content")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (loadError) {
    return NextResponse.json(
      { error: "Unable to load homepage content" },
      { status: 500 },
    );
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("homepage_content")
      .update({ config })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Unable to update homepage content" },
        { status: 500 },
      );
    }
  } else {
    const { error: insertError } = await supabase
      .from("homepage_content")
      .insert({ config });

    if (insertError) {
      return NextResponse.json(
        { error: "Unable to save homepage content" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
