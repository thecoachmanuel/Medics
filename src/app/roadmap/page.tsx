import React from "react";
import { CheckCircle2, Circle, Calendar, MapPin, Globe, Users, TrendingUp, Building2, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/landing/Header";

// Roadmap Data
const roadmapData = [
  {
    week: "Week 1",
    dateRange: "Feb 28 - Mar 6, 2026",
    title: "Foundation & Compliance",
    description: "Establishing the legal and technical bedrock for MedicsOnline.",
    icon: Building2,
    status: "in-progress",
    items: [
      { text: "Purchase Domain & Secure Hosting", completed: true },
      { text: "Implement SSL & Security Protocols", completed: true },
      { text: "Legal Incorporation (CAC Registration)", completed: false },
      { text: "Setup Corporate Banking & Payment Gateways", completed: false },
    ],
  },
  {
    week: "Week 2",
    dateRange: "Mar 7 - Mar 13, 2026",
    title: "Platform Polish & QA",
    description: "Ensuring a bug-free, secure, and seamless user experience.",
    icon: ShieldCheck,
    status: "upcoming",
    items: [
      { text: "Finalize Core Features (Video, Payments)", completed: false },
      { text: "Security Audit & Penetration Testing", completed: false },
      { text: "Internal Beta Testing (Closed Group)", completed: false },
      { text: "UI/UX Refinements & Bug Fixes", completed: false },
    ],
  },
  {
    week: "Week 3",
    dateRange: "Mar 14 - Mar 20, 2026",
    title: "Physical Infrastructure",
    description: "Setting up the physical headquarters for operations.",
    icon: MapPin,
    status: "upcoming",
    items: [
      { text: "Secure Office Space (Lagos/Abuja)", completed: false },
      { text: "Procure Office Furniture & Equipment", completed: false },
      { text: "Install High-Speed Enterprise Internet", completed: false },
      { text: "Recruit Operations & Support Team", completed: false },
    ],
  },
  {
    week: "Week 4",
    dateRange: "Mar 21 - Mar 27, 2026",
    title: "Pre-Launch Marketing",
    description: "Building anticipation and gathering early adopters.",
    icon: Globe,
    status: "upcoming",
    items: [
      { text: "Launch Social Media Teasers & Branding", completed: false },
      { text: "Strategic Partnerships (Hospitals, Pharmacies)", completed: false },
      { text: "Content Marketing (Health Blogs, Tips)", completed: false },
      { text: "Early Access Sign-up Campaign", completed: false },
    ],
  },
  {
    week: "Week 5",
    dateRange: "Mar 28 - Apr 3, 2026",
    title: "Soft Launch",
    description: "Controlled release to test real-world performance.",
    icon: Users,
    status: "upcoming",
    items: [
      { text: "Open Beta to First 100 Users", completed: false },
      { text: "Onboard First 20 Verified Doctors", completed: false },
      { text: "Feedback Loop & Rapid Iteration", completed: false },
      { text: "Stress Test Support Channels", completed: false },
    ],
  },
  {
    week: "Week 6",
    dateRange: "Apr 4 - Apr 10, 2026",
    title: "Grand Launch",
    description: "Official public release and major marketing push.",
    icon: Zap,
    status: "upcoming",
    items: [
      { text: "Official Public Launch Event", completed: false },
      { text: "Paid Advertising Blitz (Google, Socials)", completed: false },
      { text: "Press Release & Media Coverage", completed: false },
      { text: "Community Health Outreach Program", completed: false },
    ],
  },
  {
    week: "Week 7+",
    dateRange: "Apr 11, 2026 Onwards",
    title: "Growth & Scaling",
    description: "Expanding reach and enhancing platform capabilities.",
    icon: TrendingUp,
    status: "upcoming",
    items: [
      { text: "Analyze Launch Metrics & KPIs", completed: false },
      { text: "Scale Server Infrastructure", completed: false },
      { text: "Expand Doctor Network Nationwide", completed: false },
      { text: "Introduce Corporate & Premium Plans", completed: false },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 px-3 py-1 text-sm font-medium">
            Strategic Roadmap 2026
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Building the Future of <span className="text-blue-600">Healthcare</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Our step-by-step journey from concept to a nationwide digital health revolution. 
            Designed for transparency, execution, and scale.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />

          <div className="space-y-12 relative">
            {roadmapData.map((phase, index) => {
              const Icon = phase.icon;
              const isCompleted = phase.status === "completed";
              const isInProgress = phase.status === "in-progress";

              return (
                <div key={index} className="relative md:pl-24 group">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-0 hidden md:flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300 z-10 ${
                    isInProgress 
                      ? "bg-white border-blue-500 shadow-lg shadow-blue-100 scale-110" 
                      : isCompleted 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-white border-gray-100"
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isInProgress ? "text-blue-600" : "text-gray-400"
                    }`} />
                  </div>

                  {/* Mobile Icon (visible only on small screens) */}
                  <div className="flex items-center gap-3 mb-4 md:hidden">
                    <div className={`p-3 rounded-full ${isInProgress ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{phase.title}</h3>
                      <span className="text-sm text-gray-500 font-medium">{phase.dateRange}</span>
                    </div>
                  </div>

                  <Card className={`border transition-all duration-300 hover:shadow-md ${
                    isInProgress ? "border-blue-200 bg-blue-50/30 ring-1 ring-blue-100" : "border-gray-200 bg-white"
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                        <div className="hidden md:block">
                          <Badge variant="outline" className="mb-2 text-xs font-normal text-gray-500 border-gray-300">
                            {phase.week}
                          </Badge>
                          <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {phase.dateRange}
                          </div>
                        </div>
                        {isInProgress && (
                          <Badge className="w-fit bg-blue-600 hover:bg-blue-700">Current Phase</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl text-gray-900 hidden md:block">{phase.title}</CardTitle>
                      <CardDescription className="text-gray-600 text-base mt-1">
                        {phase.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                            )}
                            <span className={item.completed ? "line-through text-gray-400" : ""}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm">
            Roadmap is subject to adjustments based on market feedback and operational requirements.
          </p>
          <div className="mt-6">
            <a href="/contact" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-2">
              Interested in partnering? Contact Us <Users className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
