
-- Create a function to get all donations with user details
CREATE OR REPLACE FUNCTION public.get_all_donations_with_users()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT json_build_object(
    'id', d.id,
    'amount', d.amount,
    'donation_type', d.donation_type,
    'created_at', d.created_at,
    'payment_status', d.payment_status,
    'payment_processor', d.payment_processor,
    'transaction_id', d.transaction_id,
    'completed_at', d.completed_at,
    'user', json_build_object(
      'username', p.username,
      'email', p.email
    )
  )
  FROM user_donations d
  LEFT JOIN profiles p ON d.user_id = p.id
  ORDER BY d.created_at DESC;
END;
$$;

-- Create a function to update donation status
CREATE OR REPLACE FUNCTION public.update_donation_status(
  donation_id_param UUID,
  status_param TEXT,
  completed_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_donations
  SET payment_status = status_param,
      completed_at = completed_at_param
  WHERE id = donation_id_param;
END;
$$;
