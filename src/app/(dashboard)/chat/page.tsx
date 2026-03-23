"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { userAuthStore } from "@/store/authStore";
import { useAppointmentStore, Appointment } from "@/store/appointmentStore";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MessageSquare, Image as ImageIcon, Mic } from "lucide-react";
import Header from "@/components/landing/Header";
import { useAppDetection } from "@/hooks/use-app-detection";

interface Message {
  id: string;
  appointment_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatPreview {
  appointment?: Appointment;
  partnerName: string;
  partnerImage?: string;
  lastMessage?: Message;
  unreadCount: number;
  timestamp: number;
  isSupport?: boolean;
  partnerId?: string;
}

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function ChatListPage() {
  const isApp = useAppDetection();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = userAuthStore();
  const { appointments, fetchAppointments, loading: aptLoading } = useAppointmentStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [fetchingMsgs, setFetchingMsgs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (!authLoading) router.push("/login/patient");
      return;
    }
    fetchAppointments(user.type as "patient" | "doctor");

    // Track when user opens the chats list globally
    supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then();
  }, [isAuthenticated, user, authLoading, router, fetchAppointments]);

  useEffect(() => {
    if (!user || appointments.length === 0) {
      setFetchingMsgs(false);
      return;
    }

    const loadMessages = async () => {
      const aptIds = appointments.map(a => a._id);
      
      const { data, error } = await supabase
        .from('appointment_messages')
        .select('*')
        .in('appointment_id', aptIds)
        .order('created_at', { ascending: false });

      if (data) {
        setMessages(data);
      }
      setFetchingMsgs(false);
    };

    const loadAnnouncements = async () => {
      const typeStr = user.type === 'doctor' ? 'doctors' : 'patients';
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .or(`audience.eq.all,audience.eq.${typeStr},and(audience.eq.user,target_user_id.eq.${user.id})`)
        .order('created_at', { ascending: false });
      
      if (data) {
        setAnnouncements(data);
      }
    };

    loadMessages();
    loadAnnouncements();

    // Setup realtime listener for any new message across all conversations
    const channel = supabase
      .channel('public:appointment_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointment_messages'
      }, (payload) => {
        const newMsg = payload.new as Message;
        // Verify it belongs to one of our appointments
        if (appointments.some(a => a._id === newMsg.appointment_id)) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'appointment_messages'
      }, (payload) => {
        const updatedMsg = payload.new as Message;
        if (appointments.some(a => a._id === updatedMsg.appointment_id)) {
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, appointments]);

  const chatPreviews = useMemo(() => {
    if (!user) return [];

    const isDoctor = user.type === "doctor";
    const map = new Map<string, ChatPreview>();

    // Initial group by partner
    appointments.forEach(apt => {
      const hasMessages = messages.some(m => m.appointment_id === apt._id);
      const isMessaging = apt.consultationType === "Messaging" && apt.paymentStatus === "success";
      
      if (!hasMessages && !isMessaging) return;

      const partner = isDoctor ? apt.patientId : apt.doctorId;
      if (!partner || !partner._id) return;
      
      const partnerId = partner._id;

      const partnerMessages = messages.filter(m => m.appointment_id === apt._id);
      const unreadCount = partnerMessages.filter(m => m.sender_id === partnerId && !(m as any).is_read).length;

      if (!map.has(partnerId)) {
        map.set(partnerId, {
          appointment: apt,
          partnerName: partner.name || "Unknown",
          partnerImage: partner.profileImage,
          unreadCount: unreadCount,
          timestamp: new Date(apt.createdAt || apt.slotStartIso || Date.now()).getTime(),
          partnerId,
        });
      } else {
        const existing = map.get(partnerId)!;
        existing.unreadCount += unreadCount;
      }
    });

    // Process messages (which are already sorted newest first)
    messages.forEach(msg => {
      // Find the appointment to know the partner
      const apt = appointments.find(a => a._id === msg.appointment_id);
      if (!apt) return;
      const partner = isDoctor ? apt.patientId : apt.doctorId;
      if (!partner || !partner._id) return;

      const preview = map.get(partner._id);
      if (preview) {
        if (!preview.lastMessage) {
          preview.lastMessage = msg;
          preview.timestamp = new Date(msg.created_at).getTime();
          // Set the appointment to the most recent message's appointment so we route correctly
          preview.appointment = apt;
        }
      }
    });

    let results = Array.from(map.values());
    
    // Inject Support Announcements
    if (announcements.length > 0) {
      const latestAnn = announcements[0];
      results.push({
        isSupport: true,
        partnerName: "MedicsOnline Support",
        partnerImage: "/images/medics-logo.png",
        unreadCount: 0,
        timestamp: new Date(latestAnn.created_at).getTime(),
        lastMessage: {
          id: latestAnn.id,
          appointment_id: "support",
          sender_id: "support",
          content: `${latestAnn.title} - ${latestAnn.message}`,
          created_at: latestAnn.created_at,
        }
      });
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p => p.partnerName.toLowerCase().includes(q));
    }

    // Sort by most recent
    results.sort((a, b) => b.timestamp - a.timestamp);

    return results;
  }, [appointments, messages, user, searchQuery]);

  useEffect(() => {
    const checkOnline = async () => {
      const pIds = chatPreviews.map(p => p.partnerId).filter(Boolean) as string[];
      if (pIds.length === 0) return;
      
      const { data } = await supabase.from('profiles').select('id, last_seen').in('id', pIds);
      if (data) {
        const now = new Date().getTime();
        const status: Record<string, boolean> = {};
        data.forEach(d => {
          if (d.last_seen) {
             status[d.id] = (now - new Date(d.last_seen).getTime()) < 120000;
          } else {
             status[d.id] = false;
          }
        });
        setOnlineStatus(status);
      }
    };

    checkOnline();
    const interval = setInterval(checkOnline, 30000);
    return () => clearInterval(interval);
  }, [chatPreviews.length, user?.type]);

  if (authLoading || (!user && !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const renderMessageContent = (content: string) => {
    if (content.startsWith("[IMAGE]")) {
      return (
        <span className="flex items-center gap-1 text-gray-500">
          <ImageIcon className="w-3.5 h-3.5" /> Photo
        </span>
      );
    }
    if (content.startsWith("[AUDIO]")) {
      return (
        <span className="flex items-center gap-1 text-gray-500">
          <Mic className="w-3.5 h-3.5" /> Voice message
        </span>
      );
    }
    return <span className="truncate">{content}</span>;
  };

  return (
    <>
      <Header showDashboardNav={true} />

      <main className={`min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] ${isApp ? 'pt-4' : 'pt-20'}`}>
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header Area */}
          <div className="mb-6 sticky top-16 z-10 bg-gray-50/95 backdrop-blur pt-2 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10 rounded-full bg-white border-gray-200 shadow-sm focus-visible:ring-blue-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="space-y-3">
            {(fetchingMsgs || aptLoading) && chatPreviews.length === 0 ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : chatPreviews.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
                <p className="text-gray-500 mt-1 text-sm">When you have a messaging consultation or a call log, they will appear here.</p>
              </div>
            ) : (
              chatPreviews.map((preview) => {
                const isMeLast = preview.lastMessage?.sender_id === user?.id;
                
                return (
                  <Card 
                    key={preview.isSupport ? "support" : preview.appointment?._id}
                    className="overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors border-transparent shadow-sm hover:shadow-md hover:border-gray-200 group"
                    onClick={() => {
                       if (preview.isSupport) router.push(`/chat/support`);
                       else if (preview.appointment) router.push(`/chat/${preview.appointment._id}`);
                    }}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 border shadow-sm">
                          <AvatarImage src={preview.partnerImage} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
                            {preview.partnerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {preview.partnerId && onlineStatus[preview.partnerId] && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold truncate pr-4 text-[1.05rem] ${preview.unreadCount > 0 ? "text-gray-900" : "text-gray-800"}`}>
                            {!preview.isSupport && user?.type === "patient" ? "Dr. " : ""}{preview.partnerName}
                          </h3>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {preview.lastMessage && (
                              <span className={`text-xs ${preview.unreadCount > 0 ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}>
                                {getRelativeTime(preview.lastMessage.created_at)}
                              </span>
                            )}
                            {preview.unreadCount > 0 && (
                              <div className="bg-blue-600 text-white text-[10px] px-1.5 h-[18px] rounded-full min-w-[1.2rem] flex items-center justify-center font-bold">
                                {preview.unreadCount > 99 ? "99+" : preview.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 truncate w-full">
                          {preview.lastMessage ? (
                            <div className="flex items-center gap-1.5 truncate">
                              {isMeLast && <span className="text-[10px] text-gray-400 font-medium tracking-wide">You:</span>}
                              <span className="truncate">{renderMessageContent(preview.lastMessage.content)}</span>
                            </div>
                          ) : (
                            <span className="italic text-gray-400">Tap to start chatting...</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </>
  );
}
