"use client";

import { Appointment } from "@/store/appointmentStore";
import {
  Call,
  CallControls,
  CallStatsButton,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import type { CustomVideoEvent, StreamVideoEvent } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Loader2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface AppointmentCallProps {
  appointment: Appointment;
  currentUser: {
    id: string;
    name: string;
    role: "doctor" | "patient";
    image?: string;
  };
  onCallEnd: () => void;
  joinConsultation: (appointmentId: string) => Promise<void>;
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong";
};

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
};

type ChatCustomPayload = {
  type: "chat-message";
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isChatCustomPayload = (value: unknown): value is ChatCustomPayload => {
  if (!isRecord(value)) return false;
  if (value.type !== "chat-message") return false;
  return (
    typeof value.id === "string" &&
    typeof value.senderId === "string" &&
    typeof value.senderName === "string" &&
    typeof value.text === "string" &&
    typeof value.createdAt === "number"
  );
};

export default function AppointmentCall({
  appointment,
  currentUser,
  onCallEnd,
  joinConsultation,
}: AppointmentCallProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let videoClient: StreamVideoClient | null = null;
    let videoCall: Call | null = null;

    setError(null);
    setClient(null);
    setCall(null);
    setJoining(false);
    setChatOpen(false);

    if (!apiKey) {
      setError("Stream API key is missing");
      return;
    }
    if (!currentUser.id || !currentUser.name) {
      setError("Missing user details");
      return;
    }
    if (!appointment.streamCallId) {
      setError("Missing call id");
      return;
    }

    const init = async () => {
      try {
        const response = await fetch(`/api/stream/token?userId=${currentUser.id}`);
        const body: unknown = await response.json().catch(() => ({}));
        const token = isRecord(body) && typeof body.token === "string" ? body.token : null;
        if (!response.ok || !token) {
          const apiError = isRecord(body) && typeof body.error === "string" ? body.error : "Failed to fetch token";
          throw new Error(apiError);
        }

        videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            image: currentUser.image,
          },
          token,
        });

        videoCall = videoClient.call("default", appointment.streamCallId);

        if (cancelled) {
          await videoClient.disconnectUser();
          return;
        }

        setClient(videoClient);
        setCall(videoCall);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    void init();

    return () => {
      cancelled = true;
      void (async () => {
        try {
          await videoCall?.leave();
        } catch {
        }
        try {
          await videoClient?.disconnectUser();
        } catch {
        }
      })();
    };
  }, [appointment.streamCallId, currentUser.id, currentUser.image, currentUser.name]);

  const handleJoin = useCallback(async () => {
    if (!call) return;
    if (joining) return;
    setJoining(true);
    try {
      await call.join({ create: true });
      await joinConsultation(appointment._id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }, [appointment._id, call, joining, joinConsultation]);

  const handleLeave = useCallback(async () => {
    try {
      await call?.leave();
    } catch {
    }
    onCallEnd();
  }, [call, onCallEnd]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-red-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Call Error</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={onCallEnd}
            className="w-full rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-gray-500">Initializing secure call...</p>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme>
          <MyCallUI
            appointment={appointment}
            currentUser={currentUser}
            onCallEnd={handleLeave}
            onJoin={handleJoin}
            joining={joining}
            chatOpen={chatOpen}
            setChatOpen={setChatOpen}
            call={call}
          />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
}

function MyCallUI({
  appointment,
  currentUser,
  onCallEnd,
  onJoin,
  joining,
  chatOpen,
  setChatOpen,
  call,
}: {
  appointment: Appointment;
  currentUser: AppointmentCallProps["currentUser"];
  onCallEnd: () => void;
  onJoin: () => void;
  joining: boolean;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  call: Call;
}) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const otherPartyLabel = useMemo(() => {
    return currentUser.role === "doctor"
      ? `Patient: ${appointment.patientId?.name || "Unknown"}`
      : `Dr. ${appointment.doctorId?.name || "Unknown"}`;
  }, [appointment.doctorId?.name, appointment.patientId?.name, currentUser.role]);

  const joined = callingState === CallingState.JOINED;

  if (!joined) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-950 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4">
          <div>
            <h1 className="text-lg font-semibold">{appointment.consultationType}</h1>
            <p className="text-sm text-slate-400">{otherPartyLabel}</p>
          </div>
          <button
            onClick={onCallEnd}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Back
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold">
                {currentUser.role === "doctor" ? "DR" : "PT"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-400">Signed in as</p>
                <p className="truncate text-base font-medium">{currentUser.name}</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={onJoin}
                disabled={joining}
                className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join consultation"
                )}
              </button>
              <p className="mt-3 text-xs text-slate-400">
                You can configure microphone and camera from the in-call controls.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4">
        <div>
          <h1 className="text-lg font-semibold">
            {appointment.consultationType}
          </h1>
          <p className="text-sm text-slate-400">{otherPartyLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <CallStatsButton />
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            {chatOpen ? "Close chat" : "Chat"}
          </button>
          <button
            onClick={onCallEnd}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Leave Call
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>

        <div className="hidden w-96 border-l border-slate-800 bg-slate-900 md:block">
          {chatOpen ? (
            <CallChatPanel call={call} currentUser={currentUser} />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-slate-400">
              Open chat to send notes.
            </div>
          )}
        </div>
      </div>

      {chatOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={() => setChatOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl border-t border-slate-800 bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <p className="text-sm font-medium">Chat</p>
              <button
                onClick={() => setChatOpen(false)}
                className="rounded bg-slate-800 px-3 py-1 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
            <CallChatPanel call={call} currentUser={currentUser} />
          </div>
        </div>
      ) : null}

      <div className="border-t border-slate-800 bg-slate-900 p-4">
        <CallControls onLeave={onCallEnd} />
      </div>
    </div>
  );
}

function CallChatPanel({
  call,
  currentUser,
}: {
  call: Call;
  currentUser: AppointmentCallProps["currentUser"];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = call.on("custom", (event: StreamVideoEvent) => {
      const custom = (event as unknown as CustomVideoEvent).custom as unknown;
      if (!isChatCustomPayload(custom)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === custom.id)) return prev;
        const next = [...prev, { ...custom }];
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [call]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const payload: ChatCustomPayload = {
      type: "chat-message",
      id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: trimmed,
      createdAt: Date.now(),
    };

    setText("");
    setMessages((prev) => {
      const next = [...prev, payload];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });

    try {
      await call.sendCustomEvent(payload);
    } catch {
    }
  }, [call, currentUser.id, currentUser.name, text]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      if (e.shiftKey) return;
      e.preventDefault();
      void send();
    },
    [send]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={m.senderId === currentUser.id ? "text-right" : "text-left"}>
                <p className="text-xs text-slate-400">{m.senderName}</p>
                <div
                  className={
                    m.senderId === currentUser.id
                      ? "ml-auto inline-block max-w-[85%] rounded-2xl bg-emerald-600 px-3 py-2 text-sm"
                      : "mr-auto inline-block max-w-[85%] rounded-2xl bg-slate-800 px-3 py-2 text-sm"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No messages yet.
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded bg-slate-950 px-3 py-2 text-sm outline-none ring-1 ring-slate-800 focus:ring-emerald-600"
          />
          <button
            onClick={() => void send()}
            disabled={!text.trim()}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
