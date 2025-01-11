import { supabase } from "@/integrations/supabase/client";

export const checkIsAdmin = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .single();
    
  return !error && data !== null;
};