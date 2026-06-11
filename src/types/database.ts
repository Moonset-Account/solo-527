export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string
          name: string
          address: string
          location: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          location: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          location?: any
          created_at?: string
          updated_at?: string
        }
      }
      riders: {
        Row: {
          id: string
          name: string
          phone: string
          status: string
          current_location: any
          current_order_id: string | null
          battery_level: number | null
          today_mileage: number | null
          today_working_hours: number | null
          rating: number
          total_deliveries: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          status?: string
          current_location?: any
          current_order_id?: string | null
          battery_level?: number | null
          today_mileage?: number | null
          today_working_hours?: number | null
          rating?: number
          total_deliveries?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          status?: string
          current_location?: any
          current_order_id?: string | null
          battery_level?: number | null
          today_mileage?: number | null
          today_working_hours?: number | null
          rating?: number
          total_deliveries?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_no: string
          status: string
          priority: string
          pickup_address: string
          delivery_address: string
          pickup_location: any
          delivery_location: any
          estimated_delivery_time: string
          actual_delivery_time: string | null
          rider_id: string | null
          rider_name: string | null
          goods_type: string
          recipient: string | null
          recipient_phone: string | null
          signature_name: string | null
          signature_phone: string | null
          signature_image_url: string | null
          signed_at: string | null
          temp_min: number | null
          temp_max: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_no: string
          status?: string
          priority?: string
          pickup_address: string
          delivery_address: string
          pickup_location: any
          delivery_location: any
          estimated_delivery_time: string
          actual_delivery_time?: string | null
          rider_id?: string | null
          rider_name?: string | null
          goods_type: string
          recipient?: string | null
          recipient_phone?: string | null
          signature_name?: string | null
          signature_phone?: string | null
          signature_image_url?: string | null
          signed_at?: string | null
          temp_min?: number | null
          temp_max?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_no?: string
          status?: string
          priority?: string
          pickup_address?: string
          delivery_address?: string
          pickup_location?: any
          delivery_location?: any
          estimated_delivery_time?: string
          actual_delivery_time?: string | null
          rider_id?: string | null
          rider_name?: string | null
          goods_type?: string
          recipient?: string | null
          recipient_phone?: string | null
          signature_name?: string | null
          signature_phone?: string | null
          signature_image_url?: string | null
          signed_at?: string | null
          temp_min?: number | null
          temp_max?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tracking_points: {
        Row: {
          id: string
          order_id: string
          rider_id: string
          location: any
          speed: number
          timestamp: string
        }
        Insert: {
          id?: string
          order_id: string
          rider_id: string
          location: any
          speed?: number
          timestamp?: string
        }
        Update: {
          id?: string
          order_id?: string
          rider_id?: string
          location?: any
          speed?: number
          timestamp?: string
        }
      }
      temperature_records: {
        Row: {
          id: string
          order_id: string
          temperature: number
          humidity: number | null
          is_normal: boolean
          timestamp: string
        }
        Insert: {
          id?: string
          order_id: string
          temperature: number
          humidity?: number | null
          is_normal?: boolean
          timestamp?: string
        }
        Update: {
          id?: string
          order_id?: string
          temperature?: number
          humidity?: number | null
          is_normal?: boolean
          timestamp?: string
        }
      }
      exceptions: {
        Row: {
          id: string
          order_id: string
          order_no: string
          type: string
          priority: string
          reason: string
          is_dispute: boolean
          dispute_reason: string | null
          dispute_evidence: string[] | null
          compensation_amount: number | null
          status: string
          assignee_id: string
          assignee_name: string
          processing_start_time: string
          processing_end_time: string | null
          processing_duration: number | null
          processing_notes: Json | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          order_no: string
          type: string
          priority?: string
          reason: string
          is_dispute?: boolean
          dispute_reason?: string | null
          dispute_evidence?: string[] | null
          compensation_amount?: number | null
          status?: string
          assignee_id: string
          assignee_name: string
          processing_start_time?: string
          processing_end_time?: string | null
          processing_duration?: number | null
          processing_notes?: Json | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          order_no?: string
          type?: string
          priority?: string
          reason?: string
          is_dispute?: boolean
          dispute_reason?: string | null
          dispute_evidence?: string[] | null
          compensation_amount?: number | null
          status?: string
          assignee_id?: string
          assignee_name?: string
          processing_start_time?: string
          processing_end_time?: string | null
          processing_duration?: number | null
          processing_notes?: Json | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          site_id: string
          site_name: string
          sku: string
          product_name: string
          quantity: number
          reserved_quantity: number
          available_quantity: number
          in_transit_quantity: number | null
          in_transit_from: string | null
          in_transit_estimated_arrival: string | null
          unit_cost: number | null
          warning_threshold: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          site_name: string
          sku: string
          product_name: string
          quantity?: number
          reserved_quantity?: number
          available_quantity?: number
          in_transit_quantity?: number | null
          in_transit_from?: string | null
          in_transit_estimated_arrival?: string | null
          unit_cost?: number | null
          warning_threshold?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          site_name?: string
          sku?: string
          product_name?: string
          quantity?: number
          reserved_quantity?: number
          available_quantity?: number
          in_transit_quantity?: number | null
          in_transit_from?: string | null
          in_transit_estimated_arrival?: string | null
          unit_cost?: number | null
          warning_threshold?: number
          last_updated?: string
          created_at?: string
        }
      }
      delivery_routes: {
        Row: {
          id: string
          rider_id: string
          rider_name: string
          order_id: string
          order_no: string
          distance: number
          duration: number
          start_time: string
          end_time: string
          order_count: number | null
          total_distance: number | null
          total_time: number | null
          created_at: string
        }
        Insert: {
          id?: string
          rider_id: string
          rider_name: string
          order_id: string
          order_no: string
          distance: number
          duration: number
          start_time: string
          end_time: string
          order_count?: number | null
          total_distance?: number | null
          total_time?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          rider_id?: string
          rider_name?: string
          order_id?: string
          order_no?: string
          distance?: number
          duration?: number
          start_time?: string
          end_time?: string
          order_count?: number | null
          total_distance?: number | null
          total_time?: number | null
          created_at?: string
        }
      }
      discrepancy_records: {
        Row: {
          id: string
          order_id: string
          order_no: string
          expected_items: number
          actual_items: number
          difference: number
          reason: string | null
          reported_by: string
          reported_at: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          order_no: string
          expected_items: number
          actual_items: number
          difference: number
          reason?: string | null
          reported_by: string
          reported_at?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          order_no?: string
          expected_items?: number
          actual_items?: number
          difference?: number
          reason?: string | null
          reported_by?: string
          reported_at?: string
          status?: string
          created_at?: string
        }
      }
      operation_logs: {
        Row: {
          id: string
          user_id: string
          operator_name: string
          operator_role: string
          action: string
          type: string
          target_id: string
          details: string
          order_no: string | null
          ip_address: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          operator_name: string
          operator_role: string
          action: string
          type: string
          target_id: string
          details: string
          order_no?: string | null
          ip_address: string
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          operator_name?: string
          operator_role?: string
          action?: string
          type?: string
          target_id?: string
          details?: string
          order_no?: string | null
          ip_address?: string
          timestamp?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          order_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          order_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          order_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      performance_stats: {
        Row: {
          id: string
          date: string
          total_orders: number
          on_time_deliveries: number
          late_deliveries: number
          on_time_rate: number
          avg_delivery_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          total_orders?: number
          on_time_deliveries?: number
          late_deliveries?: number
          on_time_rate?: number
          avg_delivery_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_orders?: number
          on_time_deliveries?: number
          late_deliveries?: number
          on_time_rate?: number
          avg_delivery_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          created_at?: string | null
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
