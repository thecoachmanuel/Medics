"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

type StatSummary = {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  totalCommission: number;
  totalPlatformFees: number;
  totalEarnings: number;
};

type MonthlyRevenuePoint = {
  month: string;
  revenue: number;
};

type StatusSlice = {
  status: string;
  value: number;
};

type UserGrowthPoint = {
  month: string;
  patients: number;
  doctors: number;
};

interface AdminDashboardContentProps {
  stats: StatSummary;
  monthlyRevenue: MonthlyRevenuePoint[];
  appointmentStatus: StatusSlice[];
  userGrowth: UserGrowthPoint[];
}

const statusColors: Record<string, string> = {
  Scheduled: "#2563eb",
  Completed: "#22c55e",
  Cancelled: "#f97316",
  "In Progress": "#a855f7",
  Missed: "#f97316",
  Expired: "#6b7280",
};

const AdminDashboardContent = ({ stats, monthlyRevenue, appointmentStatus, userGrowth }: AdminDashboardContentProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            <p className="text-xs text-gray-500 mt-1">Registered patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
            <p className="text-xs text-gray-500 mt-1">Registered doctors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
            <p className="text-xs text-gray-500 mt-1">All time booked consultations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">₦{stats.totalRevenue.toLocaleString("en-NG")}</p>
            <p className="text-xs text-gray-500 mt-1">Total transaction volume</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Commission Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₦{stats.totalCommission.toLocaleString("en-NG")}</p>
            <p className="text-xs text-gray-500 mt-1">From doctor earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Platform Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">₦{stats.totalPlatformFees.toLocaleString("en-NG")}</p>
            <p className="text-xs text-gray-500 mt-1">From patient bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-600">₦{stats.totalEarnings.toLocaleString("en-NG")}</p>
            <p className="text-xs text-gray-500 mt-1">Commission + Platform Fees</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Appointment Status</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={appointmentStatus} dataKey="value" nameKey="status" outerRadius={90} label>
                  {appointmentStatus.map((entry, index) => {
                    const color = statusColors[entry.status] || ["#2563eb", "#22c55e", "#f97316", "#a855f7"][index % 4];
                    return <Cell key={entry.status} fill={color} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">User Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowth} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="patients" stackId="users" fill="#6366f1" />
                <Bar dataKey="doctors" stackId="users" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Quick Insight</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-3 text-sm text-gray-700">
            <p>
              Active doctors and patients are tracked in real time from Supabase, giving you a clear
              view of how MedicsOnline is being used.
            </p>
            <p>
              Use this dashboard to monitor growth, track appointment completion rates, and make
              decisions about onboarding, payouts, and engagement campaigns.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardContent;
