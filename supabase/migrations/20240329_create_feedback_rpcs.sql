
-- Create a function to get all feedback with user details
CREATE OR REPLACE FUNCTION public.get_all_feedback_with_users()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT json_build_object(
    'id', f.id,
    'feedback_text', f.feedback_text,
    'created_at', f.created_at,
    'status', f.status,
    'admin_response', f.admin_response,
    'user', json_build_object(
      'username', p.username,
      'email', p.email
    )
  )
  FROM user_feedback f
  LEFT JOIN profiles p ON f.user_id = p.id
  ORDER BY f.created_at DESC;
END;
$$;

-- Create a function to update feedback with admin response
CREATE OR REPLACE FUNCTION public.update_feedback_response(
  feedback_id_param UUID,
  admin_response_param TEXT,
  status_param TEXT DEFAULT 'resolved'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_feedback
  SET admin_response = admin_response_param,
      status = status_param
  WHERE id = feedback_id_param;
END;
$$;
