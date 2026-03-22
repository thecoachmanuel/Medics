import { consultationTypes } from "@/lib/constant";
import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Icon } from "lucide-react";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

interface ConsultationStepInterface {
  consultationType: string;
  setConsultationType: (type: string) => void;
  symptoms: string;
  setSymptoms: (symptoms: string) => void;
  doctorFees: number;
  onBack: () => void;
  onContinue: () => void;
  isLoading?: boolean;
  voiceDiscount?: { type: 'flat' | 'percentage', value: number } | null;
  messagingDiscount?: { type: 'flat' | 'percentage', value: number } | null;
}
const ConsultationStep = ({
  consultationType,
  setConsultationType,
  symptoms,
  setSymptoms,
  doctorFees,
  onBack,
  onContinue,
  isLoading = false,
  voiceDiscount,
  messagingDiscount,
}: ConsultationStepInterface) => {
  const getConsultationPrice = (selectedType = consultationType) => {
    const typePrice = consultationTypes.find((ct) => ct.type === selectedType)?.price || 0;
    const baseAmount = Math.max(0, doctorFees + typePrice);

    if (selectedType === "Voice Call" && voiceDiscount) {
      let discount = 0;
      if (voiceDiscount.type === 'flat') {
        discount = voiceDiscount.value;
      } else {
        discount = (baseAmount * voiceDiscount.value) / 100;
      }
      return Math.max(0, baseAmount - discount);
    }
    if (selectedType === "Messaging" && messagingDiscount) {
      let discount = 0;
      if (messagingDiscount.type === 'flat') {
        discount = messagingDiscount.value;
      } else {
        discount = (baseAmount * messagingDiscount.value) / 100;
      }
      return Math.max(0, baseAmount - discount);
    }
    return baseAmount;
  };

  const handleTypeChnage = (newType: string) => {
    setConsultationType(newType);
  };
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Consultation Details
        </h3>
        <div className="mb-8">
          <Label className="text-base font-semibold mb-4 block">
            Select Consultation Type
          </Label>
          <div className="space-y-3">
            {consultationTypes.map(
              ({ type, icon: Icon, description, price, recommended }) => {
                const currentPrice = getConsultationPrice(type);
                const isSelected = consultationType === type;
                return (
                  <div
                    key={type}
                    className={`relative border-2 rounded-[1.25rem] p-5 cursor-pointer transition-all flex items-center shadow-sm ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                        : "border-gray-100 hover:border-gray-300 hover:shadow-md bg-white"
                    }`}
                    onClick={() => handleTypeChnage(type)}
                  >
                    {recommended && (
                      <Badge className="absolute -top-2 left-4 bg-green-500">
                        Recommended
                      </Badge>
                    )}
                    <div className="flex items-center space-x-4 w-full">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-blue-600 text-white shadow-md" : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-gray-900 text-lg">{type}</h4>
                          <p className="font-bold text-gray-900 text-lg">
                            ₦{currentPrice.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">{description}</p>
                          <div className="text-right">
                            {type === 'Voice Call' || type === 'Messaging' ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Save ₦{Math.max(0, doctorFees - currentPrice).toLocaleString()}
                              </span>
                            ) : (
                              price !== 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                  Save ₦{Math.abs(price).toLocaleString()}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center justify-center">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                           {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-blue-900">
              Selected Consultation:
            </span>
            <span className="text-lg font-bold text-blue-900">
              {consultationType} - ₦{getConsultationPrice().toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <Label
            htmlFor="symptoms"
            className="text-base font-semibold mb-4 block"
          >
            Describe your symptoms or concerns (optional)
          </Label>
          <Textarea
            id="symptoms"
            placeholder="Please describe what brings you to see the doctor today..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={5}
            className="resize-none border-2 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} className="PX-8 PY-3" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={onContinue}
          disabled={isLoading}
          className="px-7 py-3 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Processing..." : "Continue to Payment"}
        </Button>
      </div>
    </div>
  );
};

export default ConsultationStep;
