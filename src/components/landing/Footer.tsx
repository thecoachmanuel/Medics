"use client";
import { contactInfo, footerSections, socials as defaultSocials } from "@/lib/constant";
import { Stethoscope, Twitter, Facebook, Linkedin, Instagram, Youtube, Github } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";

interface FooterProps {
  introText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactLocation?: string;
  socialLinks?: { name: string; url: string }[];
}

const Footer: React.FC<FooterProps> = ({ introText, contactPhone, contactEmail, contactLocation, socialLinks }) => {
  const resolvedIntro =
    introText && introText.trim().length > 0
      ? introText
      : "Your trusted healthcare partner providing quality medical consultations with certified doctors online, anytime, anywhere.";

  const phoneText = contactPhone && contactPhone.trim().length > 0 ? contactPhone : contactInfo[0]?.text;
  const emailText = contactEmail && contactEmail.trim().length > 0 ? contactEmail : contactInfo[1]?.text;
  const locationText =
    contactLocation && contactLocation.trim().length > 0 ? contactLocation : contactInfo[2]?.text;

  const mergedContactInfo = [
    { ...contactInfo[0], text: phoneText },
    { ...contactInfo[1], text: emailText },
    { ...contactInfo[2], text: locationText },
  ];
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    twitter: Twitter,
    facebook: Facebook,
    linkedin: Linkedin,
    instagram: Instagram,
    youtube: Youtube,
    github: Github,
  };
  const computedSocials = Array.isArray(socialLinks) && socialLinks.length
    ? socialLinks
        .map((s) => ({ ...s, icon: iconMap[s.name.toLowerCase()] }))
        .filter((s) => !!s.icon)
    : defaultSocials;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        setError(json?.error || "Unable to subscribe. Try again later.");
        return;
      }
      setMessage("Subscribed successfully. Thank you!");
      setEmail("");
    } catch {
      setError("Unable to subscribe. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600  rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-br from-white to-blue-100  bg-clip-text text-transparent">
                  MedicsOnline
                </div>
              </div>

              <p className="text-blue-100 mb-6 text-lg leading-relaxed">
                {resolvedIntro}
              </p>

              <div className="space-y-3 mb-6">
                {mergedContactInfo.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 text-blue-100"
                  >
                    <item.icon className="w-4 h-4 text-blue-300" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Links section */}

            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {footerSections.map((section, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-white mb-4 text-lg">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a
                            href={link.href}
                            className="text-blue-200 hover:text-white transition-colors duration-200 text-sm hover:underline"
                          >
                            {link.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Newslesster section */}

        <div className="py-8 border-t border-blue-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Stay Updated</h4>
              <p className="text-blue-200 text-sm">
                Get health tips and product updates delivered to your inbox.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rpounded-lg bg-blue-800/50 border border-blue-600 text-white placeholder:blue-300  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent min-w-[280px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleSubscribe}
                disabled={submitting || !email}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg whitespace-nowrap"
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>
            {message && <p className="text-xs text-green-300 mt-2">{message}</p>}
            {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
          </div>
        </div>

        {/* Bottom section */}

        <div className="py-6 border-t border-blue-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-blue-200 text-sm">
              <p>&copy; 2026 MedicsOnline, Inc. All rights resetved</p>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-blue-200 text-sm">Follow use:</span>
              <div className="flex space-x-3">
                {computedSocials.map(({ name, icon: Icon, url }: any) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-blue-700/50 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label={`Follow use on ${name}`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
