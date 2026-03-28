-- Fix the unique constraint to allow re-booking after cancellation
-- Run this in your Supabase SQL editor

-- Drop the old constraint that prevents re-booking
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_user_class_date;

-- Create a new partial unique constraint that only applies to active bookings
-- This allows multiple cancelled bookings but only one active booking per user/class/date
CREATE UNIQUE INDEX unique_active_user_class_date 
ON bookings (user_id, class_id, booking_date) 
WHERE cancelled_at IS NULL;
