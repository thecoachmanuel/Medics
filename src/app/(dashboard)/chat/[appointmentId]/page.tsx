"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { userAuthStore } from "@/store/authStore";
import { useAppointmentStore } from "@/store/appointmentStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Mic, Paperclip, Phone, Send, Video } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Message {
  id: string;
  appointment_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const router = useRouter();
  
  const { user } = userAuthStore();
  const { appointments, fetchAppointments } = useAppointmentStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const appointment = appointments.find(a => a._id === appointmentId);

  // Poll for UI / realtime hook
  useEffect(() => {
    if (!user) return;
    if (!appointment) {
      if (user.type === "patient") fetchAppointments("patient");
      else fetchAppointments("doctor");
    }
  }, [user, appointment, fetchAppointments]);

  // Supabase messages fetch & listen
  useEffect(() => {
    if (!appointmentId) return;
    
    // Initial fetch
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('appointment_messages')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };
    
    fetchMessages();

    // Subscribe to changes
    const channel = supabase
      .channel(`chat_${appointmentId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'appointment_messages',
        filter: `appointment_id=eq.${appointmentId}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !user || !appointmentId) return;

    const messageContent = inputText.trim();
    setInputText("");

    await supabase.from('appointment_messages').insert({
      appointment_id: appointmentId,
      sender_id: user.id,
      content: messageContent
    });
  };

  if (!user || (!appointment && !isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Determine chat partner identity
  const isDoctor = user.type === "doctor";
  const partnerName = isDoctor ? appointment?.patientId?.name : appointment?.doctorId?.name;
  const partnerImage = isDoctor ? appointment?.patientId?.profileImage : appointment?.doctorId?.profileImage;

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-2xl mx-auto shadow-xl relative border-x border-gray-100 pb-[env(safe-area-inset-bottom)]">
      {/* Top Header */}
      <div className="flex px-4 py-4 md:py-6 items-center bg-white border-b sticky top-0 z-10 rounded-b-2xl shadow-sm space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10 border shadow-sm">
          <AvatarImage src={partnerImage} alt={partnerName} />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">{partnerName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{partnerName || "Patient"}</h2>
          <span className="text-xs text-gray-500 font-medium tracking-wide">Messaging Consultation</span>
        </div>
        <div className="flex space-x-1">
           <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600 rounded-full w-10 h-10">
             <Video className="w-4 h-4" />
           </Button>
           <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600 rounded-full w-10 h-10">
             <Phone className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
         {/* System generic message matching screenshot style */}
         <div className="flex justify-center my-6">
           <div className="bg-gray-100 text-gray-500 text-xs py-1.5 px-4 rounded-full font-medium">
             Consultation start time
           </div>
         </div>

         {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello!</div>
         )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);
          
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
              {!isMe ? (
                 <div className="w-8 shrink-0">
                   {showAvatar ? (
                     <Avatar className="w-8 h-8">
                        <AvatarImage src={partnerImage} />
                        <AvatarFallback>{partnerName?.charAt(0)}</AvatarFallback>
                     </Avatar>
                   ) : <div className="w-8 h-8" />}
                 </div>
              ) : null}

              <div className={`max-w-[75%] rounded-[1.2rem] px-4 py-2.5 text-[0.95rem] shadow-sm leading-relaxed
                ${isMe 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Box mimicking the image UI */}
      <div className="bg-white px-4 py-3 md:py-4 border-t sticky bottom-0">
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-2 py-1.5 border border-gray-200 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full w-9 h-9">
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-gray-700 placeholder:text-gray-400"
            />
            
            {inputText.trim() ? (
              <Button type="submit" size="icon" className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 w-9 h-9 shadow-md text-white transition-colors">
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full w-9 h-9">
                <Mic className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
