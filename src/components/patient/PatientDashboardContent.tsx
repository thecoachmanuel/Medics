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
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6">
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={appointment.doctorId?.profileImage}
                alt={appointment.doctorId?.name}
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                {appointment.doctorId?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-4 md:mt-0 flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <h3 className="text-lg font-semiboldtext-gray-900">
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
    const emptyStates = {
      upcoming: {
        icon: Clock,
        title: "No Upcoming Appointments",
        description: "You have no upcoming appointments scheduled.",
        showBookButton: true,
      },
      past: {
        icon: FileText,
        title: "No Past Appointments",
        description: "Your Completed consultations will appear here.",
        showBookButton: false,
      },
    };

    const state = emptyStates[tab as keyof typeof emptyStates];
    const Icon = state.icon;
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {state.title}
          </h3>
          <p className="text-gray-600 mb-6">{state.description}</p>

          {state.showBookButton && (
            <Link href="/doctor-list">
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Book Your First Appointment
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

      <div className={`min-h-screen bg-gray-50 ${isApp ? 'pt-4' : 'pt-16'}`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-md md:text-3xl font-bold text-gray-900">
                My Appointment
              </h1>
              <p className="text-xs md:text-lg text-gray-600">
                Manage your healthcare appointments
              </p>
            </div>

          <div className="flex items-center space-x-4 ">
            <Link href="/doctor-list">
              <Button>
                <Calendar className="w-4 h-4 mr-2 " />
                Book <span className="hidden md:block">New Appointment</span>
              </Button>
            </Link>
            <Link href="/patient/payments" className="md:hidden">
              <Button variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                Payments
              </Button>
            </Link>
          </div>
          </div>

          <div className="mb-8">
            <WalletCard />
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

            <TabsList className="flex w-full space-x-2 bg-gray-100 p-1.5 rounded-full border border-gray-200 shadow-inner">
              <TabsTrigger
                value="upcoming"
                className="flex-1 rounded-full py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:bg-gray-200"
              >
                <Clock className="w-4 h-4 mr-2 hidden sm:inline-block" />
                <span>Upcoming ({upcomingAppointments.length})</span>
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
