import { userAuthStore } from "@/store/authStore";
import React, { useEffect, useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, CreditCard, Loader2, Shield, XCircle } from "lucide-react";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const ensurePaystackScript = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.PaystackPop) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(
    'script[src="https://js.paystack.co/v2/inline.js"]'
  );
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      const timer = window.setInterval(() => {
        if (window.PaystackPop) {
          window.clearInterval(timer);
          resolve();
        }
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(timer);
        reject(new Error("Paystack failed to load"));
      }, 10_000);
    });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Paystack failed to load"));
    document.body.appendChild(script);
  });
};

interface PaymentStepInterface {
  selectedDate: Date | undefined;
  selectedSlot: string;
  consultationType: string;
  doctorName: string;
  slotDuration: number;
  consultationFee: number;
  isProcessing: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onPaymentSuccess?: (appointment: any) => void;
  loading: boolean;
  appointmentId?: string;
  patientName?: string;
}
const PayementStep = ({
  selectedDate,
  selectedSlot,
  consultationType,
  doctorName,
  slotDuration,
  consultationFee,
  isProcessing,
  onBack,
  onConfirm,
  onPaymentSuccess,
  loading,
  appointmentId,
  patientName,
}: PaymentStepInterface) => {
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const { user } = userAuthStore();
  const [error, setError] = useState<string>("");
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const platformFees = Math.round(consultationFee * 0.1);
  const totalAmount = consultationFee + platformFees;
  const [shouldAutoOpen,setShouldAutoOpen] = useState(true)
  const modelCloseCountRef = useRef<number>(0)
  const paystackLoadPromiseRef = useRef<Promise<void> | null>(null)

  //Load Paystack inline script and auto-trigger payment
  useEffect(() => {
    if (!appointmentId || !patientName) return;
    if (!paystackLoadPromiseRef.current) {
      paystackLoadPromiseRef.current = ensurePaystackScript();
    }
  }, [appointmentId, patientName]);

  useEffect(() => {
    if(appointmentId && patientName && paymentStatus === 'idle' && !isPaymentLoading && shouldAutoOpen){
      const timer =setTimeout(() => {
        handlePayment();
      },500);
      return () => clearTimeout(timer)
    }
  },[appointmentId,patientName,paymentStatus,isPaymentLoading,shouldAutoOpen])

  


  const handlePayment = async () => {
    if (!appointmentId || !patientName) {
      onConfirm();
      return;
    }

    try {
      setIsPaymentLoading(true);
      setError("");
      setPaymentStatus("processing");

      if (!paystackLoadPromiseRef.current) {
        paystackLoadPromiseRef.current = ensurePaystackScript();
      }
      await paystackLoadPromiseRef.current;
      if (!window.PaystackPop) {
        throw new Error("Paystack is not available");
      }

      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) throw new Error('Missing Paystack public key');

      const email = user?.email;
      if (!email) throw new Error('Missing user email for payment');

      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email,
        amount: (totalAmount || 0) * 100,
        currency: 'NGN',
        reference: `${appointmentId}-${Date.now()}`,
        metadata: {
          appointmentId,
          doctorName,
          patientName,
        },
        onSuccess: async (transaction: any) => {
          try {
            const res = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: transaction.reference, appointmentId }),
            });
            const data = await res.json();
            if (res.ok && data?.success) {
              setPaymentStatus('success');
              if (onPaymentSuccess) {
                onPaymentSuccess(data?.data);
              } else {
                onConfirm();
              }
            } else {
              throw new Error(data?.error || 'Payment verification failed');
            }
          } catch (err: any) {
            setError(err?.message || 'Payment failed');
            setPaymentStatus('failed');
          }
        },
        onCancel: () => {
          setPaymentStatus('idle');
          setError('');
          modelCloseCountRef.current += 1;
          if (modelCloseCountRef.current === 1) {
            setTimeout(() => handlePayment(), 1000);
          } else {
            setShouldAutoOpen(false);
          }
        },
      });
    } catch (error: any) {
      console.error("payment error", error);
      setError(error.message || "paymnet failed");
      setPaymentStatus("failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handlePaynow = () => {
    if (appointmentId && patientName) {
      modelCloseCountRef.current =0;
      handlePayment();
    } else {
      onConfirm();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Payment & Confimation
        </h3>
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-medium">
                {selectedDate?.toLocaleDateString()} at {selectedSlot}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Consultation Type</span>
              <span className="font-medium">{consultationType}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Doctor</span>
              <span className="font-medium">{doctorName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{slotDuration} minutes</span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-gray-600">Consultation Fee</span>
              <span className="font-medium">₦{consultationFee}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium">₦{platformFees}</span>
            </div>

            <Separator />

            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-green-600">₦{totalAmount}</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {paymentStatus === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Payment...
              </h4>
              <p className="text-gray-600 mb-4">
                Please complete the payment in the Paystack window
              </p>
              <Progress value={50} className="w-full" />
            </motion.div>
          )}

          {paymentStatus === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h4 className="text-lg font-semibold text-green-800 mb-2">
                Payment Successfully!
              </h4>
              <p className="text-gray-600 mb-4">
                Your appointment has been confirmed
              </p>
            </motion.div>
          )}

          {paymentStatus === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
              <h4 className="text-lg font-semibold text-red-800 mb-2">
                Payment failed!
              </h4>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setPaymentStatus("idle");
                  setError("");
                }}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg mb-8">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Secure Payment</p>
            <p>Your payment is protected by 256-bit SSL encryption</p>
          </div>
        </div>
      </div>

      {paymentStatus === "idle" && (
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onBack} className="px-8 py-3">
            Back
          </Button>
          <Button
            onClick={handlePaynow}
            disabled={loading || isPaymentLoading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="text-sm md:text-lg">
                  Creating Appointment...
                </span>
              </>
            ) : isPaymentLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="text-sm md:text-lg">Processing...</span>
              </>
            ) : appointmentId && patientName ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="text-sm md:text-lg">
                  Opening Payment...
                </span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2 " />
                <span className="text-sm md:text-lg">Pay ₦{totalAmount} & Book</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PayementStep;
