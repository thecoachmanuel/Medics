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
    <Card className="sticky top-8 shadow-lg border-0">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <Avatar className="w-32 h-32 mx-auto right-4 rign-blue-100">
            <AvatarImage
              src={doctor?.profileImage}
              alt={doctor?.name}
            ></AvatarImage>
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600  text-white text-2xl font-bold ">
              {doctor?.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {doctor.name}
          </h2>
          <p className="text-gray-600 mb-1">{doctor.specialization}</p>
          <p className="text-sm text-gray-500 mb-2">{doctor.qualification}</p>
          <p className="text-sm text-gray-500 mb-4">
            {doctor.experience} years experience
          </p>

          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= roundedRating;
                  return (
                    <Star
                      key={star}
                      className={
                        filled
                          ? "w-4 h-4 fill-orange-400 text-orange-400"
                          : "w-4 h-4 text-gray-300"
                      }
                    />
                  );
                })}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {hasReviews ? displayRating.toFixed(1) : "New"}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {hasReviews ? `${totalReviews} review${totalReviews === 1 ? "" : "s"}` : "No reviews yet"}
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-2 mb-6">
            {doctor.isVerified && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <Award className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}

            {doctor.category.map((cat, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-blue-100 text-blue-800"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-sm text-gray-600">{doctor.about}</p>
          </div>

          {doctor.hospitalInfo && (
            <div className="bf-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Hospital/Clinic
              </h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{doctor.hospitalInfo.name}</p>
                <p>{doctor.hospitalInfo.address}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{doctor.hospitalInfo.city}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div>
              <p className="text-sm text-green-700 font-medium">
                Consultation Fee
              </p>
              <p className="text-2xl text-green-800 font-bold">
                ₦{doctor.fees}
              </p>
              <p className="text-xs text-green-600 ">
                {doctor.slotDurationMinutes} minutes session
              </p>
            </div>
            <div className="text-green-600">
                <Heart className="w-8 h-8"/>
            </div>
          </div>

          {doctor.reviews && doctor.reviews.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Reviews</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {doctor.reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {review.patientName || "Patient"}
                      </span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const filled = star <= Math.round(review.rating);
                          return (
                            <Star
                              key={star}
                              className={
                                filled
                                  ? "w-3 h-3 fill-yellow-400 text-yellow-400"
                                  : "w-3 h-3 text-gray-300"
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-gray-600 mt-1">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorProfile;
