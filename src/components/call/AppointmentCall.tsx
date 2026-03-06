"use client";

import { Appointment } from "@/store/appointmentStore";
import {
  Call,
  CallControls,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  ParticipantView,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import type { CustomVideoEvent, StreamVideoEvent, StreamVideoParticipant } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { supabase } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppointmentStore } from "@/store/appointmentStore";
import { LayoutGrid, Loader2, Star } from "lucide-react";
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
      try {
        await call.camera.enable();
        await call.microphone.enable();
      } catch (err) {
        console.warn("Failed to enable devices:", err);
      }
      await joinConsultation(appointment._id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }, [appointment._id, call, joining, joinConsultation]);

  const handleLeave = useCallback(async () => {
    onCallEnd();
  }, [onCallEnd]);

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
  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const rateDoctor = useAppointmentStore((s) => s.rateDoctor);
  type LayoutKey = "speaker" | "grid" | "stacked";
  type StackedOrientation = "vertical" | "horizontal";
  type StackedOrder = "remote-first" | "self-first";

  const [layout, setLayout] = useState<LayoutKey>("speaker");
  const [stackedOrientation, setStackedOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [stackedOrder, setStackedOrder] = useState<"remote-first" | "self-first">("remote-first");
  const [stackedSplit, setStackedSplit] = useState(55);
  const [everJoined, setEverJoined] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [navigateAfterRating, setNavigateAfterRating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  useEffect(() => {
    const unsubscribe = call.on("custom", (event: StreamVideoEvent) => {
      const custom = (event as unknown as CustomVideoEvent).custom as unknown;
      if (!isChatCustomPayload(custom)) return;
      if (chatOpen) return;
      if (custom.senderId === currentUser.id) return;
      setUnreadCount((c) => c + 1);
    });
    return () => unsubscribe();
  }, [call, chatOpen, currentUser.id]);

  useEffect(() => {
    const key = "medics_call_layout_prefs_v1";
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const rec = parsed as Record<string, unknown>;
      if (rec.layout === "speaker" || rec.layout === "grid" || rec.layout === "stacked") {
        setLayout(rec.layout);
      }
      if (rec.stackedOrientation === "vertical" || rec.stackedOrientation === "horizontal") {
        setStackedOrientation(rec.stackedOrientation);
      }
      if (rec.stackedOrder === "remote-first" || rec.stackedOrder === "self-first") {
        setStackedOrder(rec.stackedOrder);
      }
      if (typeof rec.stackedSplit === "number" && Number.isFinite(rec.stackedSplit)) {
        setStackedSplit(Math.max(30, Math.min(70, Math.round(rec.stackedSplit))));
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const key = "medics_call_layout_prefs_v1";
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          layout,
          stackedOrientation,
          stackedOrder,
          stackedSplit,
        })
      );
    } catch {
    }
  }, [layout, stackedOrientation, stackedOrder, stackedSplit]);
  const otherPartyLabel = useMemo(() => {
    return currentUser.role === "doctor"
      ? `Patient: ${appointment.patientId?.name || "Unknown"}`
      : `Dr. ${appointment.doctorId?.name || "Unknown"}`;
  }, [appointment.doctorId?.name, appointment.patientId?.name, currentUser.role]);

  const joined = callingState === CallingState.JOINED;

  useEffect(() => {
    if (joined) setEverJoined(true);
  }, [joined]);

  const maybeOpenRating = useCallback(async (): Promise<boolean> => {
    if (currentUser.role !== "patient") return false;
    try {
      const { data: apt } = await supabase
        .from("appointments")
        .select("status")
        .eq("id", appointment._id)
        .maybeSingle();
      const status = (apt as { status?: string | null } | null)?.status ?? null;
      if (status !== "Completed") return false;
      const { data: existing } = await supabase
        .from("doctor_ratings")
        .select("rating,comment")
        .eq("appointment_id", appointment._id)
        .maybeSingle();
      const existingRating = (existing as { rating?: number | null; comment?: string | null } | null)?.rating ?? null;
      const existingComment = (existing as { rating?: number | null; comment?: string | null } | null)?.comment ?? null;
      if (typeof existingRating === "number" && Number.isFinite(existingRating)) return false;
      setRatingValue(5);
      setRatingComment(typeof existingComment === "string" ? existingComment : "");
      setRatingOpen(true);
      return true;
    } catch {
      return false;
    }
  }, [appointment._id, currentUser.role]);

  const requestLeave = useCallback(async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await call.leave();
    } catch {
    }

    if (currentUser.role === "patient") {
      const opened = await maybeOpenRating();
      if (opened) {
        setNavigateAfterRating(true);
        setLeaving(false);
        return;
      }
    }

    onCallEnd();
  }, [call, currentUser.role, leaving, maybeOpenRating, onCallEnd]);

  useEffect(() => {
    if (!everJoined) return;
    if (joined) return;
    if (leaving) return;
    if (currentUser.role !== "patient") {
      onCallEnd();
      return;
    }
    void (async () => {
      const opened = await maybeOpenRating();
      if (opened) {
        setNavigateAfterRating(true);
        return;
      }
      onCallEnd();
    })();
  }, [currentUser.role, everJoined, joined, leaving, maybeOpenRating, onCallEnd]);

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
      <style>{`
        .str-video__notification { display: none !important; }
      `}</style>
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4">
        <div>
          <h1 className="text-lg font-semibold">
            {appointment.consultationType}
          </h1>
          <p className="text-sm text-slate-400">{otherPartyLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <CallStatsButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors">
                <LayoutGrid className="h-4 w-4" />
                Layout
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Video layout</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={layout} onValueChange={(v) => setLayout(v as LayoutKey)}>
                <DropdownMenuRadioItem value="speaker">Speaker</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="grid">Grid</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="stacked">Stacked</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              {layout === "stacked" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Stack options</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={stackedOrientation}
                    onValueChange={(v) => setStackedOrientation(v as StackedOrientation)}
                  >
                    <DropdownMenuRadioItem value="vertical">Up & down</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="horizontal">Side by side</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>

                  <DropdownMenuRadioGroup value={stackedOrder} onValueChange={(v) => setStackedOrder(v as StackedOrder)}>
                    <DropdownMenuRadioItem value="remote-first">Doctor/Patient first</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="self-first">You first</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>

                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm">Split</p>
                      <p className="text-xs text-muted-foreground">{stackedSplit}%</p>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={70}
                      value={stackedSplit}
                      onChange={(e) => setStackedSplit(Math.max(30, Math.min(70, Number(e.target.value))))}
                      className="mt-2 w-full"
                    />
                  </div>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="relative rounded bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            {chatOpen ? "Close chat" : "Chat"}
            {!chatOpen && unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => void requestLeave()}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
            disabled={leaving || ratingSaving}
          >
            {leaving ? "Leaving..." : "Leave Call"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
          <div className="h-full min-h-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800">
            {layout === "speaker" ? <SpeakerLayout participantsBarPosition="bottom" /> : null}
            {layout === "grid" ? <PaginatedGridLayout groupSize={6} /> : null}
            {layout === "stacked" ? (
              <TwoUpStackedLayout
                participants={participants}
                localParticipantSessionId={localParticipant?.sessionId}
                orientation={stackedOrientation}
                order={stackedOrder}
                split={stackedSplit}
              />
            ) : null}
          </div>
        </div>

        {chatOpen && (
          <div className="hidden w-96 border-l border-slate-800 bg-slate-900 md:block">
            <CallChatPanel call={call} currentUser={currentUser} />
          </div>
        )}
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:hidden" onClick={() => setChatOpen(false)}>
          <div
            className="flex h-[80vh] w-full flex-col rounded-t-2xl border-t border-slate-800 bg-slate-900 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 p-4">
              <p className="text-sm font-medium">Chat</p>
              <button
                onClick={() => setChatOpen(false)}
                className="rounded bg-slate-800 px-3 py-1 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <CallChatPanel call={call} currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-slate-800 bg-slate-900 p-4">
        <CallControls onLeave={() => void requestLeave()} />
      </div>

      <Dialog
        open={ratingOpen}
        onOpenChange={(open) => {
          setRatingOpen(open);
          if (!open && navigateAfterRating) onCallEnd();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your doctor</DialogTitle>
            <DialogDescription>
              Your feedback helps improve care quality. This takes a few seconds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => {
                const filled = v <= ratingValue;
                return (
                  <button
                    key={v}
                    type="button"
                    disabled={ratingSaving}
                    onClick={() => setRatingValue(v)}
                    className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                  >
                    <Star className={filled ? "h-6 w-6 fill-yellow-400 text-yellow-400" : "h-6 w-6 text-gray-300"} />
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-muted-foreground">{ratingValue} / 5</span>
            </div>

            <Textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Share anything that stood out (optional)"
              rows={3}
              disabled={ratingSaving}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRatingOpen(false);
                if (navigateAfterRating) onCallEnd();
              }}
              disabled={ratingSaving}
            >
              Not now
            </Button>
            <Button
              onClick={async () => {
                if (ratingSaving) return;
                setRatingSaving(true);
                try {
                  const trimmed = ratingComment.trim();
                  await rateDoctor(appointment._id, ratingValue, trimmed.length ? trimmed : undefined);
                } finally {
                  setRatingSaving(false);
                  setRatingOpen(false);
                  if (navigateAfterRating) onCallEnd();
                }
              }}
              disabled={ratingSaving}
            >
              {ratingSaving ? "Saving..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TwoUpStackedLayout({
  participants,
  localParticipantSessionId,
  orientation,
  order,
  split,
}: {
  participants: StreamVideoParticipant[];
  localParticipantSessionId?: string;
  orientation: "vertical" | "horizontal";
  order: "remote-first" | "self-first";
  split: number;
}) {
  const local = localParticipantSessionId
    ? participants.find((p) => p.sessionId === localParticipantSessionId)
    : participants[0];
  const remote = localParticipantSessionId
    ? participants.find((p) => p.sessionId !== localParticipantSessionId)
    : participants.find((p) => p.sessionId !== local?.sessionId);

  const primary = order === "remote-first" ? remote ?? local : local;
  const secondary = order === "remote-first" ? (remote ? local : null) : remote ?? null;

  const dir = orientation === "vertical" ? "flex-col" : "flex-row";
  const firstPct = Math.max(30, Math.min(70, Math.round(split)));
  const secondPct = 100 - firstPct;

  // If there's no secondary participant (only one person in call),
  // show the primary participant in full screen.
  if (!secondary) {
    return (
      <div className="h-full w-full overflow-hidden">
        <ParticipantView participant={primary} />
      </div>
    );
  }

  return (
    <div className={`flex h-full min-h-0 w-full ${dir}`}>
      {primary ? (
        <div
          className={
            orientation === "vertical"
              ? "min-h-0 min-w-0 flex-none border-b border-slate-800/70"
              : "min-h-0 min-w-0 flex-none border-r border-slate-800/70"
          }
          style={orientation === "vertical" ? { height: `${firstPct}%` } : { width: `${firstPct}%` }}
        >
          <div className="h-full w-full overflow-hidden">
            <ParticipantView participant={primary} />
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
          Waiting for participant...
        </div>
      )}

      <div
        className="min-h-0 min-w-0 flex-auto"
        style={orientation === "vertical" ? { height: `${secondPct}%` } : { width: `${secondPct}%` }}
      >
        <div className="h-full w-full overflow-hidden">
          <ParticipantView participant={secondary} />
        </div>
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
