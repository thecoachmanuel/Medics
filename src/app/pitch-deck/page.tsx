"use client";
import React from "react";
import Link from "next/link";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="page-section break-after-page print:break-after-page w-[1123px] max-w-full mx-auto bg-white rounded-xl shadow-sm border p-10 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
    <div className="prose prose-slate max-w-none text-gray-700">{children}</div>
  </section>
);

export default function PitchDeckPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="mx-auto w-[1123px] max-w-full flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold">M</div>
            <div className="text-lg font-semibold">MedicsOnline</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white text-sm px-4 py-2 hover:bg-blue-700 shadow"
            >
              Download PDF
            </button>
            <Link href="/" className="text-sm text-blue-700 hover:underline">Go to site</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .page-section { box-shadow: none !important; border: none !important; margin: 0 0 0 0 !important; page-break-inside: avoid; }
          .print\:break-after-page { break-after: page; }
          .sticky { position: static !important; }
        }
      `}</style>

      <main className="px-4 py-8 print:px-0">
        {/* Cover */}
        <section className="page-section break-after-page print:break-after-page relative overflow-hidden w-[1123px] max-w-full mx-auto rounded-xl border bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold leading-tight">MedicsOnline</h1>
            <p className="mt-3 text-lg text-blue-100">Nigeria’s digital clinic for fast, secure video and voice consultations with licensed doctors.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold">Category</div>
                <div className="text-blue-100">Telemedicine / HealthTech</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold">Stage</div>
                <div className="text-blue-100">MVP live with real-time capabilities</div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10" />
        </section>

        <Section title="Problem">
          <ul>
            <li>Nigerians face long wait times, traffic, and limited access to specialists.</li>
            <li>Care fragmentation: poor follow-up, scattered records, and no unified payments.</li>
            <li>Doctors lack a compliant, easy-to-use platform with automated payouts.</li>
          </ul>
        </Section>

        <Section title="Solution">
          <ul>
            <li>End-to-end digital clinic: discovery, booking, HD video/voice consultations, payments, and follow-up.</li>
            <li>Built-in notifications, real-time updates, and secure records with role-based access.</li>
            <li>Automated doctor payouts with bank details management and status tracking.</li>
          </ul>
        </Section>

        <Section title="Product Overview">
          <ul>
            <li>Next.js App Router with Server Components for performance and SEO.</li>
            <li>Supabase for auth, Postgres, RLS security, and real-time channels.</li>
            <li>Admin dashboard with users, appointments, payments, analytics and notifications.</li>
            <li>Patient & Doctor portals with schedules, payments, payouts, and messaging primitives.</li>
          </ul>
        </Section>

        <Section title="Market Opportunity">
          <ul>
            <li>200M+ population; high mobile usage; growing acceptance of remote care.</li>
            <li>Chronic shortages of specialists outside major cities.</li>
            <li>Large addressable market across primary care, mental health, pediatrics, and more.</li>
          </ul>
        </Section>

        <Section title="Business Model">
          <ul>
            <li>Commission on each paid consultation.</li>
            <li>Tiered subscription for doctors (premium visibility, analytics, tools).</li>
            <li>Future: B2B partnerships with HMOs/insurers and employer health plans.</li>
          </ul>
        </Section>

        <Section title="Traction & Features">
          <ul>
            <li>Working MVP with real-time notifications and automated payout requests.</li>
            <li>Admin CRUD for doctors and patients; appointment creation and status controls.</li>
            <li>Responsive UI with mobile-first flows and printable/exportable reports.</li>
          </ul>
        </Section>

        <Section title="Go-To-Market">
          <ul>
            <li>Target early adopters in Lagos, Abuja, Port Harcourt; partner clinics and labs.</li>
            <li>Influencer-led health education; community screenings and tele-triage pilots.</li>
            <li>B2B pilots with SMEs and remote-work employers.</li>
          </ul>
        </Section>

        <Section title="Competition & Differentiation">
          <ul>
            <li>Local telemedicine apps; global players with limited localization.</li>
            <li>Differentiators: Nigeria-first UX, real-time platform, automated payouts, strict RLS security.</li>
            <li>Open integrations approach with labs, pharmacies, and payment networks.</li>
          </ul>
        </Section>

        <Section title="Technology & Security">
          <ul>
            <li>Stack: Next.js 15, TypeScript strict, Supabase (Auth, Postgres, RLS, Realtime), Tailwind.</li>
            <li>RLS ensures least-privilege access; notifications and channels for real-time updates.</li>
            <li>Server Actions for safe mutations; robust input validation and error handling.</li>
          </ul>
        </Section>

        <Section title="Roadmap (Next 12 Months)">
          <ol>
            <li>eRx and lab orders; encrypted attachments and structured notes.</li>
            <li>Doctor availability calendars; improved reminders; visit summaries.</li>
            <li>HMO/insurer integrations; multi-tenant organization accounts.</li>
            <li>Analytics for care outcomes; ML triage assistance.</li>
          </ol>
        </Section>

        <Section title="Team">
          <ul>
            <li>Founding team: full‑stack engineering, product, and clinical advisors.</li>
            <li>Experience shipping at scale; focus on reliability, privacy, and delightful UX.</li>
          </ul>
        </Section>

        <Section title="Ask & Use of Funds">
          <ul>
            <li>Capital to accelerate provider onboarding, compliance, and GTM.</li>
            <li>Hiring: Engineering, Ops, Provider Success, Clinical Partnerships.</li>
            <li>Runway for integrations, growth, and regulatory milestones.</li>
          </ul>
        </Section>

        <Section title="Contact">
          <div className="text-sm">
            <div className="font-semibold">MedicsOnline</div>
            <div>Email: medicsonlineng@gmail.com</div>
            <div>Phone: +234-816-888-2014</div>
            <div>Web: https://medicsonline.ng (demo)</div>
          </div>
        </Section>
      </main>
    </div>
  );
}

