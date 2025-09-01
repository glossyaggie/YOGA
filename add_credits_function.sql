-- Function to add credits to any user (admin function)
CREATE OR REPLACE FUNCTION add_credits_to_user(
  target_user_id UUID,
  credits_to_add INTEGER,
  reason_text TEXT DEFAULT 'admin_credit_addition'
)
RETURNS VOID AS $$
BEGIN
  -- Insert credits into the user's ledger
  INSERT INTO credit_ledger (user_id, delta, reason, pass_id)
  VALUES (target_user_id, credits_to_add, reason_text, NULL);
  
  -- Log the action
  RAISE NOTICE 'Added % credits to user %', credits_to_add, target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (you can restrict this later)
GRANT EXECUTE ON FUNCTION add_credits_to_user(UUID, INTEGER, TEXT) TO authenticated;
