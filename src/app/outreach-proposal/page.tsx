"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Printer, RotateCcw, Save, Check, RefreshCw, Info } from "lucide-react";
import "./proposal.css";

const STORAGE_KEY = "medics_outreach_proposal_v1";

const DEFAULT_CONTENT = {
  companyInfo: {
    name: "MedicsOnline",
    address: "123 Health Avenue, Medical District",
    email: "contact@medicsonline.com",
    phone: "+234 (0) 800-MEDICS",
    web: "www.medicsonline.com",
  },
  recipient: {
    name: "Potential Partner / Brand Sponsor",
    org: "[Company Name]",
    address: "[City, State]",
  },
  subject: "RE: PARTNERSHIP PROPOSAL FOR \"MEDICSONLINE\" COMMUNITY MEDICAL OUTREACH",
  intro: `Dear Partners,
  
It is with great enthusiasm that we invite your esteemed organization to join MedicsOnline as a key partner for our upcoming community medical outreach. This initiative is designed to bridge the gap in healthcare accessibility while creating significant brand visibility for our partners and ourselves.

Our primary objective for this outreach is to achieve our first 100 patient enrollments on the MedicsOnline platform, ensuring that these individuals receive immediate, high-quality medical attention and long-term digital health support.`,
  highlight: `Why Partner With Us?
  
This outreach isn't just a clinical exercise; it's a strategic brand activation. By sponsoring this event, your organization will gain direct exposure to a vibrant community of health-conscious individuals and professionals.`,
  benefits: [
    { title: "Brand Publicity", desc: "Co-branding on all physical and digital marketing materials reaching 5,000+ local residents." },
    { title: "Corporate Social Impact", desc: "Tangible contribution to community health and the United Nations SDG 3 (Good Health & Well-being)." },
    { title: "Data Insights", desc: "Access to anonymized community health metrics (as permitted by privacy laws)." },
    { title: "Networking", desc: "Direct engagement with Nigeria's growing digital health ecosystem through MedicsOnline." }
  ],
  outro: `We are seeking partners to support us in areas of drug supplies, diagnostic kits, or financial sponsorship to cover logistical costs. In return, we offer a professional platform to showcase your commitment to healthcare innovation.

We look forward to the possibility of discussing this partnership further. Together, we can make quality healthcare a reality for everyone.`,
  signature: "[Your Name / Title]\nMedicsOnline Partnerships Team"
};

export default function OutreachProposalPage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved proposal", e);
      }
    }
    setMounted(true);
  }, []);

  // Save to localStorage whenever content changes
  useEffect(() => {
    if (!mounted) return;
    
    setIsSaving(true);
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(timeout);
  }, [content, mounted]);

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the proposal to the original template? This will erase your current edits.")) {
      setContent(DEFAULT_CONTENT);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const updateContent = (key: string, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const updateBenefit = (index: number, field: 'title' | 'desc', value: string) => {
    const newBenefits = [...content.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setContent(prev => ({ ...prev, benefits: newBenefits }));
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className="proposal-container">
      {/* Top Banner / Status */}
      <div className="status-banner">
        <div className="edit-hint">
          <Info className="w-4 h-4" />
          <span>
            <strong>Editable Mode:</strong> Your changes are automatically saved to your browser.
          </span>
        </div>
        <div className={`save-indicator ${isSaving ? 'saving' : ''}`}>
          {isSaving ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3 text-green-500" />
          )}
          <span>{isSaving ? 'Saving...' : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Saved'}</span>
        </div>
      </div>

      {/* A4 Page Content */}
      <div className="a4-page">
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
          <div className="company-info">
            <div 
              className="company-name" 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('companyInfo', { ...content.companyInfo, name: e.currentTarget.innerText })}
            >
              {content.companyInfo.name}
            </div>
            <p 
              className="contact-detail" 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('companyInfo', { ...content.companyInfo, address: e.currentTarget.innerText })}
            >
              {content.companyInfo.address}
            </p>
            <p 
              className="contact-detail" 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('companyInfo', { ...content.companyInfo, email: e.currentTarget.innerText })}
            >
              {content.companyInfo.email}
            </p>
            <p 
              className="contact-detail" 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('companyInfo', { ...content.companyInfo, phone: e.currentTarget.innerText })}
            >
              {content.companyInfo.phone}
            </p>
            <p 
              className="contact-detail" 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('companyInfo', { ...content.companyInfo, web: e.currentTarget.innerText })}
            >
              {content.companyInfo.web}
            </p>
          </div>
        </header>

        {/* Recipient Section */}
        <div className="recipient-block">
          <div className="proposal-date">{currentDate}</div>
          <p>
            <strong>To: </strong>
            <span 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('recipient', { ...content.recipient, name: e.currentTarget.innerText })}
            >
              {content.recipient.name}
            </span>
          </p>
          <p>
            <strong>Organization: </strong>
            <span 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('recipient', { ...content.recipient, org: e.currentTarget.innerText })}
            >
              {content.recipient.org}
            </span>
          </p>
          <p>
            <strong>Address: </strong>
            <span 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('recipient', { ...content.recipient, address: e.currentTarget.innerText })}
            >
              {content.recipient.address}
            </span>
          </p>
        </div>

        <div 
          className="subject-line" 
          contentEditable 
          suppressContentEditableWarning
          onBlur={(e) => updateContent('subject', e.currentTarget.innerText)}
        >
          {content.subject}
        </div>

        <div className="proposal-body">
          <section
            contentEditable 
            suppressContentEditableWarning
            onBlur={(e) => updateContent('intro', e.currentTarget.innerText)}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {content.intro}
          </section>

          <div className="highlight-box">
            <div
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('highlight', e.currentTarget.innerText)}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {content.highlight}
            </div>
          </div>

          <div className="benefit-grid">
            {content.benefits.map((benefit, idx) => (
              <div key={idx} className="benefit-item">
                <span 
                  className="benefit-title"
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => updateBenefit(idx, 'title', e.currentTarget.innerText)}
                >
                  {benefit.title}
                </span>
                <p 
                  className="text-sm"
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => updateBenefit(idx, 'desc', e.currentTarget.innerText)}
                >
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>

          <section
            contentEditable 
            suppressContentEditableWarning
            onBlur={(e) => updateContent('outro', e.currentTarget.innerText)}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {content.outro}
          </section>
        </div>

        {/* Footer / Signature */}
        <footer className="proposal-footer">
          <div className="signature-block">
            <p>Yours Faithfully,</p>
            <div 
              className="signature-space" 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => updateContent('signature', e.currentTarget.innerText)}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {content.signature}
            </div>
          </div>
          <div className="footer-brand">
            Healthcare. Simplified. Digital.
          </div>
        </footer>
      </div>

      {/* Floating Controls */}
      <div className="print-controls">
        <button className="control-btn secondary" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
          Reset Template
        </button>
        <button className="control-btn" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
          Print / PDF
        </button>
      </div>
    </div>
  );
}
