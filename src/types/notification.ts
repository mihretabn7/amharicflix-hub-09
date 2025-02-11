
export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  is_sent: boolean;
  type: string;
  user_id: string | null;
}
