"use client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <Header showDashboardNav={false} />
      <main className="pt-20 pb-16">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900">
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              These Terms of Service govern your use of MedicsOnline and our telehealth services.
              By creating an account or using the platform, you agree to these terms.
            </p>
            <p className="text-xs text-gray-500">Last updated: February 2026</p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                1. About MedicsOnline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                MedicsOnline is a digital platform that connects patients with licensed healthcare
                professionals for remote medical consultations.
              </p>
              <p>
                MedicsOnline does not replace emergency services. If you are experiencing a medical
                emergency, you must contact your local emergency number or visit the nearest
                hospital immediately.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                2. Eligibility and accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                You must be at least 18 years old or have the consent of a parent or legal guardian
                to use MedicsOnline.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials
                and for all activity that occurs under your account.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                3. Use of the service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>When using MedicsOnline, you agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate and complete information about yourself.</li>
                <li>
                  Use the platform only for lawful purposes and in accordance with applicable health
                  regulations.
                </li>
                <li>
                  Not misuse, interfere with, or attempt to gain unauthorised access to the
                  platform.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                4. Payments and billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                Fees for consultations and other services will be presented to you before you
                confirm a booking.
              </p>
              <p>
                Payments are processed securely through our payment partners. By completing a
                booking, you authorise us and our partners to charge the applicable fees to your
                selected payment method.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                5. Medical disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                All clinical services on MedicsOnline are provided by independent, licensed
                healthcare professionals. MedicsOnline does not practice medicine or provide
                medical advice.
              </p>
              <p>
                Any information on the platform that is not part of a consultation is for
                general informational purposes only and should not be used as a substitute for
                professional medical advice, diagnosis, or treatment.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                6. Limitation of liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                To the fullest extent permitted by law, MedicsOnline will not be liable for any
                indirect, incidental, special, or consequential damages arising out of or in
                connection with your use of the platform.
              </p>
              <p>
                Our total liability for any claims relating to the platform will be limited to the
                amount you paid for services in the twelve months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                7. Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                We may suspend or terminate your access to MedicsOnline if you violate these terms
                or use the platform in a way that may cause harm to us, healthcare professionals, or
                other users.
              </p>
              <p>
                You may stop using the platform at any time. Certain provisions of these terms will
                continue to apply after termination, including those relating to payments,
                intellectual property, and limitation of liability.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                8. Changes to these terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                We may update these Terms of Service from time to time. When we make material
                changes, we will post an updated version on this page and, if appropriate, notify you
                through the platform or by email.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-blue-900">
                9. Contact information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                If you have questions about these Terms of Service, you can contact MedicsOnline at
                medicsonlineng@gmail.com.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
