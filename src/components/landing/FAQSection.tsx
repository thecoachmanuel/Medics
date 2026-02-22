"use client";
import { faqs } from "@/lib/constant";
import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 text-center mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg md:text-xl text-gray-600 text-center mb-10">
            Find quick answers to the most common questions about how MedicsOnline
            works for patients and doctors.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-card border border-border shadow-sm">
                <CardContent className="p-0">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors duration-200 cursor-pointer"
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  >
                    <span className="text-lg md:text-xl font-medium text-primary pr-4">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-muted-foreground transform transition-transform duration-200 flex-shrink-0 ${
                        openFAQ === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {openFAQ === index && (
                    <div className="px-6 pb-4">
                      <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
