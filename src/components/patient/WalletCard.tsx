'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Plus, CreditCard, Loader2 } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { fundWallet } from '@/actions/wallet-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { userAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function WalletCard() {
  const { balance, currency, fetchWallet, fetchTransactions } = useWalletStore();
  const { user } = userAuthStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFund = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    
    // Initialize Paystack
    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user?.email,
      amount: Number(amount) * 100, // Paystack expects amount in kobo
      currency: 'NGN',
      ref: `FUND-${Date.now()}-${user?.id?.slice(0, 5)}`,
      onSuccess: async (transaction: any) => {
        try {
          const res = await fundWallet(user!.id, Number(amount), transaction.reference);
          if (res.success) {
            toast.success("Wallet funded successfully");
            fetchWallet(user!.id);
            fetchTransactions(user!.id);
            setOpen(false);
            setAmount('');
          } else {
            toast.error(res.error || "Failed to fund wallet");
          }
        } catch (error) {
          toast.error("An error occurred");
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        setLoading(false);
        toast.info("Transaction cancelled");
      }
    });
  };

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-blue-100 font-medium text-sm">
          <Wallet className="w-4 h-4" /> My Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-bold">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency }).format(balance)}
            </p>
            <p className="text-blue-200 text-xs mt-1">Available Balance</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="bg-white text-blue-700 hover:bg-blue-50">
                <Plus className="w-4 h-4 mr-2" /> Fund Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fund Your Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (NGN)</label>
                  <Input 
                    type="number" 
                    placeholder="Enter amount" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={handleFund}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Proceed to Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
