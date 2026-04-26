"use client";
import DoctorProfile from "@/components/BookingSteps/DoctorProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { convertTo24Hour, minutesToTime, parseLocalDate, startOfDay, toLocalYMD } from "@/lib/dateUtils";
import { useAppointmentStore } from "@/store/appointmentStore";
import { useDoctorStore } from "@/store/doctorStore";
import { userAuthStore } from "@/store/authStore";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppDetection } from "@/hooks/use-app-detection";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CalendarStep from "@/components/BookingSteps/CalendarStep";
import ConsultationStep from "@/components/BookingSteps/ConsultationStep";
import PayementStep from "@/components/BookingSteps/PayementStep";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import { cn } from "@/lib/utils";

const page = () => {
  const isApp = useAppDetection();
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId as string;

  const { currentDoctor, fetchDoctorById } = useDoctorStore();
  const { bookAppointment, loading, fetchBookedSlots, bookedSlots } =
    useAppointmentStore();

  ///state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [consultationType, setConsultationType] =
    useState("Video Consultation");
  const [symptoms, setSymptoms] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [bookingPlatformFees, setBookingPlatformFees] = useState(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [createdAppointmentId,setCreatedAppointmentId] = useState<string | null>(null)
  const { user } = userAuthStore();
  const patientName = user?.name || user?.email || "Patient";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        await fetch('/api/admin/billing-settings', { cache: 'no-store' });
        // Settings are now handled directly in getConsultationPrice for specific discounts
      } catch (e) {
        // ignore
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorById(doctorId);
    }
  }, [doctorId, fetchDoctorById]);

  useEffect(() => {
    if (selectedDate && doctorId) {
      const dateString = toLocalYMD(selectedDate);
      fetchBookedSlots(doctorId, dateString);
    }
  }, [selectedDate, doctorId, fetchBookedSlots]);

  const addDays = (base: Date, days: number): Date => {
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
  };

  //Generate avaiable dates
  useEffect(() => {
    if (!currentDoctor) return;

    const today = startOfDay(new Date());
    const range = currentDoctor.availabilityRange;
    const excludedWeekdays = range?.excludedWeekdays || [];

    const parsedStart = range?.startDate ? parseLocalDate(range.startDate) : null;
    const parsedEnd = range?.endDate ? parseLocalDate(range.endDate) : null;

    const rawStart = startOfDay(parsedStart ?? today);
    const rawEnd = startOfDay(parsedEnd ?? addDays(today, 30));
    const start = new Date(Math.max(today.getTime(), rawStart.getTime()));
    const end = rawEnd < start ? addDays(start, 30) : rawEnd;

    const dates: string[] = [];
    for (let d = new Date(start); d <= end && dates.length < 90; d.setDate(d.getDate() + 1)) {
      if (excludedWeekdays.includes(d.getDay())) continue;
      dates.push(toLocalYMD(d));
    }

    setAvailableDates(dates);

    if (selectedDate) {
      const selectedKey = toLocalYMD(selectedDate);
      if (!dates.includes(selectedKey)) {
        setSelectedDate(undefined);
        setSelectedSlot("");
      }
    }
  }, [currentDoctor]);

  //Generate avaiable slots
  useEffect(() => {
    if (!selectedDate || !currentDoctor) {
      setAvailableSlots([]);
      return;
    }

    const slots: string[] = [];
    const slotDuration = currentDoctor.slotDurationMinutes || 30;

    const rawRanges =
      currentDoctor.dailyTimeRanges && currentDoctor.dailyTimeRanges.length > 0
        ? currentDoctor.dailyTimeRanges
        : [{ start: "09:00", end: "17:00" }];

    const effectiveRanges = rawRanges.filter((range: any) => {
      const startMinutes = timeToMinutes(range.start);
      const endMinutes = timeToMinutes(range.end);
      return (
        Number.isFinite(startMinutes) &&
        Number.isFinite(endMinutes) &&
        endMinutes > startMinutes
      );
    });

    const rangesToUse =
      effectiveRanges.length > 0 ? effectiveRanges : [{ start: "09:00", end: "17:00" }];

    rangesToUse.forEach((timeRange: any) => {
      const startMinutes = timeToMinutes(timeRange.start);
      const endMinutes = timeToMinutes(timeRange.end);

      for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
        slots.push(minutesToTime(minutes));
      }
    });

    setAvailableSlots(slots);
  }, [selectedDate, currentDoctor]);

  useEffect(() => {
    setSelectedSlot("");
  }, [selectedDate]);

  const timeToMinutes = (timeStr: string): number => {
    const trimmed = timeStr.trim();
    if (!trimmed) return 0;

    const [timePart, periodRaw] = trimmed.split(" ");
    const [rawHours, rawMinutes] = timePart.split(":");

    let hours = Number(rawHours);
    let minutes = Number(rawMinutes);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return 0;
    }

    const period = periodRaw ? periodRaw.toUpperCase() : undefined;

    if (period === "PM" && hours < 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      alert("please complete all required fields");
      return false;
    }

    setIsPaymentProcessing(true);
    try {
      const dateString = toLocalYMD(selectedDate);
      const slotStart = new Date(
        `${dateString}T${convertTo24Hour(selectedSlot)}`
      );
      const slotEnd = new Date(
        slotStart.getTime() + (currentDoctor!.slotDurationMinutes || 30) * 60000
      );

      const now = new Date();
      if (slotStart.getTime() <= now.getTime()) {
        alert("Please select a future time slot");
        setIsPaymentProcessing(false);
        return false;
      }

      const consultationFees = getConsultationPrice();
      let platformPercent = 0;
      try {
        const res = await fetch('/api/admin/billing-settings', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          platformPercent = Math.max(0, Math.min(100, Number(json?.config?.platformFeePercent || 0)));
        }
      } catch {}
      const platformFees = Math.round((consultationFees * platformPercent) / 100);
      const totalAmount = consultationFees + platformFees;
      setBookingPlatformFees(platformFees);

      const appointment=await bookAppointment({
        doctorId: doctorId,
        slotStartIso: slotStart.toISOString(),
        slotEndIso: slotEnd.toISOString(),
        consultationType,
        symptoms,
        date: dateString,
        consultationFees,
        platformFees,
        totalAmount,
      });


      //store appointemnt Id and patinet name for paymnet 
      if(appointment && appointment?._id) {
        setCreatedAppointmentId(appointment._id);
        setIsPaymentProcessing(false);
        return true;
      }
      setIsPaymentProcessing(false);
      return false;
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to create appointment");
      setIsPaymentProcessing(false);
      return false;
    }
  };

  const getConsultationPrice = (): number => {
    const basePrice = currentDoctor?.fees || 0;
    
    if (consultationType === "Voice Call") {
        // Force 30% discount as per user requirement
        const discount = Math.round((basePrice * 30) / 100);
        return Math.max(0, basePrice - discount);
    }
    
    if (consultationType === "Messaging") {
        // Force 50% discount as per user requirement
        const discount = Math.round((basePrice * 50) / 100);
        return Math.max(0, basePrice - discount);
    }
    
    return basePrice;
  };


  const handlePaymentSuccess = (appointment:any) => {
                router.push("/patient/dashboard");
  }

  if (!currentDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  console.log("this is my current doctor", currentDoctor);

  return (
    <div className={cn(
      "min-h-screen bg-[#F8FAFC]",
      isApp ? "pt-6" : "pt-24",
      "pb-24"
    )}>
      <Header />
      
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex items-center space-x-5">
            {!isApp && (
              <Link href="/doctor-list">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-14 w-14 rounded-[2rem] bg-white shadow-xl shadow-blue-100/50 border border-gray-100 hover:bg-gray-50 text-gray-600 transition-all active:scale-95 group"
                >
                  <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
                </Button>
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-1.5 w-6 bg-blue-600 rounded-full" />
                <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Booking Portal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                Book Appointment
              </h1>
              <p className="text-gray-500 font-medium mt-1">
                Complete the steps to confirm your visit
              </p>
            </div>
          </div>

          {/* Process Indicator */}
          <div className="flex items-center bg-white p-2.5 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-100/20 w-fit">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-[1.5rem] transition-all duration-500",
                    currentStep === step ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : 
                    currentStep > step ? "text-blue-600 bg-blue-50/50" : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500",
                      currentStep === step ? "bg-white/20 scale-110" : 
                      currentStep > step ? "bg-blue-100/50" : "bg-gray-100"
                    )}
                  >
                    {currentStep > step ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>

                  <span className={cn(
                    "text-xs font-black uppercase tracking-[0.1em] transition-all duration-500",
                    currentStep === step ? "opacity-100 translate-x-0" : 
                    currentStep > step ? "opacity-100" : "hidden sm:inline opacity-40"
                  )}>
                    {step === 1 ? "Schedule" : step === 2 ? "Consultation" : "Payment"}
                  </span>
                </div>
                {step < 3 && <div className="w-3" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <DoctorProfile doctor={currentDoctor} />
          </aside>

          <main className="lg:col-span-8 order-1 lg:order-2">
            <Card className="shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border-none rounded-[3.5rem] overflow-hidden bg-white ring-1 ring-gray-100">
              <CardContent className="p-8 md:p-14">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CalendarStep
                       selectedDate={selectedDate}
                       setSelectedDate={setSelectedDate}
                       selectedSlot={selectedSlot}
                       setSelectedSlot={setSelectedSlot}
                       availableSlots={availableSlots}
                       availableDates={availableDates}
                       excludedWeekdays={currentDoctor?.availabilityRange?.excludedWeekdays || []}
                       bookedSlots={bookedSlots}
                       onContinue={() => setCurrentStep(2)}
                      />
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ConsultationStep 
                       doctorId={doctorId}
                       consultationType={consultationType}
                       setConsultationType={setConsultationType}
                       setSymptoms={setSymptoms}
                       symptoms={symptoms}
                       doctorFees={currentDoctor?.fees || 0}
                       onBack={() => setCurrentStep(1)}
                       isLoading={isPaymentProcessing}
                       onContinue={async () => {
                         const success = await handleBooking();
                         if (success) {
                           setCurrentStep(3);
                         }
                         return success;
                       }}
                      />
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PayementStep 
                      selectedDate={selectedDate}
                      selectedSlot={selectedSlot}
                      consultationType={consultationType}
                      doctorName={currentDoctor.name}
                      slotDuration={currentDoctor.slotDurationMinutes}
                      consultationFee={getConsultationPrice()}
                      platformFee={bookingPlatformFees}
                      isProcessing={isPaymentProcessing}
                            onBack={() => setCurrentStep(2)}
                            onConfirm={() => router.push("/patient/dashboard")}
                            onPaymentSuccess={handlePaymentSuccess}
                            loading={loading}
                            appointmentId={createdAppointmentId || undefined}
                            patientName={patientName || undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default page;
