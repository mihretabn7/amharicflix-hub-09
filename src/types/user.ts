
export interface User {
  id: string;
  email: string | null;
  phone_number: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_blocked: boolean;
  avatar_url?: string;
  username?: string;
  bio?: string;
  subscription_plan?: string;
  updated_at: string;
}
