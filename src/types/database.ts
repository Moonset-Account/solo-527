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
      riders: {
        Row: {
          id: string
          name: string
          phone: string
          status: string
          current_lat: number | null
          current_lng: number | null
          current_order_id: string | null
          rating: number | null
          total_deliveries: number | null
          created_at: string | null
          last_location_updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          phone: string
          status?: string
          current_lat?: number | null
          current_lng?: number | null
          current_order_id?: string | null
          rating?: number | null
          total_deliveries?: number | null
          created_at?: string | null
          last_location_updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          status?: string
          current_lat?: number | null
          current_lng?: number | null
          current_order_id?: string | null
          rating?: number | null
          total_deliveries?: number | null
          created_at?: string | null
          last_location_updated_at?: string | null
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
          pickup_lat: number
          pickup_lng: number
          delivery_lat: number
          delivery_lng: number
          estimated_delivery_time: string
          actual_delivery_time: string | null
          rider_id: string | null
          goods_type: string
          temperature_required: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_no: string
          status?: string
          priority?: string
          pickup_address: string
          delivery_address: string
          pickup_lat: number
          pickup_lng: number
          delivery_lat: number
          delivery_lng: number
          estimated_delivery_time: string
          actual_delivery_time?: string | null
          rider_id?: string | null
          goods_type: string
          temperature_required?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_no?: string
          status?: string
          priority?: string
          pickup_address?: string
          delivery_address?: string
          pickup_lat?: number
          pickup_lng?: number
          delivery_lat?: number
          delivery_lng?: number
          estimated_delivery_time?: string
          actual_delivery_time?: string | null
          rider_id?: string | null
          goods_type?: string
          temperature_required?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tracking_points: {
        Row: {
          id: string
          order_id: string
          rider_id: string
          lat: number
          lng: number
          speed: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          order_id: string
          rider_id: string
          lat: number
          lng: number
          speed?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          order_id?: string
          rider_id?: string
          lat?: number
          lng?: number
          speed?: number | null
          timestamp?: string
        }
      }
      temperature_records: {
        Row: {
          id: string
          order_id: string
          temperature: number
          humidity: number | null
          timestamp: string
          is_normal: boolean
        }
        Insert: {
          id?: string
          order_id: string
          temperature: number
          humidity?: number | null
          timestamp?: string
          is_normal?: boolean
        }
        Update: {
          id?: string
          order_id?: string
          temperature?: number
          humidity?: number | null
          timestamp?: string
          is_normal?: boolean
        }
      }
      exception_records: {
        Row: {
          id: string
          order_id: string
          type: string
          reason: string
          dispute_reason: string | null
          compensation_amount: number | null
          status: string
          assignee_id: string | null
          assignee_name: string | null
          processing_start_time: string
          processing_end_time: string | null
          processing_duration: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          type: string
          reason: string
          dispute_reason?: string | null
          compensation_amount?: number | null
          status?: string
          assignee_id?: string | null
          assignee_name?: string | null
          processing_start_time?: string
          processing_end_time?: string | null
          processing_duration?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          type?: string
          reason?: string
          dispute_reason?: string | null
          compensation_amount?: number | null
          status?: string
          assignee_id?: string | null
          assignee_name?: string | null
          processing_start_time?: string
          processing_end_time?: string | null
          processing_duration?: number | null
          created_at?: string | null
        }
      }
      sites: {
        Row: {
          id: string
          name: string
          address: string
          lat: number
          lng: number
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address: string
          lat: number
          lng: number
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string
          lat?: number
          lng?: number
          created_at?: string | null
        }
      }
      inventory_items: {
        Row: {
          id: string
          site_id: string
          sku: string
          product_name: string
          quantity: number
          reserved_quantity: number
          available_quantity: number
          warning_threshold: number
          last_updated: string | null
        }
        Insert: {
          id?: string
          site_id: string
          sku: string
          product_name: string
          quantity?: number
          reserved_quantity?: number
          available_quantity?: number
          warning_threshold?: number
          last_updated?: string | null
        }
        Update: {
          id?: string
          site_id?: string
          sku?: string
          product_name?: string
          quantity?: number
          reserved_quantity?: number
          available_quantity?: number
          warning_threshold?: number
          last_updated?: string | null
        }
      }
      operation_logs: {
        Row: {
          id: string
          user_id: string | null
          user_name: string
          action: string
          target_type: string
          target_id: string
          details: Json | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_name: string
          action: string
          target_type: string
          target_id: string
          details?: Json | null
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          user_name?: string
          action?: string
          target_type?: string
          target_id?: string
          details?: Json | null
          ip_address?: string | null
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
