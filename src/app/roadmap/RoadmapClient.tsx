"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle2, Circle, Calendar, MapPin, Globe, Users, TrendingUp, Building2, ShieldCheck, Zap, Server, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/landing/Header";
import { toggleRoadmapItemAction } from "@/actions/roadmap-actions";
import { cn } from "@/lib/utils";

// Helper to format date ranges
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getRoadmapDates = () => {
  const today = new Date();
  
  // Week 1-2 (14 days)
  const week1Start = new Date(today);
  const week1End = new Date(today);
  week1End.setDate(today.getDate() + 13);

  // Week 3 (7 days)
  const week3Start = new Date(week1End);
  week3Start.setDate(week3Start.getDate() + 1);
  const week3End = new Date(week3Start);
  week3End.setDate(week3End.getDate() + 6);

  // Week 4 (7 days)
  const week4Start = new Date(week3End);
  week4Start.setDate(week4Start.getDate() + 1);
  const week4End = new Date(week4Start);
  week4End.setDate(week4End.getDate() + 6);

  // Week 5 (7 days)
  const week5Start = new Date(week4End);
  week5Start.setDate(week5Start.getDate() + 1);
  const week5End = new Date(week5Start);
  week5End.setDate(week5End.getDate() + 6);

  // Week 6+ (Ongoing)
  const week6Start = new Date(week5End);
  week6Start.setDate(week6Start.getDate() + 1);

  return {
    week1: `${formatDate(week1Start)} - ${formatDate(week1End)}`,
    week3: `${formatDate(week3Start)} - ${formatDate(week3End)}`,
    week4: `${formatDate(week4Start)} - ${formatDate(week4End)}`,
    week5: `${formatDate(week5Start)} - ${formatDate(week5End)}`,
    week6: `${formatDate(week6Start)} Onwards`,
  };
};

const dates = getRoadmapDates();

const initialRoadmapData = [
  {
    week: "Weeks 1-2",
    dateRange: dates.week1,
    title: "Digital Foundation & Infrastructure",
    description: "Establishing the secure technical bedrock for MedicsOnline.",
    icon: Server,
    status: "in-progress",
    items: [
      { text: "Purchase Domain & Secure High-Performance Hosting", completed: true },
      { text: "Implement SSL Certificates & Security Protocols", completed: true },
      { text: "Setup Corporate Emails & Internal Communication", completed: false },
      { text: "Deploy Landing Page & Coming Soon Teaser", completed: false },
    ],
  },
  {
    week: "Week 3",
    dateRange: dates.week3,
    title: "Business Registration & Social Media",
    description: "Formalizing our business entity and establishing online presence.",
    icon: Building2,
    status: "upcoming",
    items: [
      { text: "CAC Business Name Registration", completed: false },
      { text: "Create & Optimize Social Media Pages (LinkedIn, Instagram, Twitter)", completed: false },
      { text: "Design Brand Assets (Logo, Banners, Templates)", completed: false },
      { text: "Setup Linktree/Bio Links for Early Access", completed: false },
    ],
  },
  {
    week: "Week 4",
    dateRange: dates.week4,
    title: "Marketing Blitz (Physical & Online)",
    description: "Aggressive brand awareness campaign across channels.",
    icon: Globe,
    status: "upcoming",
    items: [
      { text: "Launch Targeted Social Media Ads (Meta, LinkedIn)", completed: false },
      { text: "Distribute Physical Flyers in Key Lagos Areas", completed: false },
      { text: "Content Marketing (Health Blogs, SEO Optimization)", completed: false },
      { text: "Partner with Local Lagos Pharmacies & Clinics", completed: false },
    ],
  },
  {
    week: "Week 5",
    dateRange: dates.week5,
    title: "Soft Launch & Onboarding",
    description: "Controlled release to test real-world performance.",
    icon: Users,
    status: "upcoming",
    items: [
      { text: "Open Beta to First 100 Lagos Users", completed: false },
      { text: "Onboard First 20 Verified Doctors", completed: false },
      { text: "Feedback Loop & Rapid Iteration", completed: false },
      { text: "Stress Test Support Channels", completed: false },
    ],
  },
  {
    week: "Week 6+",
    dateRange: dates.week6,
    title: "Growth & Scaling",
    description: "Expanding reach and enhancing platform capabilities.",
    icon: TrendingUp,
    status: "upcoming",
    items: [
      { text: "Official Public Launch Event", completed: false },
      { text: "Scale Server Infrastructure", completed: false },
      { text: "Expand Doctor Network Nationwide", completed: false },
      { text: "Introduce Corporate & Premium Plans", completed: false },
    ],
  },
];

interface RoadmapClientProps {
  isAdmin: boolean;
  progress: Record<string, boolean>;
}

export default function RoadmapClient({ isAdmin, progress }: RoadmapClientProps) {
  const [localProgress, setLocalProgress] = useState(progress);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  const handleToggle = (weekIndex: number, itemIndex: number, currentStatus: boolean) => {
    if (!isAdmin) return;
    
    const key = `${weekIndex}-${itemIndex}`;
    const newStatus = !currentStatus;
    
    setLocalProgress(prev => ({
      ...prev,
      [key]: newStatus
    }));

    startTransition(async () => {
      const result = await toggleRoadmapItemAction(weekIndex, itemIndex, newStatus);
      if (!result.success) {
        // Revert on failure
        setLocalProgress(prev => ({
          ...prev,
          [key]: currentStatus
        }));
        alert("Failed to update status");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto mb-16 text-center">
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
            {initialRoadmapData.map((phase, index) => {
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
                        {phase.items.map((item, i) => {
                          const key = `${index}-${i}`;
                          // Use local progress if available, otherwise default to item.completed
                          const isItemCompleted = localProgress[key] ?? item.completed;
                          
                          return (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                              <button 
                                onClick={() => handleToggle(index, i, isItemCompleted)}
                                disabled={!isAdmin || isPending}
                                className={cn(
                                  "shrink-0 mt-0.5 focus:outline-none rounded-full",
                                  isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"
                                )}
                              >
                                {isItemCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-300" />
                                )}
                              </button>
                              <span className={cn(
                                "transition-colors",
                                isItemCompleted ? "line-through text-gray-400" : ""
                              )}>
                                {item.text}
                              </span>
                            </li>
                          );
                        })}
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
