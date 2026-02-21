"use client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <Header showDashboardNav={false} />
      <main className="pt-20 pb-16">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              This Privacy Policy explains how MedicsOnline collects, uses, and protects your
              personal information when you use our website and telehealth services.
            </p>
            <p className="text-xs text-gray-500">
              Last updated: February 2026
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                1. Who we are
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                MedicsOnline is a telehealth platform that connects patients with licensed doctors
                for virtual consultations across Nigeria.
              </p>
              <p>
                When this policy refers to "we", "us", or "our", it refers to the MedicsOnline
                entity that is responsible for your information.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                2. Information we collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>We collect the following categories of information when you use MedicsOnline:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Account information such as your name, email address, phone number, and
                  authentication details.
                </li>
                <li>
                  Profile details you choose to provide, including age, gender, medical history,
                  and preferences.
                </li>
                <li>
                  Consultation data such as appointment history, symptoms you share, and notes
                  recorded by your doctor.
                </li>
                <li>
                  Payment and billing information processed via our payment partners.
                </li>
                <li>
                  Technical information such as device identifiers, IP address, browser type, and
                  usage analytics.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                3. How we use your information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide and manage your account and appointments.</li>
                <li>
                  Connect you with doctors and enable secure video, voice, and text consultations.
                </li>
                <li>
                  Process payments, send receipts, and manage billing through our payment partners.
                </li>
                <li>
                  Improve our services, troubleshoot issues, and protect platform security.
                </li>
                <li>
                  Communicate with you about appointments, reminders, updates, and support.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                4. How we share information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                We do not sell your personal information. We share information only when it is
                necessary to operate the service or required by law, including with:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Licensed doctors who consult with you on MedicsOnline, limited to information
                  required for your care.
                </li>
                <li>
                  Service providers that support our technology, analytics, and payment
                  infrastructure.
                </li>
                <li>
                  Regulators or authorities when we are legally required to do so.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                5. Data security and retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                We use technical, administrative, and organisational measures to protect your
                information against unauthorised access, loss, or misuse.
              </p>
              <p>
                We retain your information for as long as your account is active or as needed to
                provide services, comply with legal obligations, resolve disputes, and enforce our
                agreements.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                6. Your rights and choices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                Depending on your location, you may have rights to access, update, or delete your
                personal information, or to object to certain types of processing.
              </p>
              <p>
                You can update key profile information from your MedicsOnline account dashboard or
                contact us at medicsonlineng@gmail.com for privacy-related requests.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                7. Changes to this policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our
                services, legal requirements, or how we handle your information.
              </p>
              <p>
                When we make material changes, we will post an updated version on this page and, if
                appropriate, notify you via email or through the MedicsOnline app.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                8. Contact us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or how we handle your data, you can
                contact us at:
              </p>
              <p className="text-base md:text-lg text-gray-700">medicsonlineng@gmail.com</p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
