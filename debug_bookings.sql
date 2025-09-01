-- Debug query to check user bookings
-- Run this in Supabase SQL editor to see what bookings exist

-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users table
SELECT 
  id,
  user_id,
  class_id,
  session_id,
  booking_date,
  cancelled_at,
  cancelled_by_user,
  credit_refunded,
  created_at
FROM bookings 
WHERE user_id = 'YOUR_USER_ID'  -- Replace with your actual user ID
ORDER BY created_at DESC;

-- To find your user ID, run this first:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
