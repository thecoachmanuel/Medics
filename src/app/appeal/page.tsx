"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import { userAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Send } from "lucide-react";

const AppealPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = userAuthStore();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isAuthenticated || !user) {
      router.push("/login/patient");
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      setErrorMessage("Please provide details for your appeal.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("account_appeals").insert({
        user_id: user.id,
        role: user.type,
        reason: trimmed,
        status: "pending",
      });
      if (error) {
        setErrorMessage("Unable to submit appeal at the moment. Please try again.");
        return;
      }
      setSuccessMessage("Your appeal has been submitted and will be reviewed by admin.");
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  const redirectToHome = () => {
    if (user?.type === "doctor") {
      router.push("/doctor/dashboard");
    } else if (user?.type === "patient") {
      router.push("/patient/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <Header showDashboardNav={Boolean(isAuthenticated && user)} />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 pt-16">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="border border-red-200 bg-white/90">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg font-semibold text-red-900">
                  Account access restricted
                </CardTitle>
                <p className="text-xs md:text-sm text-red-800 mt-1">
                  Your account has been blocked by the admin team. You can submit an
                  appeal for review using the form below.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800">
                    Tell us what happened
                  </label>
                  <Textarea
                    rows={6}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain why you believe this action should be reviewed. Include any relevant details that can help the admin team."
                  />
                </div>

                {errorMessage && (
                  <p className="text-sm text-red-700">{errorMessage}</p>
                )}

                {successMessage && (
                  <p className="text-sm text-green-700">{successMessage}</p>
                )}

                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "Submitting appeal..." : "Submit appeal"}
                  </Button>
                  <button
                    type="button"
                    onClick={redirectToHome}
                    className="text-sm text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                  >
                    Go back to home
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AppealPage;

