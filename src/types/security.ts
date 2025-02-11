
export interface SecuritySettings {
  id: number;
  max_login_attempts: number;
  require_phone_verification: boolean;
  auto_block_suspicious_ips: boolean;
  content_report_threshold: number;
  updated_at: string;
}
