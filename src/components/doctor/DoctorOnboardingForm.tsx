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
import { Loader2, Trash2, Link as LinkIcon, FileText } from "lucide-react";

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

  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>(defaultSpecializations);
  const [availableCategories, setAvailableCategories] = useState<string[]>(healthcareCategoriesList);
  
  // Credentials state
  const [credentialLink, setCredentialLink] = useState("");
  const [credentialLabel, setCredentialLabel] = useState("");
  const [uploadingCredential, setUploadingCredential] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<{ id: string; url: string; label: string | null }[]>([]);

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
    } else {
      // Load existing credentials
      loadCredentials(user.id);
    }
  }, [user, router]);

  const loadCredentials = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("doctor_credentials")
        .select("id, url, label")
        .eq("doctor_id", userId)
        .order("created_at", { ascending: false });
      if (data) setSavedCredentials(data);
    } catch (error) {
      console.error("Failed to load credentials", error);
    }
  };

  const handleCredentialFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setUploadingCredential(true);
      const { url } = await uploadImage(file, "medimeet/credentials");
      
      const label = credentialLabel || file.name;
      const { data, error } = await supabase
        .from("doctor_credentials")
        .insert({ doctor_id: user.id, url, label })
        .select("id, url, label")
        .single();
        
      if (error) throw error;
      if (data) {
        setSavedCredentials((prev) => [data, ...prev]);
        setCredentialLabel("");
        e.target.value = ""; 
      }
    } catch (error) {
      console.error("Failed to upload credential", error);
      alert("Failed to upload credential. Please try again.");
    } finally {
      setUploadingCredential(false);
    }
  };

  const handleAddLink = async () => {
    if (!credentialLink || !user?.id) return;
    
    try {
      setUploadingCredential(true);
      const label = credentialLabel || "External Link";
      const { data, error } = await supabase
        .from("doctor_credentials")
        .insert({ doctor_id: user.id, url: credentialLink, label })
        .select("id, url, label")
        .single();
        
      if (error) throw error;
      if (data) {
        setSavedCredentials((prev) => [data, ...prev]);
        setCredentialLink("");
        setCredentialLabel("");
      }
    } catch (error) {
      console.error("Failed to add link", error);
    } finally {
      setUploadingCredential(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    try {
      const { error } = await supabase
        .from("doctor_credentials")
        .delete()
        .eq("id", id);
        
      if (!error) {
        setSavedCredentials((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete credential", error);
    }
  };


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

  const handleSubmit = async (): Promise<void> => {
    try {
      if (formData.categories.length === 0) {
        return;
      }
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
      router.push("/doctor/dashboard");
    } catch (error) {
      console.error("Profile update failed", error);
    }
  };
  const handleNext = (): void => {
    if (currentStep < 3) {
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

              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-900">Credentials & Documents</h3>
                <p className="text-sm text-gray-500">
                  Upload your medical license, ID, or other credentials to help us verify your profile. 
                  (PDF, JPG, PNG supported)
                </p>

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credLabel">Document Label (Optional)</Label>
                      <Input
                        id="credLabel"
                        placeholder="e.g. Medical License 2024"
                        value={credentialLabel}
                        onChange={(e) => setCredentialLabel(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Upload File</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleCredentialFileUpload}
                            disabled={uploadingCredential}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Or Add Link</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://..."
                            value={credentialLink}
                            onChange={(e) => setCredentialLink(e.target.value)}
                            disabled={uploadingCredential}
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={handleAddLink}
                            disabled={!credentialLink || uploadingCredential}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadingCredential && (
                    <div className="flex items-center text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading credential...
                    </div>
                  )}

                  {savedCredentials.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label>Uploaded Credentials</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {savedCredentials.map((cred) => (
                          <div key={cred.id} className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {cred.url.endsWith('.pdf') ? (
                                <FileText className="w-5 h-5 text-red-500 shrink-0" />
                              ) : (
                                <LinkIcon className="w-5 h-5 text-blue-500 shrink-0" />
                              )}
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">{cred.label || 'Document'}</span>
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
                              onClick={() => handleDeleteCredential(cred.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
          <div className="flex justify-between pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 3 ? (
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
