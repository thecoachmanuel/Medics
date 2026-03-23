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
  appointment: Appointment;
  partnerName: string;
  partnerImage?: string;
  lastMessage?: Message;
  unreadCount: number;
  timestamp: number;
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
  const [fetchingMsgs, setFetchingMsgs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (!authLoading) router.push("/login/patient");
      return;
    }
    fetchAppointments(user.type as "patient" | "doctor");
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

    loadMessages();

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, appointments]);

  const chatPreviews = useMemo(() => {
    if (!user) return [];

    const isDoctor = user.type === "doctor";
    const map = new Map<string, ChatPreview>();

    // Initial group by appointments
    // We only include valid messaging appointments OR any appointment that already has messages
    appointments.forEach(apt => {
      const hasMessages = messages.some(m => m.appointment_id === apt._id);
      const isMessaging = apt.consultationType === "Messaging" && apt.paymentStatus === "success";
      
      if (!hasMessages && !isMessaging) return;

      const partner = isDoctor ? apt.patientId : apt.doctorId;
      map.set(apt._id, {
        appointment: apt,
        partnerName: partner?.name || "Unknown",
        partnerImage: partner?.profileImage,
        unreadCount: 0,
        timestamp: new Date(apt.createdAt || apt.slotStartIso || Date.now()).getTime(),
      });
    });

    // Process messages, they are already sorted descending
    messages.forEach(msg => {
      const preview = map.get(msg.appointment_id);
      if (preview) {
        if (!preview.lastMessage) {
          preview.lastMessage = msg;
          preview.timestamp = new Date(msg.created_at).getTime();
        }
        // Very basic unread indicator assuming if it's not from us it might be unread
        // (Real unread requires 'is_read' flag or tracking last open time)
        if (msg.sender_id !== user.id) {
           // We cap unread at just tracking there are some messages
           // since we don't have read receipts yet.
        }
      }
    });

    let results = Array.from(map.values());
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p => p.partnerName.toLowerCase().includes(q));
    }

    // Sort by most recent
    results.sort((a, b) => b.timestamp - a.timestamp);

    return results;
  }, [appointments, messages, user, searchQuery]);

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
                    key={preview.appointment._id}
                    className="overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors border-transparent shadow-sm hover:shadow-md hover:border-gray-200 group"
                    onClick={() => router.push(`/chat/${preview.appointment._id}`)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="w-14 h-14 border shadow-sm">
                        <AvatarImage src={preview.partnerImage} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
                          {preview.partnerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate pr-4 text-[1.05rem]">
                            {user.type === "patient" ? "Dr. " : ""}{preview.partnerName}
                          </h3>
                          {preview.lastMessage && (
                            <span className="text-xs font-medium text-gray-400 shrink-0">
                              {getRelativeTime(preview.lastMessage.created_at)}
                            </span>
                          )}
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
