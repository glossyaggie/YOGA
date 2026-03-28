-- Add new columns to bookings table to support class + date booking
-- Run this in your Supabase SQL editor

-- Add columns if they don't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS class_id bigint REFERENCES classes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS booking_date date,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_by_user boolean default false,
ADD COLUMN IF NOT EXISTS credit_refunded boolean default false;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_class_date ON bookings(user_id, class_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Update the unique constraint to prevent double bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_session_id_key;
ALTER TABLE bookings ADD CONSTRAINT unique_user_class_date UNIQUE(user_id, class_id, booking_date);

-- Add policy for users to manage their own bookings
DROP POLICY IF EXISTS "users can insert own bookings" ON bookings;
CREATE POLICY "users can insert own bookings" ON bookings 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can update own bookings" ON bookings;
CREATE POLICY "users can update own bookings" ON bookings 
FOR UPDATE USING (auth.uid() = user_id);
