import { supabase } from "@/integrations/supabase/client";

export const checkIsAdmin = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  
  return data !== null;
};