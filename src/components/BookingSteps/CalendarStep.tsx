import { convertTo24Hour, parseLocalDate, startOfDay, toLocalYMD } from "@/lib/dateUtils";
import React, { useMemo, useState } from "react";
import { Label } from "../ui/label";
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { CalendarIcon, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedSlot: string;
  setSelectedSlot: (slot: string) => void;
  availableSlots: string[];
  availableDates: string[];
  excludedWeekdays: number[];
  onContinue: () => void;
  bookedSlots: string[];
}

const CalendarStep = ({
  selectedDate,
  selectedSlot,
  setSelectedDate,
  setSelectedSlot,
  availableDates,
  availableSlots,
  onContinue,
  bookedSlots,
  excludedWeekdays,
}: CalendarStepProps) => {
  const [showMoreSlots, setShowMoreSlots] = useState(false);
  const displaySlots = showMoreSlots
    ? availableSlots
    : availableSlots.slice(0, 10);

  const dateRange = useMemo(() => {
    if (availableDates.length === 0) return { from: undefined, to: undefined } as const;
    const fromParsed = parseLocalDate(availableDates[0]);
    const toParsed = parseLocalDate(availableDates[availableDates.length - 1]);
    return {
      from: fromParsed ? startOfDay(fromParsed) : undefined,
      to: toParsed ? startOfDay(toParsed) : undefined,
    } as const;
  }, [availableDates]);

  const isSlotBooked = (slot: string): boolean => {
    if (!selectedDate) return false;
    const dateString = toLocalYMD(selectedDate);
    const slotDateTime = new Date(`${dateString}T${convertTo24Hour(slot)}`);

    return bookedSlots.some((bookedSlot) => {
      const bookedDateTime = new Date(bookedSlot);
      return bookedDateTime.getTime() === slotDateTime.getTime();
    });
  };

  const isSlotInPast = (slot: string): boolean => {
    if (!selectedDate) return false;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    if (selectedDay.getTime() === today.getTime()) {
      const [time, modifier] = slot.split(" ");
      let [hour, minutes] = time.split(":");

      if (hour === "12") {
        hour = "00";
      }

      if (modifier === "PM") {
        hour = String(parseInt(hour, 10) + 12);
      }

      const slotDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        parseInt(hour, 10),
        parseInt(minutes, 10),
        0
      );

      const bufferedCurrentTime = new Date(now.getTime() + 5 * 60 * 1000);
      return slotDateTime.getTime() <= bufferedCurrentTime.getTime();
    }
    return false;
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const checkedDate = startOfDay(date);

    if (checkedDate < today) return true;

    const jsWeekday = date.getDay();
    if (excludedWeekdays.includes(jsWeekday)) return true;

    return false;
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">
              Select Date & Time
            </h3>
            <p className="text-gray-500 text-sm font-medium">Choose a convenient slot for your consultation</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <Label className="text-sm font-black uppercase tracking-widest text-gray-400">Choose Date</Label>
            <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 shadow-inner">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedSlot("");
                  setShowMoreSlots(false);
                }}
                disabled={isDateDisabled}
                className="mx-auto"
                classNames={{
                  day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl shadow-lg shadow-blue-200",
                  day_today: "bg-blue-50 text-blue-600 font-black rounded-xl",
                  day: "h-10 w-10 text-center text-sm p-0 font-bold aria-selected:opacity-100 hover:bg-gray-100 rounded-xl transition-all",
                  day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
                  head_cell: "text-gray-400 font-black uppercase text-[10px] tracking-widest w-10",
                  nav_button: "border-none hover:bg-gray-100 rounded-xl transition-all",
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center justify-between">
              Available Slots
              {availableSlots.length > 0 && (
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {availableSlots.length} AVAILABLE
                </span>
              )}
            </Label>

            <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 min-h-[340px] flex flex-col shadow-inner">
              {selectedDate ? (
                availableSlots.length > 0 ? (
                  <div className="space-y-6 flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                      {displaySlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        const isBooked = isSlotBooked(slot);
                        const isPast = isSlotInPast(slot);
                        const isDisabled = isBooked || isPast;

                        return (
                          <Button
                            key={slot}
                            variant={isSelected ? "default" : "outline"}
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setSelectedSlot(slot)}
                            className={cn(
                              "h-12 rounded-xl font-bold transition-all duration-300",
                              isDisabled
                                ? "bg-gray-100/50 text-gray-300 border-gray-100 opacity-60"
                                : isSelected
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 scale-105"
                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 shadow-sm"
                            )}
                          >
                            <span className="text-sm">{slot}</span>
                            {isPast && <span className="text-[8px] ml-1 opacity-60">(Past)</span>}
                            {isBooked && !isPast && <span className="text-[8px] ml-1 opacity-60">(Booked)</span>}
                          </Button>
                        );
                      })}
                    </div>
                    {availableSlots.length > 10 && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowMoreSlots(!showMoreSlots)}
                        className="w-full text-blue-600 font-bold hover:bg-blue-50 rounded-xl"
                      >
                        {showMoreSlots ? "Show Less" : `+ ${availableSlots.length - 10} more slots`}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">No slots available</h4>
                    <p className="text-sm text-gray-500 font-medium">Please select a different date</p>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-1">Pick a Date</h4>
                  <p className="text-sm text-gray-500 font-medium">Select a date to view available time slots</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-100">
        <Button
          onClick={onContinue}
          disabled={!selectedDate || !selectedSlot}
          className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 group"
        >
          <span>Continue</span>
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default CalendarStep;

