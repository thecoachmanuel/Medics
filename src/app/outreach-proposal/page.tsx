"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Printer, Edit3, Save, Share2, Info } from "lucide-react";
import "./proposal.css";

export default function OutreachProposalPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="proposal-container">
      {/* Top Banner / Hint */}
      <div className="edit-hint">
        <Info className="w-4 h-4" />
        <span>
          <strong>Pro-Tip:</strong> All text on this page is directly editable. 
          Click any text to modify it before printing.
        </span>
      </div>

      {/* A4 Page Content */}
      <div className="a4-page" ref={pageRef}>
        {/* Letterhead Design Elements */}
        <div className="letterhead-border" />
        <div className="letterhead-accent-bg" />

        {/* Header Section */}
        <header className="proposal-header">
          <div className="logo-section">
            <Image
              src="/MedicsOnline_logo.png"
              alt="MedicsOnline Logo"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <div className="company-info" contentEditable suppressContentEditableWarning>
            <div className="company-name">MedicsOnline</div>
            <p className="contact-detail">123 Health Avenue, Medical District</p>
            <p className="contact-detail">contact@medicsonline.com</p>
            <p className="contact-detail">+234 (0) 800-MEDICS</p>
            <p className="contact-detail">www.medicsonline.com</p>
          </div>
        </header>

        {/* Proposal Body */}
        <div className="recipient-block" contentEditable suppressContentEditableWarning>
          <div className="proposal-date">{currentDate}</div>
          <p><strong>To:</strong> Potential Partner / Brand Sponsor</p>
          <p><strong>Organization:</strong> [Company Name]</p>
          <p><strong>Address:</strong> [City, State]</p>
        </div>

        <div className="subject-line" contentEditable suppressContentEditableWarning>
          RE: PARTNERSHIP PROPOSAL FOR "MEDICSONLINE" COMMUNITY MEDICAL OUTREACH
        </div>

        <div className="proposal-body">
          <section contentEditable suppressContentEditableWarning>
            <p>Dear Partners,</p>
            <p>
              It is with great enthusiasm that we invite your esteemed organization to join 
              <strong> MedicsOnline</strong> as a key partner for our upcoming community 
              medical outreach. This initiative is designed to bridge the gap in healthcare 
              accessibility while creating significant brand visibility for our partners and ourselves.
            </p>
            <p>
              Our primary objective for this outreach is to achieve our first 
              <strong> 100 patient enrollments</strong> on the MedicsOnline platform, ensuring 
              that these individuals receive immediate, high-quality medical attention and 
              long-term digital health support.
            </p>
          </section>

          <div className="highlight-box" contentEditable suppressContentEditableWarning>
            <h3 className="font-bold mb-2">Why Partner With Us?</h3>
            <p>
              This outreach isn't just a clinical exercise; it's a strategic brand activation. 
              By sponsoring this event, your organization will gain direct exposure to a 
              vibrant community of health-conscious individuals and professionals.
            </p>
          </div>

          <div className="benefit-grid" contentEditable suppressContentEditableWarning>
            <div className="benefit-item">
              <span className="benefit-title">Brand Publicity</span>
              <p className="text-sm">Co-branding on all physical and digital marketing materials reaching 5,000+ local residents.</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-title">Corporate Social Impact</span>
              <p className="text-sm">Tangible contribution to community health and the United Nations SDG 3 (Good Health & Well-being).</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-title">Data Insights</span>
              <p className="text-sm">Access to anonymized community health metrics (as permitted by privacy laws).</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-title">Networking</span>
              <p className="text-sm">Direct engagement with Nigeria's growing digital health ecosystem through MedicsOnline.</p>
            </div>
          </div>

          <section contentEditable suppressContentEditableWarning>
            <p>
              We are seeking partners to support us in areas of drug supplies, diagnostic kits, or 
              financial sponsorship to cover logistical costs. In return, we offer a professional 
              platform to showcase your commitment to healthcare innovation.
            </p>
            <p>
              We look forward to the possibility of discussing this partnership further. 
              Together, we can make quality healthcare a reality for everyone.
            </p>
          </section>
        </div>

        {/* Footer / Signature Section */}
        <footer className="proposal-footer">
          <div className="signature-block">
            <p>Yours Faithfully,</p>
            <div className="signature-space" contentEditable suppressContentEditableWarning>
              [Your Name / Title]
            </div>
            <p className="mt-2 font-bold" contentEditable suppressContentEditableWarning>MedicsOnline Partnerships Team</p>
          </div>
          <div className="footer-brand" contentEditable suppressContentEditableWarning>
            Healthcare. Simplified. Digital.
          </div>
        </footer>
      </div>

      {/* Floating Controls */}
      <div className="print-controls">
        <button className="control-btn secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Edit3 className="w-4 h-4" />
          Edit Mode
        </button>
        <button className="control-btn" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
          Print / PDF
        </button>
      </div>
    </div>
  );
}
