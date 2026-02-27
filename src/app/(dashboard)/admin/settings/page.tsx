"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, ChevronDown, ChevronRight } from "lucide-react";
import { healthcareCategoriesList, specializations as defaultSpecializations } from "@/lib/constant";

type HomepageFaqItem = {
  question: string;
  answer: string;
};

type HomepageStep = {
  title: string;
  description: string;
};

type HomepageHighlight = {
  text: string;
};

type HomepageTestimonial = {
  rating: number;
  text: string;
  author: string;
  location: string;
  bgColor: string;
};

type HomepageSocialLink = {
  name: string;
  url: string;
};

type HomepageContent = {
  siteName: string;
  headerLogoUrl?: string | null;
  headerLogoPublicId?: string | null;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  howTitle: string;
  howSubtitle: string;
  howSteps: HomepageStep[];
  howHighlights: HomepageHighlight[];
  faqTitle: string;
  faqSubtitle: string;
  faqItems: HomepageFaqItem[];
  footerIntro: string;
  footerContactPhone: string;
  footerContactEmail: string;
  footerContactLocation: string;
  testimonials: HomepageTestimonial[];
  socials?: HomepageSocialLink[];
  footerLogoUrl?: string | null;
  footerLogoPublicId?: string | null;
};

const defaultHomepageContent: HomepageContent = {
  siteName: "MedicsOnline",
  headerLogoUrl: null,
  headerLogoPublicId: null,
  heroTitle: "Connect with doctors",
  heroHighlight: "anytime, anywhere",
  heroDescription:
    "Book appointments, consult via video, and manage your healthcare journey all in one secure platform",
  heroPrimaryCtaLabel: "Find Doctors",
  heroSecondaryCtaLabel: "Login as Doctor",
  howTitle: "How MedicsOnline Works",
  howSubtitle:
    "From finding the right doctor to getting your treatment plan, everything happens securely on your phone in a few simple steps.",
  howSteps: [
    {
      title: "Create your account",
      description:
        "Sign up in minutes and securely share the basic details your doctor needs to care for you.",
    },
    {
      title: "Find the right doctor",
      description:
        "Browse verified doctors by specialty, experience, and fees, then choose who you want to speak with.",
    },
    {
      title: "Join your consultation",
      description:
        "Connect via secure HD video or voice call from anywhere in Nigeria, at the time that works for you.",
    },
    {
      title: "Get your plan & follow-up",
      description:
        "Receive your doctor's notes, prescriptions, and follow-up instructions all in one secure place.",
    },
  ],
  howHighlights: [
    {
      text: "Most patients speak to a doctor within the same day.",
    },
    {
      text: "All consultations are encrypted and handled by licensed Nigerian doctors.",
    },
  ],
  faqTitle: "Frequently asked questions",
  faqSubtitle:
    "Find quick answers to the most common questions about how MedicsOnline works for patients and doctors.",
  faqItems: [],
  footerIntro:
    "Your trusted healthcare partner providing quality medical consultations with certified doctors online, anytime, anywhere.",
  footerContactPhone: "+234-816-888-2014",
  footerContactEmail: "medicsonlineng@gmail.com",
  footerContactLocation: "Available across Nigeria",
  testimonials: [],
  socials: [
    { name: "twitter", url: "https://twitter.com/medicsonlineng" },
    { name: "facebook", url: "https://facebook.com/medicsonlineng" },
    { name: "linkedin", url: "https://linkedin.com/company/medicsonlineng" },
    { name: "instagram", url: "https://instagram.com/medicsonlineng" },
  ],
  footerLogoUrl: null,
  footerLogoPublicId: null,
};

type DoctorTaxonomiesConfig = {
  specializations: string[];
  categories: string[];
};

const defaultTaxonomiesConfig: DoctorTaxonomiesConfig = {
  specializations: defaultSpecializations,
  categories: healthcareCategoriesList,
};

export default function AdminSettingsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [brandingOpen, setBrandingOpen] = useState(true);
  const [realtimeOpen, setRealtimeOpen] = useState(true);
  const [taxonomiesOpen, setTaxonomiesOpen] = useState(true);
  const [homepageOpen, setHomepageOpen] = useState(true);
  const [subscribersOpen, setSubscribersOpen] = useState(true);
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepageContent);
  const [savingHomepage, setSavingHomepage] = useState(false);
  const [homepageError, setHomepageError] = useState<string | null>(null);
  const [homepageSaved, setHomepageSaved] = useState(false);
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; created_at: string }[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [taxonomies, setTaxonomies] = useState<DoctorTaxonomiesConfig>(defaultTaxonomiesConfig);
  const [savingTaxonomies, setSavingTaxonomies] = useState(false);
  const [taxonomiesError, setTaxonomiesError] = useState<string | null>(null);
  const [taxonomiesSaved, setTaxonomiesSaved] = useState(false);
  const [billingOpen, setBillingOpen] = useState(true);
  const [billingSettings, setBillingSettings] = useState<{ platformFeePercent: number; adminCommissionPercent: number }>({ platformFeePercent: 0, adminCommissionPercent: 20 });
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingSaved, setBillingSaved] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("admin_auto_refresh") : null;
    if (stored === "off") {
      setAutoRefresh(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadBilling = async () => {
      try {
        const res = await fetch('/api/admin/billing-settings', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!mounted) return;
        const cfg = (json?.config as any) || {};
        setBillingSettings({
          platformFeePercent: Number(cfg.platformFeePercent || 0),
          adminCommissionPercent: Number(cfg.adminCommissionPercent || 20),
        });
      } catch {}
    };
    loadBilling();
    return () => { mounted = false };
  }, []);

  const handleSaveBilling = async () => {
    setBillingSaving(true);
    setBillingError(null);
    setBillingSaved(false);
    try {
      const res = await fetch('/api/admin/billing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingSettings),
      });
      if (!res.ok) {
        setBillingError('Unable to save billing settings.');
        return;
      }
      setBillingSaved(true);
    } catch {
      setBillingError('Unable to save billing settings.');
    } finally {
      setBillingSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadSubscribers = async () => {
      setLoadingSubscribers(true);
      try {
        const response = await fetch("/api/admin/subscribers");
        if (!response.ok) return;
        const json = (await response.json()) as { subscribers?: { id: string; email: string; created_at: string }[] };
        if (!isMounted) return;
        setSubscribers(json.subscribers ?? []);
      } catch {
      } finally {
        if (isMounted) setLoadingSubscribers(false);
      }
    };
    loadSubscribers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("admin_auto_refresh", autoRefresh ? "on" : "off");
  }, [autoRefresh]);

  useEffect(() => {
    let isMounted = true;

    const loadHomepageContent = async () => {
      try {
        const response = await fetch("/api/admin/homepage");
        if (!response.ok) return;
        const json = (await response.json()) as { config?: HomepageContent | null };
        if (!isMounted) return;
        if (json && json.config) {
          setHomepageContent({ ...defaultHomepageContent, ...json.config });
        }
      } catch {
        // ignore and keep defaults
      }
    };

    loadHomepageContent();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTaxonomies = async () => {
      try {
        const response = await fetch("/api/admin/taxonomies");
        if (!response.ok) return;
        const json = (await response.json()) as { config?: DoctorTaxonomiesConfig | null };
        if (!isMounted) return;
        if (json && json.config) {
          setTaxonomies({
            specializations: json.config.specializations?.length
              ? json.config.specializations
              : defaultTaxonomiesConfig.specializations,
            categories: json.config.categories?.length
              ? json.config.categories
              : defaultTaxonomiesConfig.categories,
          });
        }
      } catch {
      }
    };

    loadTaxonomies();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveHomepage = async () => {
    setSavingHomepage(true);
    setHomepageError(null);
    setHomepageSaved(false);
    try {
      const response = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(homepageContent),
      });
      if (!response.ok) {
        setHomepageError("Unable to save homepage content.");
        return;
      }
      setHomepageSaved(true);
    } catch {
      setHomepageError("Unable to save homepage content.");
    } finally {
      setSavingHomepage(false);
    }
  };

  const handleSaveTaxonomies = async () => {
    setSavingTaxonomies(true);
    setTaxonomiesError(null);
    setTaxonomiesSaved(false);
    try {
      const response = await fetch("/api/admin/taxonomies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taxonomies),
      });
      if (!response.ok) {
        setTaxonomiesError("Unable to save doctor taxonomies.");
        return;
      }
      setTaxonomiesSaved(true);
    } catch {
      setTaxonomiesError("Unable to save doctor taxonomies.");
    } finally {
      setSavingTaxonomies(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600">Control how the admin dashboard behaves.</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">Billing & Fees</CardTitle>
          <button onClick={() => setBillingOpen((v) => !v)} className="text-gray-500 hover:text-gray-700">
            {billingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CardHeader>
        {billingOpen && (
        <CardContent className="space-y-4 text-sm text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Platform fee (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={billingSettings.platformFeePercent}
                onChange={(e) => setBillingSettings((prev) => ({ ...prev, platformFeePercent: Math.max(0, Math.min(100, Number(e.target.value || 0))) }))}
              />
              <p className="text-xs text-gray-500 mt-1">Charged in addition to the consultation fee. Default 0%.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Admin commission (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={billingSettings.adminCommissionPercent}
                onChange={(e) => setBillingSettings((prev) => ({ ...prev, adminCommissionPercent: Math.max(0, Math.min(100, Number(e.target.value || 0))) }))}
              />
              <p className="text-xs text-gray-500 mt-1">Deducted from doctor earnings. Default 20%.</p>
            </div>
          </div>
          {billingError && <div className="text-xs text-red-600">{billingError}</div>}
          {billingSaved && <div className="text-xs text-green-600">Saved.</div>}
          <div className="flex justify-end">
            <Button type="button" size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSaveBilling} disabled={billingSaving}>
              {billingSaving ? 'Saving…' : 'Save billing settings'}
            </Button>
          </div>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">Branding</CardTitle>
          <button onClick={() => setBrandingOpen((v) => !v)} className="text-gray-500 hover:text-gray-700">
            {brandingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CardHeader>
        {brandingOpen && (
        <CardContent className="space-y-6 text-sm text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Header logo URL</label>
              <input
                type="url"
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                placeholder="https://..."
                value={homepageContent.headerLogoUrl ?? ''}
                onChange={(e) => setHomepageContent((prev) => ({ ...prev, headerLogoUrl: e.target.value }))}
              />
              <div className="mt-2">
                {homepageContent.headerLogoUrl ? (
                  <img src={homepageContent.headerLogoUrl || undefined} alt="Header logo" className="h-10 w-auto rounded border" />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <span>No header logo set</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Recommended: SVG or PNG, ~40x40 for header.</p>
              <div
                className="mt-2 rounded border border-dashed border-gray-300 p-3 text-xs text-gray-600"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  try {
                    const { uploadImage } = await import("@/lib/cloudinary");
                    const res = await uploadImage(file, "medimeet/branding");
                    setHomepageContent((prev) => ({ ...prev, headerLogoUrl: res.url, headerLogoPublicId: res.publicId }));
                  } catch {}
                }}
              >
                Drag & drop header logo here
              </div>
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-2 text-xs">
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { uploadImage } = await import("@/lib/cloudinary");
                        const res = await uploadImage(file, "medimeet/branding");
                        setHomepageContent((prev) => ({ ...prev, headerLogoUrl: res.url, headerLogoPublicId: res.publicId }));
                      } catch {
                      } finally {
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const publicId = homepageContent.headerLogoPublicId;
                    if (publicId) {
                      try {
                        await fetch('/api/upload/destroy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId }) });
                      } catch {}
                    }
                    setHomepageContent((prev) => ({ ...prev, headerLogoUrl: null, headerLogoPublicId: null }));
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Footer logo URL</label>
              <input
                type="url"
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                placeholder="https://..."
                value={homepageContent.footerLogoUrl ?? ''}
                onChange={(e) => setHomepageContent((prev) => ({ ...prev, footerLogoUrl: e.target.value }))}
              />
              <div className="mt-2">
                {homepageContent.footerLogoUrl ? (
                  <img src={homepageContent.footerLogoUrl || undefined} alt="Footer logo" className="h-10 w-auto rounded border" />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <span>No footer logo set</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Recommended: SVG or PNG, ~48x48 for footer.</p>
              <div
                className="mt-2 rounded border border-dashed border-gray-300 p-3 text-xs text-gray-600"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  try {
                    const { uploadImage } = await import("@/lib/cloudinary");
                    const res = await uploadImage(file, "medimeet/branding");
                    setHomepageContent((prev) => ({ ...prev, footerLogoUrl: res.url, footerLogoPublicId: res.publicId }));
                  } catch {}
                }}
              >
                Drag & drop footer logo here
              </div>
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-2 text-xs">
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { uploadImage } = await import("@/lib/cloudinary");
                        const res = await uploadImage(file, "medimeet/branding");
                        setHomepageContent((prev) => ({ ...prev, footerLogoUrl: res.url, footerLogoPublicId: res.publicId }));
                      } catch {
                      } finally {
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const publicId = homepageContent.footerLogoPublicId;
                    if (publicId) {
                      try {
                        await fetch('/api/upload/destroy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId }) });
                      } catch {}
                    }
                    setHomepageContent((prev) => ({ ...prev, footerLogoUrl: null, footerLogoPublicId: null }));
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSaveHomepage}
              disabled={savingHomepage}
            >
              {savingHomepage ? 'Saving...' : 'Save branding'}
            </Button>
          </div>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">Real-time updates</CardTitle>
          <button onClick={() => setRealtimeOpen((v) => !v)} className="text-gray-500 hover:text-gray-700">
            {realtimeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CardHeader>
        {realtimeOpen && (
        <CardContent className="flex items-center justify-between text-sm text-gray-700">
          <div>
            <div className="font-semibold">Auto refresh admin pages</div>
            <p className="text-xs text-gray-500">
              When enabled, admin dashboards periodically refresh to show the latest activity.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh((prev) => !prev)}
          >
            {autoRefresh ? "On" : "Off"}
          </Button>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">Doctor taxonomies</CardTitle>
          <button onClick={() => setTaxonomiesOpen((v) => !v)} className="text-gray-500 hover:text-gray-700">
            {taxonomiesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CardHeader>
        {taxonomiesOpen && (
        <CardContent className="space-y-6 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="font-semibold">Specializations</div>
            <div className="space-y-2">
              {taxonomies.specializations.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    value={value}
                    onChange={(event) => {
                      const next = [...taxonomies.specializations];
                      next[index] = event.target.value;
                      setTaxonomies((prev) => ({ ...prev, specializations: next }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const next = taxonomies.specializations.filter((_, i) => i !== index);
                      setTaxonomies((prev) => ({ ...prev, specializations: next }));
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setTaxonomies((prev) => ({
                    ...prev,
                    specializations: [...prev.specializations, ""],
                  }))
                }
              >
                Add specialization
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold">Healthcare categories</div>
            <div className="space-y-2">
              {taxonomies.categories.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    value={value}
                    onChange={(event) => {
                      const next = [...taxonomies.categories];
                      next[index] = event.target.value;
                      setTaxonomies((prev) => ({ ...prev, categories: next }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const next = taxonomies.categories.filter((_, i) => i !== index);
                      setTaxonomies((prev) => ({ ...prev, categories: next }));
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setTaxonomies((prev) => ({
                    ...prev,
                    categories: [...prev.categories, ""],
                  }))
                }
              >
                Add category
              </Button>
            </div>
          </div>

          {taxonomiesError && <p className="text-xs text-red-600">{taxonomiesError}</p>}
          {taxonomiesSaved && !taxonomiesError && (
            <p className="text-xs text-green-600">Doctor taxonomies saved.</p>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSaveTaxonomies}
              disabled={savingTaxonomies}
            >
              {savingTaxonomies ? "Saving..." : "Save doctor taxonomies"}
            </Button>
          </div>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Homepage content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="font-semibold">Header & hero section</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Site name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.siteName}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({ ...prev, siteName: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Hero title</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.heroTitle}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({ ...prev, heroTitle: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Hero highlight</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.heroHighlight}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({ ...prev, heroHighlight: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Hero primary button label</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.heroPrimaryCtaLabel}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({ ...prev, heroPrimaryCtaLabel: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Hero secondary button label</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.heroSecondaryCtaLabel}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({ ...prev, heroSecondaryCtaLabel: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-600">Hero description</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[60px]"
                  value={homepageContent.heroDescription}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({ ...prev, heroDescription: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold">How it works section</div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Section title</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    value={homepageContent.howTitle}
                    onChange={(event) =>
                      setHomepageContent((prev) => ({ ...prev, howTitle: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-gray-600">Section subtitle</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[60px]"
                    value={homepageContent.howSubtitle}
                    onChange={(event) =>
                      setHomepageContent((prev) => ({ ...prev, howSubtitle: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homepageContent.howSteps.map((step, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Step {index + 1} title
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={step.title}
                      onChange={(event) => {
                        const nextSteps = [...homepageContent.howSteps];
                        nextSteps[index] = { ...nextSteps[index], title: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, howSteps: nextSteps }));
                      }}
                    />
                    <label className="text-xs font-medium text-gray-600">Step {index + 1} description</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[50px]"
                      value={step.description}
                      onChange={(event) => {
                        const nextSteps = [...homepageContent.howSteps];
                        nextSteps[index] = { ...nextSteps[index], description: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, howSteps: nextSteps }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homepageContent.howHighlights.map((highlight, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Highlight {index + 1}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={highlight.text}
                      onChange={(event) => {
                        const nextHighlights = [...homepageContent.howHighlights];
                        nextHighlights[index] = { ...nextHighlights[index], text: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, howHighlights: nextHighlights }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold">FAQ section</div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Section title</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    value={homepageContent.faqTitle}
                    onChange={(event) =>
                      setHomepageContent((prev) => ({ ...prev, faqTitle: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-gray-600">Section subtitle</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[60px]"
                    value={homepageContent.faqSubtitle}
                    onChange={(event) =>
                      setHomepageContent((prev) => ({ ...prev, faqSubtitle: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-3">
                {homepageContent.faqItems.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Question {index + 1}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={item.question}
                      onChange={(event) => {
                        const nextItems = [...homepageContent.faqItems];
                        nextItems[index] = { ...nextItems[index], question: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, faqItems: nextItems }));
                      }}
                    />
                    <label className="text-xs font-medium text-gray-600">Answer {index + 1}</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[60px]"
                      value={item.answer}
                      onChange={(event) => {
                        const nextItems = [...homepageContent.faqItems];
                        nextItems[index] = { ...nextItems[index], answer: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, faqItems: nextItems }));
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setHomepageContent((prev) => ({
                      ...prev,
                      faqItems: [...prev.faqItems, { question: "", answer: "" }],
                    }))
                  }
                >
                  Add FAQ
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold">Footer section</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-3">
                <label className="text-xs font-medium text-gray-600">Intro text</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[60px]"
                  value={homepageContent.footerIntro}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({ ...prev, footerIntro: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Contact phone</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.footerContactPhone}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({
                      ...prev,
                      footerContactPhone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Contact email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.footerContactEmail}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({
                      ...prev,
                      footerContactEmail: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Contact location</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={homepageContent.footerContactLocation}
                  onChange={(event) =>
                    setHomepageContent((prev) => ({
                      ...prev,
                      footerContactLocation: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <div className="text-xs font-medium text-gray-600">Social links</div>
                <div className="space-y-2">
                  {(homepageContent.socials ?? []).map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                        value={item.name}
                        onChange={(event) => {
                          const next = [...(homepageContent.socials ?? [])];
                          next[index] = { ...next[index], name: event.target.value };
                          setHomepageContent((prev) => ({ ...prev, socials: next }));
                        }}
                      >
                        <option value="twitter">Twitter</option>
                        <option value="facebook">Facebook</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="github">GitHub</option>
                      </select>
                      <input
                        type="url"
                        placeholder="https://"
                        className="sm:col-span-2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        value={item.url}
                        onChange={(event) => {
                          const next = [...(homepageContent.socials ?? [])];
                          next[index] = { ...next[index], url: event.target.value };
                          setHomepageContent((prev) => ({ ...prev, socials: next }));
                        }}
                      />
                      <div className="sm:col-span-3 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const next = (homepageContent.socials ?? []).filter((_, i) => i !== index);
                            setHomepageContent((prev) => ({ ...prev, socials: next }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setHomepageContent((prev) => ({
                        ...prev,
                        socials: [...(prev.socials ?? []), { name: "twitter", url: "" }],
                      }))
                    }
                  >
                    Add social link
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold">Testimonials section</div>
            <div className="space-y-3">
              {homepageContent.testimonials.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 rounded-md p-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Rating</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={item.rating}
                      onChange={(event) => {
                        const value = Number(event.target.value) || 0;
                        const rating = Math.max(1, Math.min(5, value));
                        const nextItems = [...homepageContent.testimonials];
                        nextItems[index] = { ...nextItems[index], rating };
                        setHomepageContent((prev) => ({ ...prev, testimonials: nextItems }));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Background color class</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      placeholder="bg-chart-1/10"
                      value={item.bgColor}
                      onChange={(event) => {
                        const nextItems = [...homepageContent.testimonials];
                        nextItems[index] = { ...nextItems[index], bgColor: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, testimonials: nextItems }));
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Quote</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[60px]"
                      value={item.text}
                      onChange={(event) => {
                        const nextItems = [...homepageContent.testimonials];
                        nextItems[index] = { ...nextItems[index], text: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, testimonials: nextItems }));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Author</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={item.author}
                      onChange={(event) => {
                        const nextItems = [...homepageContent.testimonials];
                        nextItems[index] = { ...nextItems[index], author: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, testimonials: nextItems }));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Location</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={item.location}
                      onChange={(event) => {
                        const nextItems = [...homepageContent.testimonials];
                        nextItems[index] = { ...nextItems[index], location: event.target.value };
                        setHomepageContent((prev) => ({ ...prev, testimonials: nextItems }));
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setHomepageContent((prev) => ({
                    ...prev,
                    testimonials: [
                      ...prev.testimonials,
                      {
                        rating: 5,
                        text: "",
                        author: "",
                        location: "",
                        bgColor: "bg-chart-1/10",
                      },
                    ],
                  }))
                }
              >
                Add testimonial
              </Button>
            </div>
          </div>

          {homepageError && <p className="text-xs text-red-600">{homepageError}</p>}
          {homepageSaved && !homepageError && (
            <p className="text-xs text-green-600">Homepage content saved.</p>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSaveHomepage}
              disabled={savingHomepage}
            >
              {savingHomepage ? "Saving..." : "Save homepage content"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">Newsletter subscribers</CardTitle>
          <button onClick={() => setSubscribersOpen((v) => !v)} className="text-gray-500 hover:text-gray-700">
            {subscribersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CardHeader>
        {subscribersOpen && (
        <CardContent className="space-y-4 text-sm text-gray-700">
          {loadingSubscribers ? (
            <p className="text-sm text-gray-500">Loading subscribers...</p>
          ) : subscribers.length === 0 ? (
            <p className="text-sm text-gray-500">No subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-gray-900">{s.email}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {new Date(s.created_at).toLocaleString("en-NG", {
                          timeZone: "Africa/Lagos",
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const header = "email,created_at\n";
                    const rows = subscribers
                      .map((s) => `${s.email},${new Date(s.created_at).toISOString()}`)
                      .join("\n");
                    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "newsletter_subscribers.csv";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export CSV
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        )}
      </Card>
    </div>
  );
}
