-- Fix credit_ledger table RLS policies
-- Run this in your Supabase SQL editor

-- Add policy for users to insert their own credit ledger entries
DROP POLICY IF EXISTS "users can insert own credit ledger" ON credit_ledger;
CREATE POLICY "users can insert own credit ledger" ON credit_ledger 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add policy for users to update their own credit ledger entries
DROP POLICY IF EXISTS "users can update own credit ledger" ON credit_ledger;
CREATE POLICY "users can update own credit ledger" ON credit_ledger 
FOR UPDATE USING (auth.uid() = user_id);

-- Add policy for users to read their own credit ledger entries (if not already exists)
DROP POLICY IF EXISTS "users can read own credit ledger" ON credit_ledger;
CREATE POLICY "users can read own credit ledger" ON credit_ledger 
FOR SELECT USING (auth.uid() = user_id);
