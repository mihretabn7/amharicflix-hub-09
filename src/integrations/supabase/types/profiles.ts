import { Json } from './json';

export interface ProfileTable {
  Row: {
    created_at: string
    email: string | null
    id: string
    phone_number: string
    subscription_plan: string | null
    updated_at: string
  }
  Insert: {
    created_at?: string
    email?: string | null
    id: string
    phone_number: string
    subscription_plan?: string | null
    updated_at?: string
  }
  Update: {
    created_at?: string
    email?: string | null
    id?: string
    phone_number?: string
    subscription_plan?: string | null
    updated_at?: string
  }
  Relationships: []
}