import { userAuthStore } from "@/store/authStore";
import React, { useEffect, useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, CreditCard, Loader2, Shield, XCircle, Wallet } from "lucide-react";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { useWalletStore } from "@/store/walletStore";
import { payWithWallet } from "@/actions/wallet-actions";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppDetection } from "@/hooks/use-app-detection";

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
  const isApp = useAppDetection();
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const { user } = userAuthStore();
  const { balance, fetchWallet } = useWalletStore();
  const [error, setError] = useState<string>("");
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [platformPercent, setPlatformPercent] = useState<number>(0);
  const platformFees = Math.round((consultationFee * platformPercent) / 100);
  const totalAmount = consultationFee + platformFees;
  const paystackLoadPromiseRef = useRef<Promise<void> | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number; currency: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchWallet(user.id);
    }
  }, [user, fetchWallet]);

  // Load Paystack inline script
  useEffect(() => {
    if (!appointmentId || !patientName) return;
    if (!paystackLoadPromiseRef.current) {
      paystackLoadPromiseRef.current = ensurePaystackScript();
    }
  }, [appointmentId, patientName]);

  useEffect(() => {
    let mounted = true;
    const loadBilling = async () => {
      try {
        const res = await fetch('/api/admin/billing-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        const p = Math.max(0, Math.min(100, Number(json?.config?.platformFeePercent || 0)));
        setPlatformPercent(p);
      } catch {}
    };
    loadBilling();
    return () => { mounted = false };
  }, []);

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
        // We do not auto-redirect anymore to allow user to see the success message
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
      
      toast.dismiss(toastId); // Dismiss initialization toast

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
              // We do not auto-redirect anymore
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
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card>
        <CardContent className={isApp ? "p-4" : "p-6"}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
              <p className="text-gray-500">Complete your appointment booking</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-3xl font-bold text-blue-600">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                }).format(totalAmount)}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time</span>
                <span className="font-medium">
                  {selectedDate?.toLocaleDateString("en-NG", {
                    timeZone: "Africa/Lagos",
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })} at {selectedSlot}
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
                <span className="text-gray-600">Consultation Fee</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(consultationFee)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(platformFees)}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-600">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {paymentStatus === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-500 mb-6">Your appointment has been confirmed.</p>
                <Button onClick={handleSuccessClick} className="w-full max-w-sm">
                  View Appointment Details
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Secure Payment</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Choose your preferred payment method.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">Payment Failed</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-blue-50 border-2 hover:border-blue-200"
                    onClick={handleWalletPayment}
                    disabled={isPaymentLoading}
                  >
                    <Wallet className="w-8 h-8 text-blue-600" />
                    <span className="font-semibold text-gray-900">Pay with Wallet</span>
                    <span className="text-xs text-gray-500">
                      Balance: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(balance)}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-blue-50 border-2 hover:border-blue-200"
                    onClick={handlePaystackPayment}
                    disabled={isPaymentLoading}
                  >
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <span className="font-semibold text-gray-900">Pay with Card</span>
                    <span className="text-xs text-gray-500">Secured by Paystack</span>
                  </Button>
                </div>
                
                {isPaymentLoading && (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-500 mt-2">Processing payment...</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <Button variant="ghost" onClick={onBack} disabled={isPaymentLoading}>
                    Back
                  </Button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayementStep;
