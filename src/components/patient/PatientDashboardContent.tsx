"use client";
import React, { useEffect, useState } from "react";
import Header from "../landing/Header";
import { userAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Appointment, useAppointmentStore } from "@/store/appointmentStore";
import { Card, CardContent } from "../ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { Calendar, Clock, CreditCard, FileText, MapPin, Phone, Star, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { getStatusColor } from "@/lib/constant";
import PrescriptionViewModal from "../doctor/PrescriptionViewModal";

const PatientDashboardContent = () => {
  const { user, isAuthenticated } = userAuthStore();
  const router = useRouter();
  const { appointments, fetchAppointments, loading } = useAppointmentStore();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [tabCounts, setTabCounts] = useState({
    upcoming: 0,
    past: 0,
  });

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
    if (!user.isVerified) {
      router.push(`/onboarding/${user.type}`);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.type === "patient") {
      fetchAppointments("patient", activeTab);
    }
  }, [user, activeTab, fetchAppointments]);

  //update tab counts whever appointmnet chnage
  useEffect(() => {
    const now = new Date();
    //filter the upcoming appointmnet
    const upcomingAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.slotStartIso);
      return (
        (aptDate >= now || apt.status === "In Progress") &&
        (apt.status === "Scheduled" || apt.status === "In Progress")
      );
    });

    //filter the past appointmnet
    const pastAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.slotStartIso);
      return (
        aptDate < now ||
        apt.status === "Completed" ||
        apt.status === "Cancelled"
      );
    });

    setTabCounts({
      upcoming: upcomingAppointments.length,
      past: pastAppointments.length,
    });
  }, [appointments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return appointmentDate.toDateString() === today.toDateString();
  };

  const canJoinCall = (appointment: any) => {
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

  if (!user) {
    return null;
  }

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
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
                <div className="flex items-center justify-center md:justify-start space-x-1 text-sm text-gray-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{appointment.doctorId?.hospitalInfo?.name}</span>
                </div>
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
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                  <span>{appointment.consultationType}</span>
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="flex justify-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold">Fee:</span>
                  <p>₦{appointment.doctorId?.fees}</p>
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
                <Link href={`/call/${appointment._id}`}>
                <Button
                 size='sm'
                 className="bg-green-600 hover:bg-green-700"
                >
                  <Video className="w-4 h-4 mr-2"/>
                  Join Call
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

            {appointment.status === 'Completed' && (
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_,i) => (
                  <Star
                   className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
                </div>
            )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

      <div className="min-h-screen bg-gray-50 pt-16">
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

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="upcoming"
                className="flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Upcoming ({tabCounts.upcoming})</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Past ({tabCounts.past})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {loading ? (
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
              ) : appointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {appointments.map((appointment) => (
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
              {loading ? (
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
              ) : appointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {appointments.map((appointment) => (
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

export default PatientDashboardContent;
