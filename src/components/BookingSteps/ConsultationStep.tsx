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
}: ConsultationStepInterface) => {
  const getConsultationPrice = (selectedType = consultationType) => {
    const typePrice =
      consultationTypes.find((ct) => ct.type === selectedType)?.price || 0;
    return Math.max(0, doctorFees + typePrice);
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
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleTypeChnage(type)}
                  >
                    {recommended && (
                      <Badge className="absolute -top-2 left-4 bg-green-500">
                        Recommended
                      </Badge>
                    )}
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            isSelected ? "text-blue-600" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{type}</h4>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₦{currentPrice.toLocaleString()}
                        </p>
                        {type === 'Voice Call' ? (
                          <p className="text-sm text-green-600">
                            Save ₦{Math.max(0, doctorFees - currentPrice).toLocaleString()}
                          </p>
                        ) : (
                          price !== 0 && (
                            <p className="text-sm text-green-600">
                              Save ₦{Math.abs(price).toLocaleString()}
                            </p>
                          )
                        )}
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
