-- Populate passes table with the available pass types
INSERT INTO passes (name, description, credits, unlimited, validity_days, stripe_price_id, is_active) VALUES
('Single Class Pass', 'One class credit', 1, false, null, 'price_1S0r9bARpqh0Ut1y4lHGGuAT', true),
('5 Class Pass', 'Five class credits', 5, false, null, 'price_1S0vfBARpqh0Ut1ybKjeqehJ', true),
('10 Class Pass', 'Ten class credits', 10, false, null, 'price_1S0rHLARpqh0Ut1ybWGa3ocf', true),
('25 Class Pass', 'Twenty-five class credits', 25, false, null, 'price_1S0rHqARpqh0Ut1ygGGaoqac', true),
('Weekly Unlimited', 'Unlimited classes for one week', 0, true, 7, 'price_1S0rIRARpqh0Ut1yQkmz18xc', true),
('Monthly Unlimited', 'Unlimited classes for one month', 0, true, 30, 'price_1S0rJlARpqh0Ut1yaeBEQVRf', true),
('VIP Monthly', 'VIP unlimited classes for one month', 0, true, 30, 'price_1S0rKbARpqh0Ut1ydYwnH2Zy', true),
('VIP Yearly', 'VIP unlimited classes for one year', 0, true, 365, 'price_1S0rLOARpqh0Ut1y2lbJ17g7', true);

-- Add missing fields to bookings table for better tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by_user boolean default false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS credit_refunded boolean default false;

-- Add missing fields to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_active boolean default true;

-- Add missing fields to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS temperature_celsius int;

-- Create a view for user's current credit balance
CREATE OR REPLACE VIEW user_credit_balance AS
SELECT 
  user_id,
  SUM(delta) as total_credits
FROM credit_ledger
GROUP BY user_id;

-- Create a function to get user's available credits
CREATE OR REPLACE FUNCTION get_user_credits(user_uuid uuid)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(delta), 0) 
  FROM credit_ledger 
  WHERE user_id = user_uuid;
$$;

-- Create a function to add credits to user
CREATE OR REPLACE FUNCTION add_user_credits(
  user_uuid uuid,
  pass_id bigint,
  credits int,
  reason text,
  ref_id bigint DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO credit_ledger (user_id, pass_id, delta, reason, ref_id)
  VALUES (user_uuid, pass_id, credits, reason, ref_id);
END;
$$;

-- Create a function to use credits for booking
CREATE OR REPLACE FUNCTION use_booking_credit(
  user_uuid uuid,
  session_id bigint,
  booking_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits int;
BEGIN
  -- Get current credits
  SELECT get_user_credits(user_uuid) INTO current_credits;
  
  -- Check if user has enough credits
  IF current_credits < 1 THEN
    RETURN false;
  END IF;
  
  -- Deduct one credit
  INSERT INTO credit_ledger (user_id, pass_id, delta, reason, ref_id)
  VALUES (user_uuid, null, -1, 'Class booking', booking_id);
  
  RETURN true;
END;
$$;

-- Create a function to refund credits for cancellation
CREATE OR REPLACE FUNCTION refund_booking_credit(
  user_uuid uuid,
  booking_id bigint,
  session_starts_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hours_until_class int;
BEGIN
  -- Calculate hours until class starts
  hours_until_class := EXTRACT(EPOCH FROM (session_starts_at - now())) / 3600;
  
  -- Only refund if more than 1 hour before class
  IF hours_until_class > 1 THEN
    INSERT INTO credit_ledger (user_id, pass_id, delta, reason, ref_id)
    VALUES (user_uuid, null, 1, 'Class cancellation refund', booking_id);
    
    -- Mark booking as cancelled and credit refunded
    UPDATE bookings 
    SET cancelled_at = now(), 
        cancelled_by_user = true,
        credit_refunded = true
    WHERE id = booking_id AND user_id = user_uuid;
    
    RETURN true;
  ELSE
    -- Mark booking as cancelled but no credit refund
    UPDATE bookings 
    SET cancelled_at = now(), 
        cancelled_by_user = true,
        credit_refunded = false
    WHERE id = booking_id AND user_id = user_uuid;
    
    RETURN false;
  END IF;
END;
$$;
