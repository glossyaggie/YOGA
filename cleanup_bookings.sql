-- Cleanup script for booking issues
-- Run this in Supabase SQL editor if you're having booking conflicts

-- 1. Check for any duplicate active bookings for the same class/date
SELECT 
  user_id,
  class_id, 
  booking_date,
  COUNT(*) as booking_count
FROM bookings 
WHERE cancelled_at IS NULL 
  AND class_id IS NOT NULL 
  AND booking_date IS NOT NULL
GROUP BY user_id, class_id, booking_date 
HAVING COUNT(*) > 1;

-- 2. If you find duplicates, you can manually cancel the extra ones
-- Replace the IDs with actual booking IDs from the query above
-- UPDATE bookings 
-- SET cancelled_at = NOW(), cancelled_by_user = true 
-- WHERE id IN (123, 456); -- Replace with actual duplicate booking IDs

-- 3. Check all your bookings to see their status
-- Replace 'YOUR_USER_ID' with your actual user ID
-- SELECT * FROM bookings WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;
