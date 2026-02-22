"use client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";

const ContactPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, subject, message }),
      });
      if (!response.ok) {
        setError("Unable to send message. Please try again.");
        return;
      }
      setSubmitted(true);
      setFullName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setError("Unable to send message. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <Header showDashboardNav={false} />
      <main className="pt-20 pb-16">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
              Contact MedicsOnline Support
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              We are here to help with appointments, billing, technical issues, and general
              questions about MedicsOnline. Send us a message and a member of our support team
              will get back to you.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[1.3fr,1fr]">
          <Card className="shadow-sm border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-blue-900">
                Send us a message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm md:text-base font-medium text-gray-700">Full name</label>
                    <Input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm md:text-base font-medium text-gray-700">Email address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-gray-700">Subject</label>
                  <Input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="How can we help?"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-gray-700">Message</label>
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Share more details so our team can assist you quickly."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Please do not include emergency medical information. If you are experiencing a
                    medical emergency, call your local emergency number immediately.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    disabled={isSubmitting || !fullName.trim() || !email.trim() || !message.trim()}
                  >
                    {isSubmitting ? "Sending message..." : "Send message"}
                  </Button>
                  {error && !isSubmitting && (
                    <p className="text-sm md:text-base text-red-600">{error}</p>
                  )}
                  {submitted && !isSubmitting && (
                    <p className="text-sm md:text-base text-green-600">
                      Message sent. Our team will reach out to you shortly.
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-blue-100 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-900 text-lg md:text-xl">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  MedicsOnline support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-base md:text-lg text-gray-700">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-base md:text-lg">Email</p>
                    <p className="text-gray-600">medicsonlineng@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-base md:text-lg">Phone</p>
                    <p className="text-gray-600">+234-816-888-2014</p>
                    <p className="text-xs text-gray-500 mt-0.5">Available 8am – 8pm WAT, Monday to Saturday</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-base md:text-lg">Coverage</p>
                    <p className="text-gray-600">MedicsOnline is available across Nigeria.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-900 text-blue-50">
              <CardContent className="p-5 space-y-2 text-base md:text-lg">
                <p className="font-semibold text-blue-50">Not for emergencies</p>
                <p className="text-blue-100">
                  MedicsOnline is designed for non-emergency consultations. If you or someone near
                  you is in a medical emergency, please call your local emergency number or visit the
                  nearest hospital immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
