"use client";
import { DoctorFormData, HospitalInfo } from "@/lib/types";
import { userAuthStore } from "@/store/authStore";
import React, { ChangeEvent, useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { useRouter } from "next/navigation";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { healthcareCategoriesList, specializations as defaultSpecializations } from "@/lib/constant";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { uploadImage } from "@/lib/cloudinary";
import { supabase } from "@/lib/supabase/client";
import { FileIcon, LinkIcon, Loader2, Trash2, X } from "lucide-react";

const DoctorOnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<DoctorFormData>({
    specialization: "",
    categories: [],
    qualification: "",
    experience: "",
    fees: "",
    about: "",
    hospitalInfo: {
      name: "",
      address: "",
      city: "",
    },
    availabilityRange: {
      startDate: "",
      endDate: "",
      excludedWeekdays: [],
    },
    dailyTimeRanges: [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ],
    slotDurationMinutes: 30,
  });

  const [credentials, setCredentials] = useState<{ url: string; label: string }[]>([]);
  const [newCredentialLink, setNewCredentialLink] = useState("");
  const [newCredentialLabel, setNewCredentialLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>(defaultSpecializations);
  const [availableCategories, setAvailableCategories] = useState<string[]>(healthcareCategoriesList);

  const { updateProfile, user, loading } = userAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login/doctor");
      return;
    }

    if (user.type !== "doctor") {
      if (!user.isVerified) {
        router.push(`/onboarding/${user.type}`);
      } else if (user.type === "patient") {
        router.push("/patient/dashboard");
      }
    }
  }, [user, router]);

  useEffect(() => {
    let isMounted = true;

    const loadTaxonomies = async () => {
      try {
        const response = await fetch("/api/taxonomies");
        if (!response.ok) return;
        const json = (await response.json()) as {
          config?: {
            specializations?: string[];
            categories?: string[];
          } | null;
        };
        if (!isMounted || !json || !json.config) return;
        if (Array.isArray(json.config.specializations) && json.config.specializations.length) {
          setAvailableSpecializations(json.config.specializations);
        }
        if (Array.isArray(json.config.categories) && json.config.categories.length) {
          setAvailableCategories(json.config.categories);
        }
      } catch {
      }
    };

    loadTaxonomies();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryToggle = (category: string): void => {
    setFormData((prev: DoctorFormData) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c: string) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleInputChnage = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setFormData((prev: DoctorFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleHospitalInfoChnage = (
    field: keyof HospitalInfo,
    value: string
  ): void => {
    setFormData((prev) => ({
      ...prev,
      hospitalInfo: {
        ...prev.hospitalInfo,
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadImage(file, "medimeet/credentials");
      setCredentials((prev) => [
        ...prev,
        { url: result.url, label: file.name },
      ]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleAddLink = () => {
    if (!newCredentialLink) return;
    setCredentials((prev) => [
      ...prev,
      { url: newCredentialLink, label: newCredentialLabel || "External Link" },
    ]);
    setNewCredentialLink("");
    setNewCredentialLabel("");
  };

  const removeCredential = (index: number) => {
    setCredentials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      if (formData.categories.length === 0) {
        return;
      }
      
      // Save profile data
      await updateProfile({
        specialization: formData.specialization,
        category: formData.categories,
        qualification: formData.qualification,
        experience: formData.experience,
        about: formData.about,
        fees: formData.fees,
        hospitalInfo: formData.hospitalInfo,
        availabilityRange: {
          startDate: formData.availabilityRange.startDate,
          endDate: formData.availabilityRange.endDate,
          excludedWeekdays: formData.availabilityRange.excludedWeekdays,
        },
        dailyTimeRanges: formData.dailyTimeRanges,
        slotDurationMinutes: formData.slotDurationMinutes,
        isVerified: false,
      });

      // Save credentials
      if (credentials.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          await Promise.all(
            credentials.map((cred) =>
              fetch("/api/doctor/credentials", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(cred),
              })
            )
          );
        }
      }

      router.push("/doctor/dashboard");
    } catch (error) {
      console.error("Profile update failed", error);
    }
  };
  const handleNext = (): void => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Professional Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Medical Specialization</Label>

                  <Select
                    value={formData.specialization}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        specialization: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableSpecializations.map((spec: string) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience </Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    placeholder="e.g., 5"
                    onChange={handleInputChnage}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Healthcare Categories</Label>
                <p className="text-sm text-gray-600">
                  Select the healthcare areas you provide services for (Select
                  at least one)
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableCategories.map((category: string) => (
                    <div className="flex items-center space-x-2" key={category}>
                      <Checkbox
                        id={category}
                        checked={formData.categories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium cursor-pointer hover:text-blue-600"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.categories.length === 0 && (
                  <p className="text-red-500 text-xs">
                    Please select at least one category
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification </Label>
                <Input
                  id="qualification"
                  name="qualification"
                  type="text"
                  value={formData.qualification}
                  placeholder="e.g., MBBS, MD Cardiology"
                  onChange={handleInputChnage}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About You </Label>
                <Input
                  id="about"
                  name="about"
                  type="text"
                  value={formData.about}
                  placeholder="Tell patient about your expertise and approach to healthcare..."
                  onChange={handleInputChnage}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fees">Consultations Fee (₦) </Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  value={formData.fees}
                  placeholder="e.g., 500"
                  onChange={handleInputChnage}
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Hospital/Clinic Infomation
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hospitalName">Hospital/Clinic Name</Label>
                  <Input
                    id="hospitalName"
                    type="text"
                    value={formData.hospitalInfo.name}
                    placeholder="e.g., Apollo Hospital"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleHospitalInfoChnage("name", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.hospitalInfo.address}
                    placeholder="Full address of your practice"
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      handleHospitalInfoChnage("address", e.target.value)
                    }
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2 ">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.hospitalInfo.city}
                    placeholder="e.g., Abuja"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleHospitalInfoChnage("city", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Availability Settings
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Available From</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.availabilityRange.startDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        availabilityRange: {
                          ...prev.availabilityRange,
                          startDate: e.target.value,
                        },
                      }));
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Available Until</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.availabilityRange.endDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        availabilityRange: {
                          ...prev.availabilityRange,
                          endDate: e.target.value,
                        },
                      }));
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Appointment Slot Duration</Label>
                <Select
                  value={formData.slotDurationMinutes?.toString() || "30"}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      slotDurationMinutes: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot duration"></SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  Duration for each patient consultation slot
                </p>
              </div>
              <div className="space-y-3">
                <Label>Working Days</Label>
                <p className="text-sm text-gray-600">
                  Select the days you are NOT available
                </p>

                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {[
                    { day: "Sunday", value: 0 },
                    { day: "Monday", value: 1 },
                    { day: "Tuesday", value: 2 },
                    { day: "Wednesday", value: 3 },
                    { day: "Thursday", value: 4 },
                    { day: "Friday", value: 5 },
                    { day: "Saturday", value: 6 },
                  ].map(({ day, value }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${value}`}
                        checked={formData.availabilityRange.excludedWeekdays.includes(
                          value
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              availabilityRange: {
                                ...prev.availabilityRange,
                                excludedWeekdays: [
                                  ...prev.availabilityRange.excludedWeekdays,
                                  value,
                                ],
                              },
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              availabilityRange: {
                                ...prev.availabilityRange,
                                excludedWeekdays:
                                  prev.availabilityRange.excludedWeekdays.filter(
                                    (d) => d !== value
                                  ),
                              },
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor={`day-${value}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {day.slice(0, 3)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label>Daily Working Hours</Label>
                <p className="text-sm text-gray-600">
                  Set your working hours for each day
                </p>

                {formData.dailyTimeRanges.map((range, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label className="text-sm">
                        Session {index + 1} - Start time
                      </Label>
                      <Input
                        type="time"
                        value={range.start}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const newRange = [...formData.dailyTimeRanges];
                          newRange[index].start = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            dailyTimeRanges: newRange,
                          }));
                        }}
                        required
                      />
                    </div>

                    <div className="flex-1">
                      <Label className="text-sm">
                        Session {index + 1} - End time
                      </Label>
                      <Input
                        type="time"
                        value={range.end}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const newRange = [...formData.dailyTimeRanges];
                          newRange[index].end = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            dailyTimeRanges: newRange,
                          }));
                        }}
                        required
                      />
                    </div>

                    {formData.dailyTimeRanges.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = formData.dailyTimeRanges.filter(
                            (_, i) => i !== index
                          );
                          setFormData((prev) => ({
                            ...prev,
                            dailyTimeRanges: newRange,
                          }));
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      dailyTimeRanges: [
                        ...prev.dailyTimeRanges,
                        { start: "18:00", end: "20:00" },
                      ],
                    }));
                  }}
                  className="w-full"
                >
                  + Add Another Time Session
                </Button>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Credentials & Verification
              </h2>
              <p className="text-gray-600 mb-4">
                Please upload your medical license, ID, and other relevant documents
                to help us verify your profile.
              </p>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                  <Input
                    type="file"
                    id="credential-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isUploading}
                  />
                  <Label
                    htmlFor="credential-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    ) : (
                      <FileIcon className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {isUploading
                        ? "Uploading..."
                        : "Click to upload document (PDF, JPG, PNG)"}
                    </span>
                  </Label>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="link-label">Link Label (Optional)</Label>
                    <Input
                      id="link-label"
                      placeholder="e.g. LinkedIn Profile, Online Portfolio"
                      value={newCredentialLabel}
                      onChange={(e) => setNewCredentialLabel(e.target.value)}
                    />
                  </div>
                  <div className="flex-[2] space-y-2">
                    <Label htmlFor="link-url">Or add a link</Label>
                    <Input
                      id="link-url"
                      placeholder="https://"
                      value={newCredentialLink}
                      onChange={(e) => setNewCredentialLink(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddLink}
                    disabled={!newCredentialLink}
                  >
                    Add Link
                  </Button>
                </div>

                {credentials.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Attached Credentials
                    </h3>
                    <div className="space-y-2">
                      {credentials.map((cred, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {cred.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <FileIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            ) : (
                              <LinkIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">
                                {cred.label}
                              </span>
                              <a
                                href={cred.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate"
                              >
                                {cred.url}
                              </a>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCredential(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-between pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && formData.categories.length === 0}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Completing Setup..." : "Complete Profile"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorOnboardingForm;
