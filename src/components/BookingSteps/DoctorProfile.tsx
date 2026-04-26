import { Doctor } from "@/lib/types";
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Award, Heart, MapPin, Star } from "lucide-react";
import { Badge } from "../ui/badge";

interface DoctorPrfileInterface {
  doctor: Doctor;
}
const DoctorProfile = ({ doctor }: DoctorPrfileInterface) => {
  const averageRating = typeof doctor.averageRating === "number" ? doctor.averageRating : undefined;
  const totalReviews = typeof doctor.totalReviews === "number" ? doctor.totalReviews : 0;
  const displayRating = averageRating ?? 0;
  const roundedRating = Math.round(displayRating);
  const hasReviews = totalReviews > 0;

  return (
    <Card className="sticky top-24 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border-none rounded-[3.5rem] overflow-hidden bg-white ring-1 ring-gray-100">
      <CardContent className="p-0">
        <div className="relative h-40 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
          
          <div className="absolute -bottom-14 left-0 right-0 flex justify-center">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-[6px] border-white shadow-2xl rounded-[2.5rem] transition-transform duration-500 group-hover:scale-105">
                <AvatarImage
                  src={doctor?.profileImage}
                  alt={doctor?.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-black">
                  {doctor?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {doctor.isVerified && (
                <div className="absolute bottom-1 right-1 bg-green-500 border-4 border-white p-1.5 rounded-2xl shadow-xl">
                  <Award className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 pb-10 px-8 text-center">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
              {doctor.name}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="h-1 w-4 bg-blue-600 rounded-full" />
              <p className="text-blue-600 font-black text-xs uppercase tracking-widest">
                {doctor.specialization}
              </p>
              <span className="h-1 w-4 bg-blue-600 rounded-full" />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-lg font-black text-gray-900">
                  {hasReviews ? displayRating.toFixed(1) : "New"}
                </span>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rating</span>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-gray-900 mb-1">
                {doctor.experience}+
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Exp. Years</span>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-gray-900 mb-1">
                {totalReviews}
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reviews</span>
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-2.5 mb-10">
            {doctor.category.map((cat, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-blue-50/50 text-blue-700 border border-blue-100/50 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-blue-100"
              >
                {cat}
              </Badge>
            ))}
          </div>

          <div className="space-y-5 text-left">
            <div className="bg-[#F8FAFC] p-6 rounded-[2.5rem] border border-gray-100/50 group hover:bg-white hover:shadow-xl hover:shadow-blue-100/20 transition-all duration-300">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">About Doctor</h3>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 font-medium">{doctor.about}</p>
            </div>

            {doctor.hospitalInfo?.city && (
              <div className="bg-[#F8FAFC] p-6 rounded-[2.5rem] border border-gray-100/50 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-blue-100/20 transition-all duration-300">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Primary Location</h3>
                  <p className="text-base font-black text-gray-900">{doctor.hospitalInfo.city}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <MapPin className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
              </div>
            )}

            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] shadow-2xl shadow-blue-200 flex items-center justify-between text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1.5">
                  Base Consultation
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black">₦{doctor.fees?.toLocaleString()}</span>
                  <span className="text-xs font-bold opacity-70">/ session</span>
                </div>
              </div>
              <div className="relative z-10 w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-7 h-7 fill-white" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorProfile;
