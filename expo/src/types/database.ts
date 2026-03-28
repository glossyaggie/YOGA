export interface Pass {
  id: number;
  name: string;
  description?: string;
  credits: number;
  unlimited: boolean;
  validity_days?: number;
  stripe_price_id: string;
  is_active: boolean;
  price_cents?: number;
  currency?: string;
}

export interface Purchase {
  id: number;
  user_id: string;
  pass_id: number;
  stripe_payment_intent: string;
  purchased_at: string;
}

export interface CreditLedgerEntry {
  id: number;
  user_id: string;
  pass_id?: number;
  delta: number;
  reason: string;
  ref_id?: number;
  created_at: string;
}

export interface Booking {
  id: number;
  user_id: string;
  scheduled_class_id: number;
  booked_at: string;
  cancelled_at?: string;
  cancelled_by_user?: boolean;
  credit_refunded?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  waiver_accepted?: boolean;
  waiver_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  class_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Updated types to match the new database schema
export interface Class {
  id: number;
  class_name: string;
  description?: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  temperature_cel?: number;
  duration_minute: number;
  max_capacity: number;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: number;
  class_id: number;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class?: Class;
}

export interface ScheduledClass {
  id: number;
  class_id: number;
  session_id: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  instructor: string;
  max_capacity: number;
  current_bookings: number;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
  class?: Class;
  session?: ClassSession;
}

export interface CsvUpload {
  id: number;
  filename: string;
  uploaded_by: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_classes: number;
  processed_classes: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
