"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { userAuthStore } from "@/store/authStore";
import { useAppointmentStore } from "@/store/appointmentStore";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Mic, Paperclip, Phone, Send, Video, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/cloudinary";

interface Message {
  id: string;
  appointment_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export default function ChatPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const { decrementUnread } = useChatStore();
  const router = useRouter();
  
  const { user } = userAuthStore();
  const { appointments, fetchAppointments } = useAppointmentStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Presence states
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
       alert("Only images are supported.");
       return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = (cancel = false) => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    const mr = mediaRecorderRef.current;
    
    mr.onstop = async () => {
       const stream = streamRef.current;
       stream?.getTracks().forEach(track => track.stop());
       
       if (cancel || !user) {
          audioChunksRef.current = [];
          setIsRecording(false);
          return;
       }

       const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
       audioChunksRef.current = [];
       setIsRecording(false);
       
       setIsUploading(true);
       try {
         const file = new File([audioBlob], 'audio-message.webm', { type: 'audio/webm' });
         const { url } = await uploadImage(file, "medimeet/chat-audio");
         
         const tempId = crypto.randomUUID();
         const newMsg: Message = {
           id: tempId,
           appointment_id: appointmentId,
           sender_id: user.id,
           content: `[AUDIO]${url}`,
           created_at: new Date().toISOString()
         };

         setMessages(prev => {
           if (prev.some(m => m.id === tempId)) return prev;
           return [...prev, newMsg];
         });

         const { error } = await supabase.from('appointment_messages').insert({
           id: tempId,
           appointment_id: appointmentId,
           sender_id: user.id,
           content: `[AUDIO]${url}`
         });

         if (error) {
           console.error("Audio send error:", error);
         }
       } catch (err) {
         console.error(err);
         alert("Failed to upload audio message.");
       } finally {
         setIsUploading(false);
       }
    };
    
    mr.stop();
  };
  
  const appointment = appointments.find(a => a._id === appointmentId);

  const sharedAptIds = React.useMemo(() => {
    if (!appointment) return [appointmentId];
    return appointments.filter(a => 
      a.patientId?._id === appointment.patientId?._id && 
      a.doctorId?._id === appointment.doctorId?._id
    ).map(a => a._id);
  }, [appointment, appointments, appointmentId]);

  const isDoctor = user?.type === "doctor";
  const partnerName = isDoctor ? appointment?.patientId?.name : appointment?.doctorId?.name;
  const partnerImage = isDoctor ? appointment?.patientId?.profileImage : appointment?.doctorId?.profileImage;
  const partnerId = isDoctor ? appointment?.patientId?._id : appointment?.doctorId?._id;

  // Presence hook
  useEffect(() => {
    if (!user || !partnerId) return;

    // Track that I am active right now, and keep bumping it every minute I'm on this chat
    const trackMyLastSeen = () => {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then();
    };
    trackMyLastSeen();
    const pingInterval = setInterval(trackMyLastSeen, 60000);

    // Fetch partner's latest known last_seen from DB as a solid baseline
    supabase.from('profiles').select('last_seen').eq('id', partnerId).single().then(({ data }) => {
       if (data?.last_seen) {
         setPartnerLastSeen(prev => prev ? prev : data.last_seen);
       }
    });

    const roomId = [user.id, partnerId].sort().join('_');
    const channel = supabase.channel(`presence_${roomId}`, {
      config: { presence: { key: user.id } }
    });
    
    presenceChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        if (state[partnerId]) {
           setPartnerOnline(true);
           const pState = state[partnerId][0] as any;
           setPartnerTyping(!!pState?.isTyping);
        } else {
           setPartnerOnline(false);
           setPartnerTyping(false);
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === partnerId) {
          setPartnerOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === partnerId) {
          setPartnerOnline(false);
          setPartnerTyping(false);
          setPartnerLastSeen(new Date().toISOString());
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), isTyping: false });
        }
      });

    return () => {
      clearInterval(pingInterval);
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
    };
  }, [user, partnerId]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (!user || messages.length === 0 || !appointmentId) return;

    const unreadMsgs = messages.filter(m => m.sender_id !== user.id && !m.is_read);
    if (unreadMsgs.length > 0) {
      const markAsRead = async () => {
         await supabase.from('appointment_messages').update({ is_read: true }).in('id', unreadMsgs.map(m => m.id));
         setMessages(prev => prev.map(m => unreadMsgs.some(u => u.id === m.id) ? { ...m, is_read: true } : m));
         decrementUnread(unreadMsgs.length);
      };
      markAsRead();
    }
  }, [messages.length, user, appointmentId]);

  // Send Typing Indicator
  useEffect(() => {
    if (!presenceChannelRef.current) return;
    const typing = inputText.trim().length > 0;
    if (typing !== isTyping) {
      setIsTyping(typing);
      presenceChannelRef.current.track({ online_at: new Date().toISOString(), isTyping: typing }).catch(console.error);
    }
  }, [inputText, isTyping]);

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
    if (!appointmentId || sharedAptIds.length === 0) return;
    
    // Initial fetch
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('appointment_messages')
        .select('*')
        .in('appointment_id', sharedAptIds)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };
    
    fetchMessages();

    // Subscribe to changes (attach listener for each shared appointment ID)
    const channel = supabase.channel(`chat_shared_${appointmentId}`);
    
    sharedAptIds.forEach(id => {
      channel.on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'appointment_messages',
        filter: `appointment_id=eq.${id}` 
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
      });
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, sharedAptIds.join(',')]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !user || !appointmentId || isUploading) return;

    let messageContent = inputText.trim();
    const currentFile = selectedFile;

    setInputText("");
    setSelectedFile(null);
    setPreviewUrl(null);

    if (currentFile) {
       setIsUploading(true);
       try {
         const { url } = await uploadImage(currentFile, "medimeet/chat-images");
         messageContent = `[IMAGE]${url}`;
       } catch (err) {
         console.error(err);
         setIsUploading(false);
         alert("Failed to upload image. Please try again.");
         return;
       }
       setIsUploading(false);
    }

    const tempId = crypto.randomUUID();
    const newMsg: Message = {
      id: tempId,
      appointment_id: appointmentId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString()
    };

    setMessages(prev => {
      if (prev.some(m => m.id === tempId)) return prev;
      return [...prev, newMsg];
    });

    const { error } = await supabase.from('appointment_messages').insert({
      id: tempId,
      appointment_id: appointmentId,
      sender_id: user.id,
      content: messageContent
    });

    if (error) {
      console.error("Send message error:", error);
    }
  };

  if (!user || (!appointment && !isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Determine chat partner identity
  // ALREADY DETERMINED ABOVE: isDoctor, partnerName, partnerImage, partnerId

  let displayLastSeen = partnerLastSeen;
  if (!displayLastSeen && messages.length > 0) {
    const partnerMessages = messages.filter(m => m.sender_id === partnerId);
    if (partnerMessages.length > 0) {
      displayLastSeen = partnerMessages[partnerMessages.length - 1].created_at;
    }
  }

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const lastSeenText = displayLastSeen 
      ? `Last seen ${getRelativeTime(displayLastSeen)}`
      : "Offline";

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 md:max-w-2xl md:mx-auto md:border-x border-gray-200 shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 z-50 md:max-w-2xl md:mx-auto flex px-4 py-3 md:py-5 items-center bg-white border-b shadow-sm space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10 border shadow-sm">
          <AvatarImage src={partnerImage} alt={partnerName} />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">{partnerName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{partnerName || "Patient"}</h2>
          {partnerTyping ? (
             <span className="text-xs text-blue-600 font-semibold tracking-wide animate-pulse">Typing...</span>
          ) : partnerOnline ? (
             <div className="flex items-center space-x-1 mt-0.5">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span className="text-[11px] text-green-600 font-medium uppercase tracking-wider">Online</span>
             </div>
          ) : (
             <span className="text-[11px] text-gray-500 font-medium tracking-wide">
               {lastSeenText}
             </span>
          )}
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
      <div className="flex-1 overflow-y-auto p-4 pt-[85px] md:pt-[100px] space-y-4" ref={scrollRef}>
         {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello!</div>
         )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);
          
          return (
            <React.Fragment key={msg.id}>
              {renderDateDivider(msg.created_at, idx > 0 ? messages[idx - 1].created_at : undefined)}
              <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                {!isMe ? (
                 <div className="w-8 shrink-0 relative">
                   {showAvatar ? (
                     <Avatar className="w-8 h-8">
                        <AvatarImage src={partnerImage} />
                        <AvatarFallback>{partnerName?.charAt(0)}</AvatarFallback>
                     </Avatar>
                   ) : <div className="w-8 h-8" />}
                   {showAvatar && partnerOnline && (
                     <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-50 rounded-full"></span>
                   )}
                 </div>
              ) : null}

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-[1.2rem] px-3 pt-2 pb-1.5 text-[0.95rem] shadow-sm leading-relaxed overflow-hidden flex flex-col
                ${isMe 
                  ? 'bg-blue-600 text-white rounded-br-sm pl-4' 
                  : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100 pr-4'}`}
              >
                <div>
                  {msg.content.startsWith('[IMAGE]') ? (
                     <img src={msg.content.replace('[IMAGE]', '')} alt="Attachment" className="max-w-[15rem] max-h-[15rem] sm:max-w-[20rem] sm:max-h-[20rem] rounded-md object-cover" />
                  ) : msg.content.startsWith('[AUDIO]') ? (
                     <audio controls src={msg.content.replace('[AUDIO]', '')} className="max-w-[12rem] sm:max-w-[16rem]" />
                  ) : (
                     <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                  )}
                </div>
                <div className={`text-[10px] self-end mt-0.5 font-medium tracking-tight ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </React.Fragment>
          );
        })}
      </div>

      {/* Input Box mimicking the image UI */}
      <div className="bg-white px-4 py-3 md:py-4 border-t z-10 w-full mb-[env(safe-area-inset-bottom)]">
        {previewUrl && (
           <div className="mb-3 relative w-20 h-20 rounded-lg overflow-hidden border shadow-sm">
             <img src={previewUrl} className="w-full h-full object-cover" alt="Preview"/>
             <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors">
               <X className="w-3 h-3" />
             </button>
           </div>
        )}
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
          <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-2 py-1.5 border border-gray-200 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full w-9 h-9" disabled={isUploading || selectedFile !== null}>
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isUploading || selectedFile !== null || isRecording}
              placeholder={isUploading ? "Uploading..." : selectedFile ? "Image attached..." : "Type a message..."}
              className={`flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-gray-700 placeholder:text-gray-400 disabled:opacity-50 ${isRecording ? 'hidden' : 'block'}`}
            />

            {isRecording && (
               <div className="flex-1 flex items-center justify-between px-2">
                 <div className="flex items-center space-x-2 animate-pulse text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm font-medium">Recording audio...</span>
                 </div>
                 <div className="flex space-x-1">
                   <Button type="button" variant="ghost" size="icon" onClick={() => stopRecording(true)} className="text-gray-400 hover:text-red-500 w-8 h-8 rounded-full">
                     <X className="w-4 h-4" />
                   </Button>
                   <Button type="button" size="icon" onClick={() => stopRecording(false)} className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full shadow-sm">
                     <Send className="w-4 h-4 ml-0.5" />
                   </Button>
                 </div>
               </div>
            )}
            
            {!isRecording && (
              (inputText.trim() || selectedFile) ? (
                <Button type="submit" size="icon" disabled={isUploading} className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 w-9 h-9 shadow-md text-white transition-colors disabled:opacity-50">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="icon" onClick={startRecording} disabled={isUploading} className="shrink-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full w-9 h-9">
                  <Mic className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
