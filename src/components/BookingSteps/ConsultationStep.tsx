import { consultationTypes } from "@/lib/constant";
import React from "react";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { ChevronRight, ArrowLeft, MessageSquare, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsultationStepProps {
  doctorId: string;
  consultationType: string;
  setConsultationType: (type: string) => void;
  symptoms: string;
  setSymptoms: (symptoms: string) => void;
  doctorFees: number;
  onBack: () => void;
  onContinue: () => Promise<boolean>;
  isLoading: boolean;
}

const ConsultationStep = ({
  consultationType,
  setConsultationType,
  symptoms,
  setSymptoms,
  doctorFees,
  onBack,
  onContinue,
  isLoading,
}: ConsultationStepProps) => {
  const getConsultationPrice = (selectedType = consultationType) => {
    const basePrice = doctorFees || 0;

    if (selectedType === "Voice Call") {
      const discount = Math.round((basePrice * 30) / 100);
      return Math.max(0, basePrice - discount);
    }

    if (selectedType === "Messaging") {
      const discount = Math.round((basePrice * 50) / 100);
      return Math.max(0, basePrice - discount);
    }

    return basePrice;
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">
              Consultation Details
            </h3>
            <p className="text-gray-500 text-sm font-medium">Customize your consultation experience</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 block">
              Select Consultation Type
            </Label>
            <div className="grid gap-4">
              {consultationTypes.map(
                ({ type, icon: Icon, description, recommended }) => {
                  const currentPrice = getConsultationPrice(type);
                  const isSelected = consultationType === type;
                  const discount = doctorFees - currentPrice;
                  
                  return (
                    <div
                      key={type}
                      className={cn(
                        "relative group border-2 rounded-[2rem] p-6 cursor-pointer transition-all duration-300 flex items-center gap-4",
                        isSelected
                          ? "border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-100/50"
                          : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-md"
                      )}
                      onClick={() => setConsultationType(type)}
                    >
                      {recommended && (
                        <div className="absolute -top-3 left-6">
                          <Badge className="bg-green-500 hover:bg-green-600 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-white shadow-sm">
                            Recommended
                          </Badge>
                        </div>
                      )}

                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                        isSelected ? "bg-blue-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                      )}>
                        <Icon className="w-8 h-8" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-gray-900 text-lg leading-tight">
                              {type === "Video Consultation" ? "Video Call" : type}
                            </h4>
                            <p className="text-sm text-gray-500 font-medium mt-0.5 line-clamp-1">
                              {description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-gray-900 text-xl">
                              ₦{currentPrice.toLocaleString()}
                            </p>
                            {discount > 0 && (
                              <Badge variant="outline" className="mt-1 bg-green-50 text-green-600 border-green-100 text-[10px] font-black">
                                SAVE ₦{discount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-2 flex items-center justify-center">
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                          isSelected ? "border-blue-600 bg-blue-600 shadow-inner" : "border-gray-200"
                        )}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="p-6 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-100 flex items-center justify-between text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                Selected Method
              </p>
              <h4 className="text-xl font-black">
                {consultationType === "Video Consultation" ? "Video Call" : consultationType}
              </h4>
            </div>
            <div className="relative z-10 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                Total Price
              </p>
              <p className="text-2xl font-black">₦{getConsultationPrice().toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="symptoms" className="text-sm font-black uppercase tracking-widest text-gray-400">
                Symptoms or Concerns
              </Label>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">Optional</span>
            </div>
            <div className="relative group">
              <Textarea
                id="symptoms"
                placeholder="Describe your symptoms or what you'd like to discuss with the doctor..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="resize-none border-2 border-gray-100 rounded-[1.5rem] p-5 focus:border-blue-500 focus:ring-0 transition-all bg-gray-50/50 group-hover:bg-white group-hover:shadow-inner"
              />
              <div className="absolute bottom-4 right-4 text-gray-300 pointer-events-none">
                <Info className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-100 gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="h-14 px-8 rounded-2xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Button>
        <Button
          onClick={onContinue}
          disabled={isLoading}
          className="h-14 flex-1 max-w-[280px] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Proceed to Payment</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConsultationStep;

