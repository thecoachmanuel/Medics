"use client";
import React, { Suspense, useEffect, useState } from "react";
import Header from "../landing/Header";
import { userAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Appointment, useAppointmentStore } from "@/store/appointmentStore";
import { Card, CardContent } from "../ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { Bell, Calendar, Clock, CreditCard, FileText, Phone, Search, Star, Video, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { getStatusColor, healthcareCategories } from "@/lib/constant";
import { formatDateTimeNG } from "@/lib/datetime";
import { WalletCard } from "./WalletCard";
import PrescriptionViewModal from "../doctor/PrescriptionViewModal";
import { Textarea } from "../ui/textarea";
import { useAppDetection } from "@/hooks/use-app-detection";
import { Input } from "../ui/input";
import { useDoctorStore } from "@/store/doctorStore";
import { toLocalYMD } from "@/lib/dateUtils";

const PatientDashboardContentInner = () => {
  const isApp = useAppDetection();
  const { user, isAuthenticated, loading: authLoading, error: authError } = userAuthStore();
  const router = useRouter();
  const {
    appointments,
    fetchAppointments,
    loading: appointmentsLoading,
    error: appointmentError,
    clearError: clearAppointmentError,
    rateDoctor,
    subscribeToAppointments,
    unsubscribeFromAppointments,
  } = useAppointmentStore();
  const {
    doctors: suggestedDoctors,
    loading: doctorsLoading,
    fetchDoctors: fetchSuggestedDoctors,
  } = useDoctorStore();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedDayYmd, setSelectedDayYmd] = useState<string>(() => toLocalYMD(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [taxonomyCategoryNames, setTaxonomyCategoryNames] = useState<string[] | null>(null);

  const isPatientOnboardingComplete = (): boolean => {
    if (!user || user.type !== "patient") return true;
    return !!user.isVerified;
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login/patient");
      return;
    }
    if (user.type !== "patient") {
      if (!user.isVerified) {
        router.push(`/onboarding/${user.type}`);
      } else if (user.type === "doctor") {
        router.push("/doctor/dashboard");
      }
      return;
    }
    if (user.isBlocked) {
      router.push("/appeal");
      return;
    }
    if (!isPatientOnboardingComplete()) {
      router.push("/onboarding/patient");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.type === "patient") {
      fetchAppointments("patient");
      subscribeToAppointments(user.id, "patient");
      const onVis = () => { if(document.visibilityState === 'visible') fetchAppointments("patient"); };
      document.addEventListener("visibilitychange", onVis);
      return () => {
        unsubscribeFromAppointments();
        document.removeEventListener("visibilitychange", onVis);
      };
    }
  }, [user, fetchAppointments, subscribeToAppointments, unsubscribeFromAppointments]);

  useEffect(() => {
    if (user?.type !== "patient") return;
    fetchSuggestedDoctors({ limit: 12, page: 1, sortBy: "experience", sortOrder: "desc" });
  }, [fetchSuggestedDoctors, user?.type]);

  useEffect(() => {
    let isMounted = true;

    const loadTaxonomies = async () => {
      try {
        const response = await fetch("/api/taxonomies");
        if (!response.ok) return;
        const json = (await response.json()) as {
          config?: {
            categories?: string[];
          } | null;
        };
        if (!isMounted || !json || !json.config) return;
        if (Array.isArray(json.config.categories) && json.config.categories.length) {
          setTaxonomyCategoryNames(json.config.categories);
        }
      } catch {
      }
    };

    loadTaxonomies();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateString: string) =>
    formatDateTimeNG(dateString, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const isToday = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return appointmentDate.toDateString() === today.toDateString();
  };

  const canJoinCall = (appointment: any) => {
    if (appointment.status === "Cancelled") return false;
    if (appointment.consultationType === "Messaging" && appointment.paymentStatus === "success") {
      return true;
    }
    const appointmentTime = new Date(appointment.slotStartIso);
    const now = new Date();
    const diffMintues = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

    return (
      isToday(appointment.slotStartIso) &&
      diffMintues <= 15 && //not earliar than 15 min before start
      diffMintues >= -120 && //not later than 2 hours after start
      (appointment.status === "Scheduled" ||
        appointment.status === "In Progress") &&
      appointment.paymentStatus === "success"
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">Loading your dashboard…</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 space-y-4">
            <div className="text-lg font-semibold text-gray-900">Unable to load dashboard</div>
            <div className="text-sm text-gray-600">{authError}</div>
            <div className="flex gap-2">
              <Button onClick={() => router.refresh()}>Retry</Button>
              <Button variant="outline" onClick={() => router.push("/login/patient")}>Go to login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  const now = new Date();
  const showAppointmentsSkeleton = appointmentsLoading && appointments.length === 0;
  const isRefreshing = appointmentsLoading && appointments.length > 0;
  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.slotStartIso);
    return (
      (aptDate >= now || apt.status === "In Progress") &&
      (apt.status === "Scheduled" || apt.status === "In Progress")
    );
  });

  const pastAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.slotStartIso);
    return (
      aptDate < now ||
      apt.status === "Completed" ||
      apt.status === "Cancelled" ||
      apt.status === "Missed" ||
      apt.status === "Expired"
    );
  });

  const dateChips = React.useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const ymd = toLocalYMD(d);
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const day = String(d.getDate());
      return { ymd, weekday, day, date: d };
    });
  }, []);

  const selectedDayLabel = React.useMemo(() => {
    const d = selectedDayYmd ? new Date(`${selectedDayYmd}T00:00:00`) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [selectedDayYmd]);

  const upcomingAppointmentsForDay = React.useMemo(() => {
    if (!selectedDayYmd) return upcomingAppointments;
    return upcomingAppointments.filter((apt) => {
      const aptDate = new Date(apt.slotStartIso);
      if (Number.isNaN(aptDate.getTime())) return false;
      return toLocalYMD(aptDate) === selectedDayYmd;
    });
  }, [selectedDayYmd, upcomingAppointments]);

  const firstName =
    typeof user.name === "string" && user.name.trim().length > 0
      ? user.name.trim().split(/\s+/)[0]
      : "there";

  const categoryChips =
    taxonomyCategoryNames && taxonomyCategoryNames.length
      ? healthcareCategories.filter((category) =>
          taxonomyCategoryNames.includes(category.title),
        )
      : healthcareCategories;

  const topDoctors = suggestedDoctors
    .slice()
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 6);

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const [savingRating, setSavingRating] = useState(false);
    const [comment, setComment] = useState(appointment.reviewComment ?? "");
    const [localRating, setLocalRating] = useState<number | undefined>(appointment.rating);
    const reviewLocked = typeof appointment.rating === "number" && !Number.isNaN(appointment.rating);
    const appointmentDate = new Date(appointment.slotStartIso);
    const appointmentDay = Number.isNaN(appointmentDate.getTime()) ? "" : String(appointmentDate.getDate());
    const appointmentWeekday = Number.isNaN(appointmentDate.getTime())
      ? ""
      : appointmentDate.toLocaleDateString("en-US", { weekday: "short" });

    useEffect(() => {
      setComment(appointment.reviewComment ?? "");
    }, [appointment.reviewComment]);

    useEffect(() => {
      setLocalRating(appointment.rating);
    }, [appointment.rating]);

    const handleRate = (value: number) => {
      if (reviewLocked) return;
      if (savingRating) return;
      setLocalRating(value);
    };

    const handleSaveReview = async () => {
      if (reviewLocked) return;
      if (savingRating) return;
      if (localRating === undefined) return;
      
      const trimmed = comment.trim();
      if (!trimmed && localRating === appointment.rating) return;

      setSavingRating(true);
      try {
        await rateDoctor(appointment._id, localRating, trimmed || undefined);
      } finally {
        setSavingRating(false);
      }
    };

    return (
    <Card className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.30)]">
            <div className="text-[11px] font-semibold opacity-90">{appointmentWeekday}</div>
            <div className="text-xl font-extrabold leading-none">{appointmentDay}</div>
          </div>

          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <Avatar className="w-16 h-16 rounded-2xl">
              <AvatarImage
                src={appointment.doctorId?.profileImage}
                alt={appointment.doctorId?.name}
              />
              <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold rounded-2xl">
                {appointment.doctorId?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-4 md:mt-0 flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {appointment.doctorId?.name}
                </h3>
                <p className="text-gray-600">
                  {appointment.doctorId?.specialization}
                </p>
                
              </div>

              <div className="mt-2 md:mt-0 text-center md:text-right">
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
                {isToday(appointment.slotStartIso) && (
                  <div className="text-xs text-blue-600 font-semibold mt-1">
                    TODAY
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(appointment.slotStartIso)}</span>
                </div>

                <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-gray-600">
                  {appointment.consultationType === "Video Consultation" ? (
                    <Video className="w-4 h-4" />
                  ) : appointment.consultationType === "Messaging" ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                  <span>{appointment.consultationType}</span>
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="flex justify-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold">Fee:</span>
                  <p>
                    ₦
                    {appointment.paidAmount ?? appointment.fees ?? ""}
                  </p>
                </div>
                {appointment.paymentStatus === 'success' && (
                  <div className="mt-1">
                    <Badge className="bg-green-100 text-green-700 border border-green-200">Paid</Badge>
                  </div>
                )}

                {appointment.symptoms && (
                  <div className="flex justify-center gap-2 text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Symptoms</span>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {appointment.symptoms}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row items-center md:justify-between space-y-3 md:space-y-0">

            <div className="flex space-x-2">
              {canJoinCall(appointment) && (
                <Link href={appointment.consultationType === 'Messaging' ? `/chat/${appointment._id}` : `/call/${appointment._id}`}>
                <Button
                 size='sm'
                 className="bg-blue-600 hover:bg-blue-700 rounded-full font-medium px-6"
                >
                  {appointment.consultationType === 'Messaging' ? <MessageSquare className="w-4 h-4 mr-2"/> : <Video className="w-4 h-4 mr-2"/>}
                  {appointment.consultationType === 'Messaging' ? 'Open Chat' : 'Join Call'}
                  </Button></Link>
              )}

                  {appointment.status === 'Completed' && appointment.prescription && (
                    <PrescriptionViewModal
                     appointment={appointment}
                     userType="patient"
                     trigger={
                      <Button
                       variant='outline'
                       size='sm'
                       className="text-green-700 border-green-200 hover:bg-green-50"
                      >
                        <FileText className="w-4 h-4 mr-2"/>
                        View Prescription
                      </Button>
                     }
                    />
                  )}



            </div>

            {appointment.status === 'Completed' && appointment.paymentStatus === 'success' && (
              <div className="mt-3 w-full">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => {
                      const value = i + 1;
                      const filled = localRating !== undefined ? value <= localRating : false;

                      if (reviewLocked) {
                        return (
                          <Star
                            key={value}
                            className={
                              filled
                                ? 'w-4 h-4 fill-yellow-400 text-yellow-400'
                                : 'w-4 h-4 text-gray-300'
                            }
                          />
                        );
                      }

                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={savingRating}
                          onClick={() => handleRate(value)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={
                              filled
                                ? 'w-4 h-4 fill-yellow-400 text-yellow-400'
                                : 'w-4 h-4 text-gray-300'
                            }
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-xs text-gray-500">
                      {localRating !== undefined ? `${localRating.toFixed(1)} / 5` : 'Tap to rate your doctor'}
                    </span>
                  </div>

                  {reviewLocked && (
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-green-100 text-green-700 border border-green-200">Review submitted</Badge>
                      {appointment.reviewCreatedAt && (
                        <span className="text-xs text-gray-500">Reviewed on {formatDateTimeNG(appointment.reviewCreatedAt)}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full">
                  <Textarea
                    value={comment}
                    onChange={(e) => {
                      if (reviewLocked) return;
                      setComment(e.target.value);
                    }}
                    placeholder="Share your experience with this doctor (optional)"
                    className="text-sm"
                    rows={2}
                    readOnly={reviewLocked}
                    disabled={savingRating}
                  />

                  {!reviewLocked && (
                    <Button
                      size="sm"
                      disabled={savingRating || localRating === undefined}
                      onClick={handleSaveReview}
                    >
                      {savingRating ? 'Saving...' : 'Save Review'}
                    </Button>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )};

  const EmptyState = ({ tab }: { tab: string }) => {
    const emptyStatesData = {
      upcoming: {
        icon: Clock,
        title: "No Upcoming Appointments",
        description: "You have no upcoming appointments scheduled.",
        showBookButton: true,
      },
      past: {
        icon: FileText,
        title: "No Completed Appointments",
        description: "Your completed consultations will appear here once finished.",
        showBookButton: false,
      },
    };

    const state = emptyStatesData[tab as keyof typeof emptyStatesData] || emptyStatesData.upcoming;
    const Icon = state.icon;
    return (
      <Card className="border-dashed border-2 bg-gray-50/50">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {state.title}
          </h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">
            {state.description}
          </p>

          {state.showBookButton && (
            <Link href="/doctor-list">
              <Button className="rounded-full px-8 shadow-lg shadow-blue-100">
                <Calendar className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Header showDashboardNav={true} />

      <div className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-white ${isApp ? 'pt-4' : 'pt-16'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                <AvatarImage src={(user as any).profileImage} alt={user.name} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm text-gray-600">Hi, {firstName}</div>
                <div className="text-lg font-bold text-gray-900">How is your health today?</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/patient/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/70 ring-1 ring-black/5 shadow-sm hover:bg-white"
                >
                  <Bell className="h-5 w-5 text-gray-700" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctors, specialties, conditions..."
                  className="h-12 rounded-full pl-11 bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-sm"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  className="rounded-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const q = searchQuery.trim();
                    router.push(q ? `/doctor-list?search=${encodeURIComponent(q)}` : "/doctor-list");
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>

                <Link href="/patient/payments">
                  <Button
                    variant="outline"
                    className="rounded-full bg-white/70 hover:bg-white ring-1 ring-black/5"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payments
                  </Button>
                </Link>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">Browse categories</div>
                  <Link href="/doctor-list">
                    <Button variant="ghost" className="h-8 px-3 rounded-full text-xs text-blue-700 hover:bg-blue-50">
                      See all
                    </Button>
                  </Link>
                </div>

                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
                  {categoryChips.slice(0, 8).map((cat) => (
                    <Link key={cat.id} href={`/doctor-list?category=${encodeURIComponent(cat.title)}`}>
                      <Button
                        variant="outline"
                        className="h-10 rounded-full bg-white/70 hover:bg-white ring-1 ring-black/5 border-0 px-3 gap-2 whitespace-nowrap"
                      >
                        <span className={`h-7 w-7 rounded-full ${cat.color} flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d={cat.icon} />
                          </svg>
                        </span>
                        <span className="text-xs font-semibold text-gray-800">{cat.title}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">Top doctors</div>
                  <Link href="/doctor-list">
                    <Button variant="ghost" className="h-8 px-3 rounded-full text-xs text-blue-700 hover:bg-blue-50">
                      See all
                    </Button>
                  </Link>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide">
                  {(doctorsLoading ? Array.from({ length: 5 }) : topDoctors).map((doctor, idx) => {
                    if (doctorsLoading) {
                      return (
                        <Card
                          key={`doc-skel-${idx}`}
                          className="min-w-[220px] rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-2xl bg-gray-200" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 w-28 bg-gray-200 rounded" />
                                <div className="h-3 w-20 bg-gray-200 rounded" />
                              </div>
                            </div>
                            <div className="mt-3 h-9 bg-gray-200 rounded-xl" />
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <Link key={(doctor as any)._id} href={`/patient/booking/${(doctor as any)._id}`}>
                        <Card className="min-w-[240px] rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 rounded-2xl">
                                <AvatarImage src={(doctor as any).profileImage} alt={(doctor as any).name} />
                                <AvatarFallback className="bg-blue-600 text-white font-semibold rounded-2xl">
                                  {(doctor as any).name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-gray-900 truncate">{(doctor as any).name}</div>
                                <div className="text-xs text-gray-600 truncate">{(doctor as any).specialization}</div>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{(((doctor as any).averageRating || 0) as number).toFixed(1)}</span>
                                <span className="text-gray-500">({(doctor as any).totalReviews || 0})</span>
                              </div>
                              <div className="text-xs font-bold text-blue-700">₦{(doctor as any).fees}</div>
                            </div>

                            <Button className="mt-3 w-full rounded-2xl bg-blue-600 hover:bg-blue-700">
                              Book
                            </Button>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <WalletCard />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {appointmentError && (
              <Card className="border border-red-200 bg-red-50/70">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-red-900">Something went wrong</div>
                    <div className="text-sm text-red-800">{appointmentError}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        clearAppointmentError();
                        fetchAppointments("patient");
                      }}
                    >
                      Retry
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => clearAppointmentError()}>
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isRefreshing && (
              <div className="text-xs text-gray-500">Refreshing…</div>
            )}

            <div className="rounded-3xl bg-white/60 ring-1 ring-black/5 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">My appointments</div>
                  <div className="text-xs text-gray-600">{selectedDayLabel}</div>
                </div>
                <Link href="/doctor-list">
                  <Button className="rounded-full bg-blue-600 hover:bg-blue-700 h-9 px-4 text-xs">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book
                  </Button>
                </Link>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {dateChips.map((c) => {
                  const isActive = c.ymd === selectedDayYmd;
                  return (
                    <button
                      key={c.ymd}
                      type="button"
                      onClick={() => setSelectedDayYmd(c.ymd)}
                      className={`shrink-0 w-[64px] rounded-2xl px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)]"
                          : "bg-white/70 text-gray-700 ring-1 ring-black/5 hover:bg-white"
                      }`}
                    >
                      <div className={`text-[10px] font-semibold ${isActive ? "opacity-90" : "text-gray-500"}`}>
                        {c.weekday}
                      </div>
                      <div className="text-lg font-extrabold leading-none">{c.day}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <TabsList className="flex w-full space-x-2 bg-gray-100 p-1.5 rounded-full border border-gray-200 shadow-inner">
              <TabsTrigger
                value="upcoming"
                className="flex-1 rounded-full py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:bg-gray-200"
              >
                <Clock className="w-4 h-4 mr-2 hidden sm:inline-block" />
                <span>Upcoming ({upcomingAppointmentsForDay.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="past" 
                className="flex-1 rounded-full py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:bg-gray-200"
              >
                <Calendar className="w-4 h-4 mr-2 hidden sm:inline-block" />
                <span>Completed ({pastAppointments.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {showAppointmentsSkeleton ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {upcomingAppointmentsForDay.map((appointment) => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState tab="upcoming" />
              )}
            </TabsContent>
            <TabsContent value="past" className="space-y-4">
              {showAppointmentsSkeleton ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pastAppointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pastAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment?._id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState tab="past" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const PatientDashboardContent = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
    <PatientDashboardContentInner />
  </Suspense>
);

export default PatientDashboardContent;
