export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'manager' | 'photographer' | 'assistant' | 'client'
export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'partial_paid' | 'paid' | 'refunded'
export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'damaged' | 'lost'
export type StudioStatus = 'available' | 'booked' | 'maintenance' | 'closed'
export type DamageSeverity = 'minor' | 'moderate' | 'severe' | 'total'
export type NotificationType = 'email' | 'sms' | 'in_app'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          company: string | null
          phone: string
          email: string | null
          address: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company?: string | null
          phone: string
          email?: string | null
          address?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string | null
          phone?: string
          email?: string | null
          address?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      studios: {
        Row: {
          id: string
          name: string
          description: string | null
          area_sqm: number | null
          hourly_rate: number
          daily_rate: number | null
          status: StudioStatus
          features: string[] | null
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          area_sqm?: number | null
          hourly_rate: number
          daily_rate?: number | null
          status?: StudioStatus
          features?: string[] | null
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          area_sqm?: number | null
          hourly_rate?: number
          daily_rate?: number | null
          status?: StudioStatus
          features?: string[] | null
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      equipment_categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      equipment: {
        Row: {
          id: string
          name: string
          sku: string | null
          category_id: string | null
          description: string | null
          hourly_rate: number
          daily_rate: number | null
          purchase_price: number | null
          purchase_date: string | null
          status: EquipmentStatus
          serial_number: string | null
          brand: string | null
          model: string | null
          images: string[] | null
          notes: string | null
          qr_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku?: string | null
          category_id?: string | null
          description?: string | null
          hourly_rate: number
          daily_rate?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          status?: EquipmentStatus
          serial_number?: string | null
          brand?: string | null
          model?: string | null
          images?: string[] | null
          notes?: string | null
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          category_id?: string | null
          description?: string | null
          hourly_rate?: number
          daily_rate?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          status?: EquipmentStatus
          serial_number?: string | null
          brand?: string | null
          model?: string | null
          images?: string[] | null
          notes?: string | null
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          duration_hours: number | null
          includes_studio: boolean
          studio_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          duration_hours?: number | null
          includes_studio?: boolean
          studio_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          duration_hours?: number | null
          includes_studio?: boolean
          studio_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      package_equipment: {
        Row: {
          id: string
          package_id: string
          equipment_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          equipment_id: string
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          equipment_id?: string
          quantity?: number
          created_at?: string
        }
      }
      assistants: {
        Row: {
          id: string
          profile_id: string | null
          name: string
          phone: string
          hourly_rate: number
          skills: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          name: string
          phone: string
          hourly_rate: number
          skills?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          name?: string
          phone?: string
          hourly_rate?: number
          skills?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          booking_no: string
          client_id: string
          studio_id: string | null
          package_id: string | null
          status: BookingStatus
          contract_status: ContractStatus
          payment_status: PaymentStatus
          start_time: string
          end_time: string
          total_amount: number
          deposit_amount: number
          paid_amount: number
          photographer_id: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_no?: string
          client_id: string
          studio_id?: string | null
          package_id?: string | null
          status?: BookingStatus
          contract_status?: ContractStatus
          payment_status?: PaymentStatus
          start_time: string
          end_time: string
          total_amount?: number
          deposit_amount?: number
          paid_amount?: number
          photographer_id?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_no?: string
          client_id?: string
          studio_id?: string | null
          package_id?: string | null
          status?: BookingStatus
          contract_status?: ContractStatus
          payment_status?: PaymentStatus
          start_time?: string
          end_time?: string
          total_amount?: number
          deposit_amount?: number
          paid_amount?: number
          photographer_id?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      booking_equipment: {
        Row: {
          id: string
          booking_id: string
          equipment_id: string
          quantity: number
          unit_price: number
          pickup_time: string | null
          return_time: string | null
          pickup_by: string | null
          return_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          equipment_id: string
          quantity?: number
          unit_price: number
          pickup_time?: string | null
          return_time?: string | null
          pickup_by?: string | null
          return_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          equipment_id?: string
          quantity?: number
          unit_price?: number
          pickup_time?: string | null
          return_time?: string | null
          pickup_by?: string | null
          return_by?: string | null
          created_at?: string
        }
      }
      booking_assistants: {
        Row: {
          id: string
          booking_id: string
          assistant_id: string
          hours: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          assistant_id: string
          hours: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          assistant_id?: string
          hours?: number
          unit_price?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          payment_method: string
          transaction_no: string | null
          is_deposit: boolean
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          payment_method: string
          transaction_no?: string | null
          is_deposit?: boolean
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          payment_method?: string
          transaction_no?: string | null
          is_deposit?: boolean
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      equipment_damages: {
        Row: {
          id: string
          equipment_id: string
          booking_id: string | null
          reporter_id: string
          responsible_party: string
          severity: DamageSeverity
          description: string
          repair_cost: number | null
          images: string[] | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          booking_id?: string | null
          reporter_id: string
          responsible_party: string
          severity: DamageSeverity
          description: string
          repair_cost?: number | null
          images?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          booking_id?: string | null
          reporter_id?: string
          responsible_party?: string
          severity?: DamageSeverity
          description?: string
          repair_cost?: number | null
          images?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: NotificationType
          recipient: string
          subject: string
          content: string
          status: NotificationStatus
          booking_id: string | null
          sent_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: NotificationType
          recipient: string
          subject: string
          content: string
          status?: NotificationStatus
          booking_id?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: NotificationType
          recipient?: string
          subject?: string
          content?: string
          status?: NotificationStatus
          booking_id?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      quotations: {
        Row: {
          id: string
          quotation_no: string
          client_id: string
          studio_id: string | null
          start_time: string | null
          end_time: string | null
          total_amount: number
          status: string
          valid_until: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quotation_no?: string
          client_id: string
          studio_id?: string | null
          start_time?: string | null
          end_time?: string | null
          total_amount?: number
          status?: string
          valid_until?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quotation_no?: string
          client_id?: string
          studio_id?: string | null
          start_time?: string | null
          end_time?: string | null
          total_amount?: number
          status?: string
          valid_until?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      quotation_equipment: {
        Row: {
          id: string
          quotation_id: string
          equipment_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          quotation_id: string
          equipment_id: string
          quantity?: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          quotation_id?: string
          equipment_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      booking_status: BookingStatus
      contract_status: ContractStatus
      payment_status: PaymentStatus
      equipment_status: EquipmentStatus
      studio_status: StudioStatus
      damage_severity: DamageSeverity
      notification_type: NotificationType
      notification_status: NotificationStatus
    }
  }
}
