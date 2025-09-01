-- Add goal columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS monthly_goal INTEGER DEFAULT 20;

-- Add RLS policies for the new columns
ALTER POLICY "Users can view own profile" ON profiles 
USING (auth.uid() = id);

ALTER POLICY "Users can update own profile" ON profiles 
USING (auth.uid() = id);
