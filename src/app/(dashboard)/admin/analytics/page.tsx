import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";

interface RatingRow {
  doctor_id: string;
  patient_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

interface Person {
  id: string;
  name: string | null;
}

export default async function AdminAnalyticsPage() {
  const supabase = getServiceSupabase();

  const { data: ratingRows } = await supabase
    .from("doctor_ratings")
    .select("doctor_id,patient_id,rating,comment,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const ratings = (ratingRows || []) as RatingRow[];
  const doctorIds = Array.from(new Set(ratings.map((r) => r.doctor_id)));
  const patientIds = Array.from(
    new Set(
      ratings
        .map((r) => r.patient_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  );

  const [doctorProfilesResult, patientProfilesResult] = await Promise.all([
    doctorIds.length
      ? supabase.from("profiles").select("id,name").in("id", doctorIds)
      : Promise.resolve({ data: [] as Person[] } as any),
    patientIds.length
      ? supabase.from("profiles").select("id,name").in("id", patientIds)
      : Promise.resolve({ data: [] as Person[] } as any),
  ]);

  const doctors = (doctorProfilesResult.data || []) as Person[];
  const patients = (patientProfilesResult.data || []) as Person[];

  const doctorMap = new Map<string, string>();
  doctors.forEach((d) => doctorMap.set(d.id, d.name || "Doctor"));

  const patientMap = new Map<string, string>();
  patients.forEach((p) => patientMap.set(p.id, p.name || "Patient"));

  const totalRatings = ratings.length;
  const numericRatings = ratings
    .map((r) => r.rating)
    .filter((v): v is number => typeof v === "number");
  const averageRating =
    numericRatings.length > 0
      ? numericRatings.reduce((sum, v) => sum + v, 0) / numericRatings.length
      : 0;

  return (
    <div className="space-y-4">
      <AdminAutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Analytics & Reviews</h2>
        <p className="text-sm text-gray-600">
          Monitor doctor ratings and patient feedback across the MedicsOnline platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{totalRatings}</p>
            <p className="text-xs text-gray-500 mt-1">All time reviews submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">Across all doctors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monitored doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{doctorIds.length}</p>
            <p className="text-xs text-gray-500 mt-1">Doctors with at least one rating</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Recent reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews have been submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {ratings.map((r, index) => (
                <div key={`${r.doctor_id}-${r.created_at}-${index}`} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {doctorMap.get(r.doctor_id) || "Doctor"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-500">
                      Patient: {r.patient_id ? patientMap.get(r.patient_id) || "Patient" : "Anonymous"}
                    </div>
                    <div className="text-xs font-semibold text-yellow-600">
                      Rating: {typeof r.rating === "number" ? r.rating.toFixed(1) : "-"}/5
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-700 whitespace-pre-line">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
