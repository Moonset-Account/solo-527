export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'super_admin' | 'sales_manager' | 'sales_consultant' | 'analyst';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'super_admin' | 'sales_manager' | 'sales_consultant' | 'analyst';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'super_admin' | 'sales_manager' | 'sales_consultant' | 'analyst';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_stages: {
        Row: {
          id: string;
          name: string;
          color: string;
          order: number;
          is_active: boolean;
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          order?: number;
          is_active?: boolean;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          order?: number;
          is_active?: boolean;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          category: string;
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          category?: string;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          category?: string;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          customer_name: string;
          phone: string;
          community: string | null;
          area: number | null;
          budget_min: number | null;
          budget_max: number | null;
          style: string | null;
          source: string | null;
          stage_id: string;
          tags: string[];
          remark: string | null;
          is_in_pool: boolean;
          assignee_id: string | null;
          assignee_name: string | null;
          auto_recycle_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          phone: string;
          community?: string | null;
          area?: number | null;
          budget_min?: number | null;
          budget_max?: number | null;
          style?: string | null;
          source?: string | null;
          stage_id?: string;
          tags?: string[];
          remark?: string | null;
          is_in_pool?: boolean;
          assignee_id?: string | null;
          assignee_name?: string | null;
          auto_recycle_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          phone?: string;
          community?: string | null;
          area?: number | null;
          budget_min?: number | null;
          budget_max?: number | null;
          style?: string | null;
          source?: string | null;
          stage_id?: string;
          tags?: string[];
          remark?: string | null;
          is_in_pool?: boolean;
          assignee_id?: string | null;
          assignee_name?: string | null;
          auto_recycle_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      follow_up_records: {
        Row: {
          id: string;
          lead_id: string;
          method: string;
          content: string;
          follow_up_time: string;
          next_follow_up_at: string | null;
          created_by: string;
          created_by_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          method: string;
          content: string;
          follow_up_time?: string;
          next_follow_up_at?: string | null;
          created_by?: string;
          created_by_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          method?: string;
          content?: string;
          follow_up_time?: string;
          next_follow_up_at?: string | null;
          created_by?: string;
          created_by_name?: string;
          created_at?: string;
        };
      };
      survey_records: {
        Row: {
          id: string;
          lead_id: string;
          survey_time: string;
          surveyor_id: string;
          surveyor_name: string;
          photos: string[];
          length: number | null;
          width: number | null;
          height: number | null;
          layout_notes: string | null;
          customer_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          survey_time?: string;
          surveyor_id?: string;
          surveyor_name?: string;
          photos?: string[];
          length?: number | null;
          width?: number | null;
          height?: number | null;
          layout_notes?: string | null;
          customer_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          survey_time?: string;
          surveyor_id?: string;
          surveyor_name?: string;
          photos?: string[];
          length?: number | null;
          width?: number | null;
          height?: number | null;
          layout_notes?: string | null;
          customer_notes?: string | null;
          created_at?: string;
        };
      };
      contract_attachments: {
        Row: {
          id: string;
          lead_id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          file_url: string;
          uploaded_by: string;
          uploaded_by_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          file_name: string;
          file_type?: string;
          file_size?: number;
          file_url?: string;
          uploaded_by?: string;
          uploaded_by_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          file_url?: string;
          uploaded_by?: string;
          uploaded_by_name?: string;
          created_at?: string;
        };
      };
      change_logs: {
        Row: {
          id: string;
          lead_id: string;
          field: string | null;
          old_value: Json | null;
          new_value: Json | null;
          change_type: string;
          changed_by: string;
          changed_by_name: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          field?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          change_type?: string;
          changed_by?: string;
          changed_by_name?: string;
          changed_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          field?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          change_type?: string;
          changed_by?: string;
          changed_by_name?: string;
          changed_at?: string;
        };
      };
      revisit_records: {
        Row: {
          id: string;
          lead_id: string;
          customer_name: string;
          phone: string;
          revisit_count: number;
          first_consult_at: string;
          last_consult_at: string;
          reason: string;
          handling_time_minutes: number;
          handler_name: string;
          transfer_from_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          customer_name?: string;
          phone?: string;
          revisit_count?: number;
          first_consult_at?: string;
          last_consult_at?: string;
          reason?: string;
          handling_time_minutes?: number;
          handler_name?: string;
          transfer_from_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          customer_name?: string;
          phone?: string;
          revisit_count?: number;
          first_consult_at?: string;
          last_consult_at?: string;
          reason?: string;
          handling_time_minutes?: number;
          handler_name?: string;
          transfer_from_name?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
