// Define proper TypeScript interfaces
export interface TimeRange {
  start: string;
  end: string;
}

export interface AvailabilityRange {
  startDate: string;
  endDate: string;
  excludedWeekdays: number[];
}

export interface HospitalInfo {
  name: string;
  address: string;
  city: string;
}

export interface DoctorFormData {
  specialization: string;
  categories: string[]; // Explicitly typed as string array
  qualification: string;
  experience: string;
  about: string;
  fees: string;
  hospitalInfo: HospitalInfo;
  availabilityRange: AvailabilityRange;
  dailyTimeRanges: TimeRange[];
  slotDurationMinutes?: number;
}



// ✅ Enhanced User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  type: "doctor" | "patient";
  phone?: string;
  profileImage?: string;
  isVerified:boolean

  // Patient fields
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  age?: number;
  medicalHistory?: {
    allergies?: string;
    currentMedications?: string;
    chronicConditions?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };

  // Doctor fields
  specialization?: string;
  about?: string;
  category?: string[];
  qualification?: string;
  experience?: number;
  fees?: number;
  hospitalInfo?: {
    name?: string;
    address?: string;
    city?: string;
  };

  // ✅ Doctor availability fields
  availabilityRange?: {
    startDate?: string;
    endDate?: string;
    excludedWeekdays?: number[];
  };
  dailyTimeRanges?: Array<{
    start: string;
    end: string;
  }>;
  slotDurationMinutes?: number;
}

export interface ProfileUpdateInput {
  name?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  age?: number;
  medicalHistory?: User["medicalHistory"];
  emergencyContact?: User["emergencyContact"];
  specialization?: string;
  about?: string;
  category?: string[];
  qualification?: string;
  experience?: number | string;
  fees?: number | string;
  hospitalInfo?: User["hospitalInfo"];
  availabilityRange?: User["availabilityRange"];
  dailyTimeRanges?: User["dailyTimeRanges"];
  slotDurationMinutes?: number;
  profileImage?: string;
  isVerified?: boolean;
}


// interfaces/Doctor.ts
export interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  category: string[];
  qualification: string;
  experience: number;
  about: string;
  fees: number;
  hospitalInfo: {
    name: string;
    address: string;
    city: string;
  };
  availabilityRange?: {
    startDate: string;
    endDate: string;
    excludedWeekdays: number[];
  };
  dailyTimeRanges: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "12:00"
  }[];
  slotDurationMinutes: number;
  profileImage: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  averageRating?: number;
  totalReviews?: number;
  reviews?: {
    rating: number;
    comment?: string | null;
    createdAt: string;
    patientName?: string;
  }[];
}


export interface DoctorFilters {
  search?: string;
  specialization?: string;
  category?: string;
  city?: string;
  minFees?: number;
  maxFees?: number;
  sortBy?: 'fees' | 'experience' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeUnverified?: boolean;
}

export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded' | 'initiated';

export interface Payment {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: 'paystack';
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  status?: PaymentStatus | PaymentStatus[];
  from?: string;
  to?: string;
  search?: string;
  sortBy?: 'created_at' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}
