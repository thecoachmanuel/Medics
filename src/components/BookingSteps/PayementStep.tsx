import { userAuthStore } from "@/store/authStore";
import React, { useEffect, useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, CreditCard, Loader2, Shield, XCircle, Wallet, Calendar, Clock, User, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useWalletStore } from "@/store/walletStore";
import { payWithWallet } from "@/actions/wallet-actions";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppDetection } from "@/hooks/use-app-detection";
import { cn } from "@/lib/utils";

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
  platformFee: number;
}

const PayementStep = ({
  selectedDate,
  selectedSlot,
  consultationType,
  doctorName,
  consultationFee,
  onBack,
  onConfirm,
  onPaymentSuccess,
  appointmentId,
  patientName,
  platformFee,
}: PaymentStepInterface) => {
  const isApp = useAppDetection();
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const { user } = userAuthStore();
  const { balance, fetchWallet } = useWalletStore();
  const [error, setError] = useState<string>("");
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const totalAmount = Math.round(consultationFee + platformFee);
  const paystackLoadPromiseRef = useRef<Promise<void> | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number; currency: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchWallet(user.id);
    }
  }, [user, fetchWallet]);

  useEffect(() => {
    if (!appointmentId || !patientName) return;
    if (!paystackLoadPromiseRef.current) {
      paystackLoadPromiseRef.current = ensurePaystackScript();
    }
  }, [appointmentId, patientName]);

  const handleWalletPayment = async () => {
    if (!appointmentId || !user?.id) {
      toast.error("Missing appointment details. Please go back and try again.");
      return;
    }
    
    if (balance < totalAmount) {
      const msg = "Insufficient wallet balance. Please fund your wallet or use Paystack.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsPaymentLoading(true);
    setError("");
    setPaymentStatus("processing");
    const toastId = toast.loading("Processing wallet payment...");

    try {
      const res = await payWithWallet(appointmentId, user.id, totalAmount);
      if (res.success) {
        toast.success("Payment successful!", { id: toastId });
        setPaymentStatus('success');
        setPaymentDetails({ amount: totalAmount, currency: 'NGN' });
      } else {
        throw new Error(res.error || "Wallet payment failed");
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Wallet payment failed';
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
      setPaymentStatus('failed');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!appointmentId || !patientName) {
      toast.error("Missing appointment details. Please go back and try again.");
      return;
    }

    try {
      setIsPaymentLoading(true);
      setError("");
      setPaymentStatus("processing");
      const toastId = toast.loading("Initializing Paystack...");

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
      
      toast.dismiss(toastId);

      paystack.newTransaction({
        key: publicKey,
        email,
        amount: Math.round((totalAmount || 0) * 100),
        currency: 'NGN',
        reference: `${appointmentId}-${Date.now()}`,
        metadata: {
          appointmentId,
          doctorName,
          patientName,
        },
        onSuccess: async (transaction: any) => {
          const verifyToastId = toast.loading("Verifying payment...");
          try {
            const res = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: transaction.reference, appointmentId }),
            });
            const data = await res.json();
            if (res.ok && data?.success) {
              toast.success("Payment verified successfully!", { id: verifyToastId });
              setPaymentStatus('success');
              if (data?.data && typeof data.data.amount === 'number') {
                setPaymentDetails({
                  amount: data.data.amount,
                  currency: data.data.currency || 'NGN',
                });
              }
            } else {
              throw new Error(data?.error || 'Payment verification failed');
            }
          } catch (err: any) {
            const errMsg = err?.message || 'Payment failed';
            setError(errMsg);
            toast.error(errMsg, { id: verifyToastId });
            setPaymentStatus('failed');
            setPaymentDetails(null);
          }
        },
        onCancel: () => {
          toast.info("Payment cancelled");
          setPaymentStatus('idle');
          setError('');
          setIsPaymentLoading(false);
        },
      });
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Payment initialization failed";
      setError(errMsg);
      toast.error(errMsg);
      setPaymentStatus('failed');
      setIsPaymentLoading(false);
    }
  };

  const handleSuccessClick = () => {
    if (onPaymentSuccess) {
      onPaymentSuccess({ 
        amount: paymentDetails?.amount || totalAmount, 
        currency: paymentDetails?.currency || 'NGN',
        appointmentId,
      });
    } else {
      onConfirm();
    }
  };

  return (
    <div className="space-y-10">
      <AnimatePresence mode="wait">
        {paymentStatus === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-lg shadow-green-100">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-2">Payment Confirmed!</h3>
            <p className="text-gray-500 font-medium mb-10 max-w-xs">Your appointment with {doctorName} is successfully booked.</p>
            
            <div className="w-full bg-gray-50 rounded-[2rem] p-6 mb-10 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Amount Paid</span>
                <span className="text-xl font-black text-gray-900">₦{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Transaction ID</span>
                <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{appointmentId}</span>
              </div>
            </div>

            <Button onClick={handleSuccessClick} className="h-14 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95">
              Go to Dashboard
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">
                  Payment
                </h3>
                <p className="text-gray-500 text-sm font-medium">Review summary and complete booking</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100 shadow-inner">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Booking Summary</h4>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                        <p className="text-sm font-bold text-gray-900">
                          {selectedDate?.toLocaleDateString("en-NG", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Clock className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Slot</p>
                        <p className="text-sm font-bold text-gray-900">{selectedSlot}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Doctor</p>
                        <p className="text-sm font-bold text-gray-900">{doctorName}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8 bg-gray-200" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Consultation Fee</span>
                      <span className="text-gray-900 font-black">₦{consultationFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Platform Fee</span>
                      <span className="text-gray-900 font-black">₦{platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-black text-gray-900">Total Amount</span>
                      <span className="text-2xl font-black text-blue-600">₦{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-blue-900 text-sm uppercase tracking-wider">Secure Payment</h4>
                    <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">
                      Your payment is processed through secure encryption. Choose your preferred method below.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 p-4 rounded-2xl flex items-start gap-3 border border-red-100">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-xs text-red-700 font-bold leading-tight">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={handleWalletPayment}
                    disabled={isPaymentLoading}
                    className={cn(
                      "w-full group relative overflow-hidden bg-white border-2 rounded-[2rem] p-6 text-left transition-all duration-300 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-100",
                      isPaymentLoading ? "opacity-50 cursor-not-allowed" : ""
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Wallet className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-lg">Pay with Wallet</p>
                        <p className="text-xs text-gray-500 font-medium">Balance: ₦{balance.toLocaleString()}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>

                  <button
                    onClick={handlePaystackPayment}
                    disabled={isPaymentLoading}
                    className={cn(
                      "w-full group relative overflow-hidden bg-white border-2 rounded-[2rem] p-6 text-left transition-all duration-300 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-100",
                      isPaymentLoading ? "opacity-50 cursor-not-allowed" : ""
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-lg">Pay with Card</p>
                        <p className="text-xs text-gray-500 font-medium">Secured by Paystack</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                </div>
                
                {isPaymentLoading && (
                  <div className="flex items-center justify-center gap-3 py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Processing...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center pt-6 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={isPaymentLoading}
                className="h-14 px-8 rounded-2xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayementStep;

