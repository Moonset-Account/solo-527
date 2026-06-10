export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          role: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          role: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          role?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          title: string
          description: string | null
          brand_line: string | null
          target_platform: string[] | null
          expected_publish_date: string | null
          tags: string[] | null
          status: string
          creator_id: string
          creator_name: string
          reviewer_id: string | null
          reviewer_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          brand_line?: string | null
          target_platform?: string[] | null
          expected_publish_date?: string | null
          tags?: string[] | null
          status?: string
          creator_id: string
          creator_name: string
          reviewer_id?: string | null
          reviewer_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          brand_line?: string | null
          target_platform?: string[] | null
          expected_publish_date?: string | null
          tags?: string[] | null
          status?: string
          creator_id?: string
          creator_name?: string
          reviewer_id?: string | null
          reviewer_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scripts: {
        Row: {
          id: string
          topic_id: string
          content: string
          version: number
          status: string
          author_id: string
          author_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          content: string
          version?: number
          status?: string
          author_id: string
          author_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          content?: string
          version?: number
          status?: string
          author_id?: string
          author_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      timeline_events: {
        Row: {
          id: string
          topic_id: string
          event_type: string
          actor_id: string
          actor_name: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          event_type: string
          actor_id: string
          actor_name: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          event_type?: string
          actor_id?: string
          actor_name?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, unknown>
  }
}
