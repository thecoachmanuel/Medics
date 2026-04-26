"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, Plus, CreditCard, Loader2, RefreshCcw } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { userAuthStore } from "@/store/authStore";
import { fundWallet } from "@/actions/wallet-actions";
import { toast } from "sonner";

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

export const WalletCard = () => {
  const { user } = userAuthStore();
  const { balance, currency, fetchWallet, loading } = useWalletStore();
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const paystackLoadPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchWallet(user.id);
    }
  }, [user, fetchWallet]);

  useEffect(() => {
    if (isFundModalOpen && !paystackLoadPromiseRef.current) {
      paystackLoadPromiseRef.current = ensurePaystackScript();
    }
  }, [isFundModalOpen]);

  const handleFundWallet = async () => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!user?.email || !user?.id) {
      toast.error("User information missing");
      return;
    }

    setIsFunding(true);

    try {
      if (!paystackLoadPromiseRef.current) {
        paystackLoadPromiseRef.current = ensurePaystackScript();
      }
      await paystackLoadPromiseRef.current;
      
      if (!window.PaystackPop) {
        throw new Error("Paystack is not available");
      }

      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) throw new Error('Missing Paystack public key');

      const paystack = new window.PaystackPop();
      const reference = `fund-${user.id}-${Date.now()}`;

      paystack.newTransaction({
        key: publicKey,
        email: user.email,
        amount: amountValue * 100, // Convert to kobo
        currency: 'NGN',
        reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Payment Type",
              variable_name: "payment_type",
              value: "wallet_funding",
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id,
            }
          ]
        },
        onSuccess: async (transaction: any) => {
          try {
            // Verify and fund wallet on server
            const res = await fundWallet(user.id, amountValue, transaction.reference);
            
            if (res.success) {
              toast.success(`Successfully funded wallet with ${currency} ${amountValue}`);
              setIsFundModalOpen(false);
              setAmount("");
              fetchWallet(user.id); // Refresh balance
            } else {
              toast.error(res.error || "Failed to fund wallet");
            }
          } catch (err: any) {
            toast.error(err.message || "An error occurred");
          } finally {
            setIsFunding(false);
          }
        },
        onCancel: () => {
          setIsFunding(false);
          toast.info("Transaction cancelled");
        },
      });

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to initialize payment");
      setIsFunding(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-none shadow-xl shadow-blue-200/50 rounded-3xl overflow-hidden relative group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-110" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

      <CardContent className="p-6 md:p-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-100/80">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
            </div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl md:text-4xl font-black tracking-tight">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: currency || "NGN",
                  minimumFractionDigits: 0,
                }).format(balance)}
              </h3>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-200" />}
            </div>
          </div>

          <Dialog open={isFundModalOpen} onOpenChange={setIsFundModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="secondary" 
                className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl px-6 py-6 shadow-lg transition-all active:scale-95"
              >
                <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                Top Up
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900">Add Money</DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Fund your wallet for instant medical consultations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-sm font-bold text-gray-700 ml-1">Enter Amount</Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-blue-600 transition-colors group-focus-within:text-blue-700">₦</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="5,000"
                      className="pl-10 h-16 text-xl font-black rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-blue-500/10 transition-all bg-gray-50/50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[1000, 2000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className="flex-none px-4 py-2 rounded-xl border-2 border-gray-100 text-xs font-bold text-gray-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                      >
                        +₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleFundWallet} 
                  disabled={isFunding || !amount}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
                >
                  {isFunding ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Pay Securely"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-blue-700 bg-blue-500/50 flex items-center justify-center">
                  <CreditCard className="w-3 h-3 text-blue-100" />
                </div>
              ))}
            </div>
            <span className="text-[10px] md:text-xs font-bold text-blue-100/70 uppercase tracking-widest">Secure Payments</span>
          </div>
          <button 
            className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-blue-200 transition-colors"
            onClick={() => user?.id && fetchWallet(user.id)}
          >
            <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Sync
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
