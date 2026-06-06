export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'customer' | 'staff' | 'admin'
          full_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'customer' | 'staff' | 'admin'
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'customer' | 'staff' | 'admin'
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      studios: {
        Row: {
          id: string
          name: string
          description: string | null
          hourly_rate: number
          max_capacity: number | null
          equipment_included: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          hourly_rate: number
          max_capacity?: number | null
          equipment_included?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          hourly_rate?: number
          max_capacity?: number | null
          equipment_included?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      equipment: {
        Row: {
          id: string
          name: string
          category: 'camera' | 'lighting' | 'accessory' | 'other'
          description: string | null
          rental_price: number
          purchase_price: number | null
          deposit_amount: number
          status: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'lost'
          serial_number: string | null
          brand: string | null
          model: string | null
          purchase_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'camera' | 'lighting' | 'accessory' | 'other'
          description?: string | null
          rental_price: number
          purchase_price?: number | null
          deposit_amount: number
          status?: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'lost'
          serial_number?: string | null
          brand?: string | null
          model?: string | null
          purchase_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'camera' | 'lighting' | 'accessory' | 'other'
          description?: string | null
          rental_price?: number
          purchase_price?: number | null
          deposit_amount?: number
          status?: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'lost'
          serial_number?: string | null
          brand?: string | null
          model?: string | null
          purchase_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          description: string | null
          base_price: number
          studio_hours: number
          equipment_included: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          base_price: number
          studio_hours: number
          equipment_included?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          base_price?: number
          studio_hours?: number
          equipment_included?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          package_id: string | null
          studio_id: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          start_time: string
          end_time: string
          total_amount: number
          deposit_amount: number
          payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
          notes: string | null
          confirmed_by: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          package_id?: string | null
          studio_id: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          start_time: string
          end_time: string
          total_amount: number
          deposit_amount: number
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded'
          notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          package_id?: string | null
          studio_id?: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          start_time?: string
          end_time?: string
          total_amount?: number
          deposit_amount?: number
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded'
          notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_equipment: {
        Row: {
          id: string
          order_id: string
          equipment_id: string
          quantity: number
          rental_price: number
          deposit_amount: number
          is_extra: boolean
          picked_up: boolean
          picked_up_by: string | null
          picked_up_at: string | null
          returned: boolean
          returned_by: string | null
          returned_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          equipment_id: string
          quantity?: number
          rental_price: number
          deposit_amount: number
          is_extra?: boolean
          picked_up?: boolean
          picked_up_by?: string | null
          picked_up_at?: string | null
          returned?: boolean
          returned_by?: string | null
          returned_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          equipment_id?: string
          quantity?: number
          rental_price?: number
          deposit_amount?: number
          is_extra?: boolean
          picked_up?: boolean
          picked_up_by?: string | null
          picked_up_at?: string | null
          returned?: boolean
          returned_by?: string | null
          returned_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deposit_transactions: {
        Row: {
          id: string
          order_id: string
          type: 'charge' | 'refund' | 'adjustment'
          amount: number
          payment_method: string | null
          transaction_ref: string | null
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          type: 'charge' | 'refund' | 'adjustment'
          amount: number
          payment_method?: string | null
          transaction_ref?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          type?: 'charge' | 'refund' | 'adjustment'
          amount?: number
          payment_method?: string | null
          transaction_ref?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      damage_records: {
        Row: {
          id: string
          order_id: string
          equipment_id: string
          description: string
          severity: 'minor' | 'moderate' | 'severe' | 'total'
          repair_cost: number | null
          responsible_party_id: string
          reported_by: string
          reported_at: string
          resolved: boolean
          resolved_by: string | null
          resolved_at: string | null
          resolution_notes: string | null
          photos: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          equipment_id: string
          description: string
          severity: 'minor' | 'moderate' | 'severe' | 'total'
          repair_cost?: number | null
          responsible_party_id: string
          reported_by: string
          reported_at?: string
          resolved?: boolean
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          photos?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          equipment_id?: string
          description?: string
          severity?: 'minor' | 'moderate' | 'severe' | 'total'
          repair_cost?: number | null
          responsible_party_id?: string
          reported_by?: string
          reported_at?: string
          resolved?: boolean
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          photos?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          order_id: string
          file_name: string
          file_path: string
          file_size: number
          uploaded_by: string
          signed: boolean
          signed_by: string | null
          signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          file_name: string
          file_path: string
          file_size: number
          uploaded_by: string
          signed?: boolean
          signed_by?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          uploaded_by?: string
          signed?: boolean
          signed_by?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'order_status' | 'equipment_return' | 'damage_report' | 'payment' | 'system'
          title: string
          content: string
          related_order_id: string | null
          read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'order_status' | 'equipment_return' | 'damage_report' | 'payment' | 'system'
          title: string
          content: string
          related_order_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'order_status' | 'equipment_return' | 'damage_report' | 'payment' | 'system'
          title?: string
          content?: string
          related_order_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      notification_queue: {
        Row: {
          id: string
          notification_id: string | null
          channel: 'email' | 'sms' | 'push'
          recipient: string
          subject: string
          content: string
          status: 'pending' | 'sending' | 'sent' | 'failed'
          retry_count: number
          max_retries: number
          last_error: string | null
          last_attempt_at: string | null
          scheduled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          notification_id?: string | null
          channel: 'email' | 'sms' | 'push'
          recipient: string
          subject: string
          content: string
          status?: 'pending' | 'sending' | 'sent' | 'failed'
          retry_count?: number
          max_retries?: number
          last_error?: string | null
          last_attempt_at?: string | null
          scheduled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          notification_id?: string | null
          channel?: 'email' | 'sms' | 'push'
          recipient?: string
          subject?: string
          content?: string
          status?: 'pending' | 'sending' | 'sent' | 'failed'
          retry_count?: number
          max_retries?: number
          last_error?: string | null
          last_attempt_at?: string | null
          scheduled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
