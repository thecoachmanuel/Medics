"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { userAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function SupportChatPage() {
  const router = useRouter();
  const { user } = userAuthStore();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchAnnouncements = async () => {
      const typeStr = user.type === 'doctor' ? 'doctors' : 'patients';
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or(`audience.eq.all,audience.eq.${typeStr},and(audience.eq.user,target_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setAnnouncements(data);
      }
      setIsLoading(false);
    };
    
    fetchAnnouncements();

    // Setup realtime listener for new announcements
    const channel = supabase
      .channel('public:announcements')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements'
      }, (payload) => {
        const newAnn = payload.new as Announcement;
        const audience = payload.new.audience;
        // Check if announcement applies to user
        if (
          audience === 'all' || 
          audience === (user.type === 'doctor' ? 'doctors' : 'patients') || 
          (audience === 'user' && payload.new.target_user_id === user.id)
        ) {
          setAnnouncements(prev => {
            if (prev.some(a => a.id === newAnn.id)) return prev;
            return [...prev, newAnn];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [announcements]);

  // Visual Viewport Keyboard Fix for iOS Safari
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const updateSize = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${vv.height}px`;
        containerRef.current.style.top = `${vv.offsetTop}px`;
      }
      setTimeout(() => {
         if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
         }
      }, 50);
    };
    vv.addEventListener('resize', updateSize);
    vv.addEventListener('scroll', updateSize);
    updateSize(); // Initial set
    return () => {
      vv.removeEventListener('resize', updateSize);
      vv.removeEventListener('scroll', updateSize);
    };
  }, []);

  const renderDateDivider = (currentDateStr: string, prevDateStr?: string) => {
    const current = new Date(currentDateStr);
    const prev = prevDateStr ? new Date(prevDateStr) : null;

    if (
      prev &&
      current.getDate() === prev.getDate() &&
      current.getMonth() === prev.getMonth() &&
      current.getFullYear() === prev.getFullYear()
    ) {
      return null;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dividerText = "";
    if (
      current.getDate() === today.getDate() &&
      current.getMonth() === today.getMonth() &&
      current.getFullYear() === today.getFullYear()
    ) {
      dividerText = "Today";
    } else if (
      current.getDate() === yesterday.getDate() &&
      current.getMonth() === yesterday.getMonth() &&
      current.getFullYear() === yesterday.getFullYear()
    ) {
      dividerText = "Yesterday";
    } else {
      dividerText = current.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return (
      <div className="flex justify-center my-4 w-full">
        <div className="bg-gray-200/50 backdrop-blur-sm text-gray-600 text-[11px] py-1 px-3 rounded-lg font-medium shadow-sm">
          {dividerText}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const partnerName = "MedicsOnline Support";
  const partnerImage = "/images/medics-logo.png";

  return (
    <div 
      ref={containerRef}
      className="fixed inset-x-0 z-50 flex flex-col bg-gray-50 md:max-w-2xl md:mx-auto md:border-x border-gray-200 overflow-hidden"
      style={{ top: 0, height: '100dvh' }}
    >
      {/* Top Header */}
      <div className="shrink-0 flex px-4 py-3 md:py-4 items-center bg-white border-b border-gray-100 z-10 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] space-x-3 transition-all relative">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full -ml-2 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10 border shadow-sm">
          <AvatarImage src={partnerImage} alt={partnerName} />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
            <ShieldCheck className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-1.5">
            {partnerName}
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </h2>
          <span className="text-[11px] text-green-600 font-medium tracking-wide uppercase">
             Official Channel
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F2F4F7]" ref={scrollRef}>
         {announcements.length === 0 && !isLoading && (
            <div className="text-center text-gray-400 text-sm mt-10">No announcements yet.</div>
         )}
         {isLoading && (
            <div className="flex justify-center mt-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
         )}

        {announcements.map((msg, idx) => {
          const showAvatar = idx === 0 || new Date(announcements[idx - 1].created_at).getTime() < new Date(msg.created_at).getTime() - 60000;
          
          return (
            <React.Fragment key={msg.id}>
              {renderDateDivider(msg.created_at, idx > 0 ? announcements[idx - 1].created_at : undefined)}
              <div className={`flex w-full justify-start items-end space-x-2`}>
                 <div className="w-8 shrink-0 relative">
                   {showAvatar ? (
                     <Avatar className="w-8 h-8">
                        <AvatarImage src={partnerImage} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <ShieldCheck className="w-4 h-4" />
                        </AvatarFallback>
                     </Avatar>
                   ) : <div className="w-8 h-8" />}
                 </div>

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-[1.2rem] px-4 pt-3 pb-2 text-[0.95rem] shadow-sm leading-relaxed overflow-hidden flex flex-col bg-white text-gray-800 rounded-bl-sm border border-gray-200 pr-4`}>
                <div className="mb-1 font-bold text-gray-900 leading-snug">
                  {msg.title}
                </div>
                <div className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                  {msg.message}
                </div>
                <div className={`text-[10px] self-end mt-1 font-medium tracking-tight text-gray-400`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </React.Fragment>
          );
        })}
      </div>

      {/* Input Box mimicking the image UI */}
      <div className="bg-gray-50/80 px-4 py-3 md:py-4 z-10 w-full mb-[env(safe-area-inset-bottom)] flex justify-center items-center h-[76px]">
         <div className="bg-gray-200/60 rounded-full px-5 py-2.5 text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2 shadow-inner border border-gray-200">
           <ShieldCheck className="w-4 h-4 text-gray-400" />
           Only admins can send messages here
         </div>
      </div>

    </div>
  );
}
