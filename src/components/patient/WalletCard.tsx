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
    <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Wallet Balance
            </p>
            <h3 className="text-3xl font-bold">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: currency || "NGN",
              }).format(balance)}
            </h3>
          </div>
          <Dialog open={isFundModalOpen} onOpenChange={setIsFundModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="secondary" 
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Fund Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Fund Your Wallet</DialogTitle>
                <DialogDescription>
                  Add money to your wallet to pay for appointments instantly.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₦</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="5000"
                      className="pl-8"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsFundModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleFundWallet} 
                  disabled={isFunding || !amount}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isFunding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Paystack
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-blue-100">
            <p>Use your wallet for faster checkouts</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-700/50 p-0 h-auto px-2 py-1"
              onClick={() => user?.id && fetchWallet(user.id)}
            >
              <RefreshCcw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};
