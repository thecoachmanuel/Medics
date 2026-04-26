"use client";
import React, { Suspense, useEffect, useState } from "react";
import Header from "../landing/Header";
import { userAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Appointment, useAppointmentStore } from "@/store/appointmentStore";
import { Card, CardContent } from "../ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { Calendar, Clock, CreditCard, FileText, MapPin, Phone, Star, Video, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/constant";
import { formatDateTimeNG } from "@/lib/datetime";
import { WalletCard } from "./WalletCard";
import PrescriptionViewModal from "../doctor/PrescriptionViewModal";
import { Textarea } from "../ui/textarea";
import { useAppDetection } from "@/hooks/use-app-detection";

const PatientDashboardContentInner = () => {
  const isApp = useAppDetection();
  const { user, isAuthenticated, loading: authLoading, error: authError } = userAuthStore();
  const router = useRouter();
  const {
    appointments,
    fetchAppointments,
    loading,
    error: appointmentError,
    clearError: clearAppointmentError,
    rateDoctor,
    subscribeToAppointments,
    unsubscribeFromAppointments,
  } = useAppointmentStore();
  const [activeTab, setActiveTab] = useState("upcoming");

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
  const showAppointmentsSkeleton = loading && appointments.length === 0;
  const isRefreshing = loading && appointments.length > 0;
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

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const [savingRating, setSavingRating] = useState(false);
    const [comment, setComment] = useState(appointment.reviewComment ?? "");
    const [localRating, setLocalRating] = useState<number | undefined>(appointment.rating);
    const reviewLocked = typeof appointment.rating === "number" && !Number.isNaN(appointment.rating);

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
      <Card className="hover:shadow-lg transition-all duration-300 border-none bg-white overflow-hidden group">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Status Strip */}
            <div className={cn(
              "h-1.5 md:h-auto md:w-1.5",
              appointment.status === "Scheduled" ? "bg-blue-500" : 
              appointment.status === "Completed" ? "bg-green-500" : 
              appointment.status === "Cancelled" ? "bg-red-500" : "bg-gray-300"
            )} />

            <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-start md:space-x-6 flex-1">
              <div className="flex-shrink-0 flex justify-between md:justify-start items-start md:items-center">
                <div className="relative">
                  <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-white shadow-md">
                    <AvatarImage
                      src={appointment.doctorId?.profileImage}
                      alt={appointment.doctorId?.name}
                    />
                    <AvatarFallback className="bg-blue-50 text-blue-600 text-lg font-semibold">
                      {appointment.doctorId?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isToday(appointment.slotStartIso) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="md:hidden flex flex-col items-end gap-1">
                  <Badge className={cn("rounded-full font-medium px-3", getStatusColor(appointment.status))}>
                    {appointment.status}
                  </Badge>
                  {isToday(appointment.slotStartIso) && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>
                  )}
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex-1 w-full">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {appointment.doctorId?.name}
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      {appointment.doctorId?.specialization}
                    </p>
                  </div>

                  <div className="hidden md:flex flex-col items-end gap-2">
                    <Badge className={cn("rounded-full font-medium px-4 py-1", getStatusColor(appointment.status))}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium uppercase">Date</span>
                      <span className="text-xs font-bold text-gray-700 truncate">{formatDate(appointment.slotStartIso)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      {appointment.consultationType === "Video Consultation" ? (
                        <Video className="w-4 h-4 text-purple-600" />
                      ) : appointment.consultationType === "Messaging" ? (
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      ) : (
                        <Phone className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium uppercase">Type</span>
                      <span className="text-xs font-bold text-gray-700">{appointment.consultationType === "Video Consultation" ? "Video Call" : appointment.consultationType}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900">₦{(appointment.paidAmount ?? appointment.fees ?? 0).toLocaleString()}</span>
                    {appointment.paymentStatus === 'success' && (
                      <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CreditCard className="w-3 h-3 mr-1" />
                        PAID
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {canJoinCall(appointment) && (
                      <Link href={appointment.consultationType === 'Messaging' ? `/chat/${appointment._id}` : `/call/${appointment._id}`}>
                        <Button
                          size='sm'
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-4 h-9 shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                          {appointment.consultationType === 'Messaging' ? 'Open Chat' : 'Join Call'}
                        </Button>
                      </Link>
                    )}

                    {appointment.status === 'Completed' && appointment.prescription && (
                      <PrescriptionViewModal
                        appointment={appointment}
                        userType="patient"
                        trigger={
                          <Button
                            variant='outline'
                            size='sm'
                            className="text-green-600 border-green-100 bg-green-50 hover:bg-green-100 rounded-xl font-bold px-4 h-9"
                          >
                            Prescription
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>

                {appointment.status === 'Completed' && appointment.paymentStatus === 'success' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => {
                          const value = i + 1;
                          const filled = localRating !== undefined ? value <= localRating : false;
                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={savingRating || reviewLocked}
                              onClick={() => handleRate(value)}
                              className={cn(
                                "focus:outline-none transition-transform active:scale-125",
                                reviewLocked ? "cursor-default" : "cursor-pointer"
                              )}
                            >
                              <Star
                                className={cn(
                                  "w-4 h-4",
                                  filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                                )}
                              />
                            </button>
                          );
                        })}
                      </div>
                      {!reviewLocked && localRating !== undefined && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-blue-600 font-bold hover:bg-blue-50"
                          disabled={savingRating}
                          onClick={handleSaveReview}
                        >
                          {savingRating ? '...' : 'Submit'}
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
    );
  };

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

      <div className={`min-h-screen bg-gray-50/50 ${isApp ? 'pt-6' : 'pt-24'} pb-24`}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                My Appointments
              </h1>
              <p className="text-sm md:text-lg text-gray-500 font-medium mt-1">
                Manage your healthcare journey
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/doctor-list" className="flex-1 md:flex-none">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Button>
              </Link>
              <Link href="/patient/payments" className="md:hidden">
                <Button variant="outline" className="w-12 h-12 rounded-2xl border-gray-200 p-0">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-10">
            <WalletCard />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            {/* ... error handling ... */}

            <TabsList className="inline-flex w-full md:w-auto bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50">
              <TabsTrigger
                value="upcoming"
                className="flex-1 md:px-8 rounded-xl py-2.5 text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
              >
                Upcoming
                <Badge className="ml-2 bg-blue-100 text-blue-600 hover:bg-blue-100 border-none px-2 h-5">
                  {upcomingAppointments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="past" 
                className="flex-1 md:px-8 rounded-xl py-2.5 text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
              >
                History
                <Badge className="ml-2 bg-gray-200 text-gray-600 hover:bg-gray-200 border-none px-2 h-5">
                  {pastAppointments.length}
                </Badge>
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
                  {upcomingAppointments.map((appointment) => (
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
