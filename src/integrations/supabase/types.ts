export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_copies: {
        Row: {
          content_type: string
          created_at: string
          id: string
          output: string
          prompt_inputs: Json | null
          user_id: string
          variation: string | null
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          output: string
          prompt_inputs?: Json | null
          user_id: string
          variation?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          output?: string
          prompt_inputs?: Json | null
          user_id?: string
          variation?: string | null
        }
        Relationships: []
      }
      ai_images: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          created_at: string
          id: string
          image_url: string
          mode: string
          prompt: string
          size: string | null
          source_url: string | null
          storage_path: string | null
          style: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          mode: string
          prompt: string
          size?: string | null
          source_url?: string | null
          storage_path?: string | null
          style?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          mode?: string
          prompt?: string
          size?: string | null
          source_url?: string | null
          storage_path?: string | null
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          client_id: string | null
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          monthly_budget: number | null
          name: string
          results_notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          monthly_budget?: number | null
          name: string
          results_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          monthly_budget?: number | null
          name?: string
          results_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_images: {
        Row: {
          client_id: string | null
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          brand_colors: string | null
          brand_voice: string | null
          business_name: string
          competitors: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          keywords: string | null
          monthly_budget: number | null
          notes: string | null
          phone: string | null
          preferred_tone: string | null
          services: string | null
          status: string
          target_audience: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          brand_colors?: string | null
          brand_voice?: string | null
          business_name: string
          competitors?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          keywords?: string | null
          monthly_budget?: number | null
          notes?: string | null
          phone?: string | null
          preferred_tone?: string | null
          services?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          brand_colors?: string | null
          brand_voice?: string | null
          business_name?: string
          competitors?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          keywords?: string | null
          monthly_budget?: number | null
          notes?: string | null
          phone?: string | null
          preferred_tone?: string | null
          services?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      content_approvals: {
        Row: {
          approved_by: string
          created_at: string
          id: string
          notes: string | null
          post_id: string
          status: string
        }
        Insert: {
          approved_by: string
          created_at?: string
          id?: string
          notes?: string | null
          post_id: string
          status?: string
        }
        Update: {
          approved_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          calendar_date: string
          created_at: string
          id: string
          platform: string
          post_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          calendar_date: string
          created_at?: string
          id?: string
          platform: string
          post_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          calendar_date?: string
          created_at?: string
          id?: string
          platform?: string
          post_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          ai_generated: boolean
          campaign_id: string | null
          caption: string
          client_id: string | null
          created_at: string
          hashtags: string
          id: string
          media_urls: Json
          platform: string
          published_at: string | null
          scheduled_for: string | null
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          campaign_id?: string | null
          caption?: string
          client_id?: string | null
          created_at?: string
          hashtags?: string
          id?: string
          media_urls?: Json
          platform: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          campaign_id?: string | null
          caption?: string
          client_id?: string | null
          created_at?: string
          hashtags?: string
          id?: string
          media_urls?: Json
          platform?: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      creative_projects: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          created_at: string
          generation_type: string
          id: string
          image_url: string
          prompt: string
          size: string | null
          source_image_id: string | null
          storage_path: string | null
          style: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          generation_type: string
          id?: string
          image_url: string
          prompt: string
          size?: string | null
          source_image_id?: string | null
          storage_path?: string | null
          style?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          generation_type?: string
          id?: string
          image_url?: string
          prompt?: string
          size?: string | null
          source_image_id?: string | null
          storage_path?: string | null
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          service_interest: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          service_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          service_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          client_id: string | null
          created_at: string
          file_type: string
          file_url: string
          id: string
          name: string
          source: string
          tags: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          name: string
          source?: string
          tags?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          name?: string
          source?: string
          tags?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meeting_action_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          meeting_id: string
          status: string
          task_description: string | null
          task_title: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          meeting_id: string
          status?: string
          task_description?: string | null
          task_title?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          meeting_id?: string
          status?: string
          task_description?: string | null
          task_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          notes: string | null
          owner: string | null
          owner_id: string | null
          priority: string
          sort_order: number
          time_estimate: number | null
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          notes?: string | null
          owner?: string | null
          owner_id?: string | null
          priority?: string
          sort_order?: number
          time_estimate?: number | null
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          notes?: string | null
          owner?: string | null
          owner_id?: string | null
          priority?: string
          sort_order?: number
          time_estimate?: number | null
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          meeting_id: string
          storage_path: string | null
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          meeting_id: string
          storage_path?: string | null
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          meeting_id?: string
          storage_path?: string | null
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attachments_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          attendance_status: string
          created_at: string
          email: string | null
          id: string
          meeting_id: string
          name: string
          role: string | null
          user_id: string
        }
        Insert: {
          attendance_status?: string
          created_at?: string
          email?: string | null
          id?: string
          meeting_id: string
          name: string
          role?: string | null
          user_id: string
        }
        Update: {
          attendance_status?: string
          created_at?: string
          email?: string | null
          id?: string
          meeting_id?: string
          name?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          created_at: string
          decisions: string | null
          discussion: string | null
          id: string
          meeting_id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decisions?: string | null
          discussion?: string | null
          id?: string
          meeting_id: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decisions?: string | null
          discussion?: string | null
          id?: string
          meeting_id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          campaign_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          goal: string | null
          id: string
          location: string | null
          meeting_date: string
          notes: string | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          video_link: string | null
        }
        Insert: {
          agenda?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          goal?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          notes?: string | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          video_link?: string | null
        }
        Update: {
          agenda?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          goal?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          notes?: string | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_link?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          created_at: string
          display_name: string | null
          id: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          agency_name?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          agency_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_name: string
          created_at: string
          expires_at: string | null
          id: string
          platform: string
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_name: string
          created_at?: string
          expires_at?: string | null
          id?: string
          platform: string
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_name?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          platform?: string
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          campaign_id: string | null
          caption: string
          client_id: string | null
          created_at: string
          cta: string | null
          hashtags: string | null
          id: string
          link: string | null
          media_url: string | null
          notes: string | null
          platform: string
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          caption?: string
          client_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          link?: string | null
          media_url?: string | null
          notes?: string | null
          platform: string
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          caption?: string
          client_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          link?: string | null
          media_url?: string | null
          notes?: string | null
          platform?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          client_id: string | null
          created_at: string
          due_date: string | null
          id: string
          meeting_id: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_assets: {
        Row: {
          asset_type: string
          client_id: string | null
          content: string
          created_at: string
          file_url: string
          id: string
          name: string
          project_id: string | null
          storage_path: string | null
          tags: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          client_id?: string | null
          content?: string
          created_at?: string
          file_url?: string
          id?: string
          name?: string
          project_id?: string | null
          storage_path?: string | null
          tags?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          client_id?: string | null
          content?: string
          created_at?: string
          file_url?: string
          id?: string
          name?: string
          project_id?: string | null
          storage_path?: string | null
          tags?: string
          user_id?: string
        }
        Relationships: []
      }
      video_projects: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          created_at: string
          id: string
          inputs: Json
          output: string
          output_json: Json
          platform: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          output?: string
          output_json?: Json
          platform?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          output?: string
          output_json?: Json
          platform?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_storyboards: {
        Row: {
          asset_needed: string
          created_at: string
          duration_seconds: number
          id: string
          on_screen_text: string
          project_id: string | null
          scene_number: number
          shot_type: string
          user_id: string
          visual: string
          voiceover: string
        }
        Insert: {
          asset_needed?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          on_screen_text?: string
          project_id?: string | null
          scene_number?: number
          shot_type?: string
          user_id: string
          visual?: string
          voiceover?: string
        }
        Update: {
          asset_needed?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          on_screen_text?: string
          project_id?: string | null
          scene_number?: number
          shot_type?: string
          user_id?: string
          visual?: string
          voiceover?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_meeting: {
        Args: { _meeting_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
      campaign_status:
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      campaign_type: "seo" | "ppc" | "social_media" | "website" | "branding"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "won"
        | "lost"
        | "discovery_booked"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "waiting" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
      campaign_status: [
        "planned",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      campaign_type: ["seo", "ppc", "social_media", "website", "branding"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "won",
        "lost",
        "discovery_booked",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "waiting", "done"],
    },
  },
} as const
