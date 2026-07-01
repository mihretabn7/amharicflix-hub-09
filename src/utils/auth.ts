import { supabase } from "@/integrations/supabase/client";

export const checkIsAdmin = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile role for admin status:', profileError);
    }

    if (profileData && profileData.role === 'admin') {
      console.log(`checkIsAdmin: user ${userId} is admin via profiles.role`);
      return true;
    }

    // Fallback to admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (adminError) {
      console.error('Error checking admin status in admin_users:', adminError);
      return false;
    }

    return adminData !== null;
  } catch (err) {
    console.error('Unexpected error while checking admin status:', err);
    return false;
  }
};