
-- Create a stored procedure for inserting user feedback
CREATE OR REPLACE FUNCTION public.insert_user_feedback(
  user_id_param UUID,
  feedback_text_param TEXT,
  status_param TEXT DEFAULT 'pending'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_feedback (user_id, feedback_text, status)
  VALUES (user_id_param, feedback_text_param, status_param);
END;
$$;

-- Create a stored procedure for inserting user donations
CREATE OR REPLACE FUNCTION public.insert_user_donation(
  user_id_param UUID,
  amount_param DECIMAL,
  donation_type_param TEXT,
  payment_status_param TEXT DEFAULT 'pending',
  payment_processor_param TEXT DEFAULT NULL,
  transaction_id_param TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_donations (
    user_id, 
    amount, 
    donation_type, 
    payment_status, 
    payment_processor, 
    transaction_id
  )
  VALUES (
    user_id_param, 
    amount_param, 
    donation_type_param, 
    payment_status_param, 
    payment_processor_param, 
    transaction_id_param
  );
END;
$$;
