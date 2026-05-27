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
          campaign_folder_id: string | null
          content_type: string
          created_at: string
          id: string
          output: string
          prompt_inputs: Json | null
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          user_id: string
          variation: string | null
        }
        Insert: {
          campaign_folder_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          output: string
          prompt_inputs?: Json | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          user_id: string
          variation?: string | null
        }
        Update: {
          campaign_folder_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          output?: string
          prompt_inputs?: Json | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          user_id?: string
          variation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_copies_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
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
      campaign_folders: {
        Row: {
          assigned_team_members: string[]
          campaign_id: string | null
          client_id: string | null
          client_notes: string | null
          created_at: string
          folder_type: Database["public"]["Enums"]["campaign_folder_type"]
          goal: string | null
          human_request_id: string | null
          id: string
          is_demo: boolean
          name: string
          seo_ppc_consultation_id: string | null
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          status: Database["public"]["Enums"]["campaign_folder_status"]
          strategy_consultation_id: string | null
          strategy_summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_team_members?: string[]
          campaign_id?: string | null
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          folder_type?: Database["public"]["Enums"]["campaign_folder_type"]
          goal?: string | null
          human_request_id?: string | null
          id?: string
          is_demo?: boolean
          name: string
          seo_ppc_consultation_id?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: Database["public"]["Enums"]["campaign_folder_status"]
          strategy_consultation_id?: string | null
          strategy_summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_team_members?: string[]
          campaign_id?: string | null
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          folder_type?: Database["public"]["Enums"]["campaign_folder_type"]
          goal?: string | null
          human_request_id?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          seo_ppc_consultation_id?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: Database["public"]["Enums"]["campaign_folder_status"]
          strategy_consultation_id?: string | null
          strategy_summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_folders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_folders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_folder_id: string | null
          client_id: string | null
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          is_demo: boolean
          monthly_budget: number | null
          name: string
          results_notes: string | null
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_folder_id?: string | null
          client_id?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          is_demo?: boolean
          monthly_budget?: number | null
          name: string
          results_notes?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_folder_id?: string | null
          client_id?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          is_demo?: boolean
          monthly_budget?: number | null
          name?: string
          results_notes?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_audit_log: {
        Row: {
          action: string
          channel_id: string | null
          created_at: string
          details: Json
          id: string
          message_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          channel_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          message_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          channel_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          message_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string
          muted: boolean
          pinned: boolean
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          pinned?: boolean
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          pinned?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          campaign_id: string | null
          channel_type: string
          client_id: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          channel_type?: string
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          channel_type?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          ai_generated: boolean
          attachments: Json
          channel_id: string
          content: string
          created_at: string
          deleted_for: string[]
          edited: boolean
          id: string
          mentions: string[]
          message_type: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          attachments?: Json
          channel_id: string
          content?: string
          created_at?: string
          deleted_for?: string[]
          edited?: boolean
          id?: string
          mentions?: string[]
          message_type?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          attachments?: Json
          channel_id?: string
          content?: string
          created_at?: string
          deleted_for?: string[]
          edited?: boolean
          id?: string
          mentions?: string[]
          message_type?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_presence: {
        Row: {
          last_seen: string
          status: string
          typing_in: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seen?: string
          status?: string
          typing_in?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seen?: string
          status?: string
          typing_in?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          client_id: string | null
          context_page: string | null
          created_at: string
          id: string
          session_memory: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          context_page?: string | null
          created_at?: string
          id?: string
          session_memory?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          context_page?: string | null
          created_at?: string
          id?: string
          session_memory?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chatbot_kb_articles: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          published: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          published?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          flagged: boolean
          id: string
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json
          content?: string
          conversation_id: string
          created_at?: string
          flagged?: boolean
          id?: string
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          flagged?: boolean
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      chatbot_settings: {
        Row: {
          allow_scopes: Json
          client_id: string | null
          created_at: string
          custom_instructions: string
          enabled: boolean
          id: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_scopes?: Json
          client_id?: string | null
          created_at?: string
          custom_instructions?: string
          enabled?: boolean
          id?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_scopes?: Json
          client_id?: string | null
          created_at?: string
          custom_instructions?: string
          enabled?: boolean
          id?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          is_demo: boolean
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
          is_demo?: boolean
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
          is_demo?: boolean
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
      competitor_research: {
        Row: {
          ad_observations: Json | null
          campaign_folder_id: string | null
          competitor_name: string | null
          competitor_url: string | null
          consultation_id: string
          content_gaps: Json | null
          created_at: string
          id: string
          keyword_gaps: Json | null
          observed_strengths: Json | null
          observed_weaknesses: Json | null
        }
        Insert: {
          ad_observations?: Json | null
          campaign_folder_id?: string | null
          competitor_name?: string | null
          competitor_url?: string | null
          consultation_id: string
          content_gaps?: Json | null
          created_at?: string
          id?: string
          keyword_gaps?: Json | null
          observed_strengths?: Json | null
          observed_weaknesses?: Json | null
        }
        Update: {
          ad_observations?: Json | null
          campaign_folder_id?: string | null
          competitor_name?: string | null
          competitor_url?: string | null
          consultation_id?: string
          content_gaps?: Json | null
          created_at?: string
          id?: string
          keyword_gaps?: Json | null
          observed_strengths?: Json | null
          observed_weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_research_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_research_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "seo_ppc_consultations"
            referencedColumns: ["id"]
          },
        ]
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
          campaign_folder_id: string | null
          created_at: string
          id: string
          platform: string
          post_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          calendar_date: string
          campaign_folder_id?: string | null
          created_at?: string
          id?: string
          platform: string
          post_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          calendar_date?: string
          campaign_folder_id?: string | null
          created_at?: string
          id?: string
          platform?: string
          post_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
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
          campaign_folder_id: string | null
          campaign_id: string | null
          caption: string
          client_id: string | null
          created_at: string
          hashtags: string
          id: string
          is_demo: boolean
          media_urls: Json
          platform: string
          published_at: string | null
          scheduled_for: string | null
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          campaign_folder_id?: string | null
          campaign_id?: string | null
          caption?: string
          client_id?: string | null
          created_at?: string
          hashtags?: string
          id?: string
          is_demo?: boolean
          media_urls?: Json
          platform: string
          published_at?: string | null
          scheduled_for?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          campaign_folder_id?: string | null
          campaign_id?: string | null
          caption?: string
          client_id?: string | null
          created_at?: string
          hashtags?: string
          id?: string
          is_demo?: boolean
          media_urls?: Json
          platform?: string
          published_at?: string | null
          scheduled_for?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      content_rights_acknowledgements: {
        Row: {
          created_at: string
          human_reviewed: boolean
          id: string
          music_licensed: boolean
          no_celebrity_likeness: boolean
          no_fake_endorsement: boolean
          no_misleading_claims: boolean
          notes: string
          owns_rights: boolean
          resource_ref: string
          resource_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          human_reviewed?: boolean
          id?: string
          music_licensed?: boolean
          no_celebrity_likeness?: boolean
          no_fake_endorsement?: boolean
          no_misleading_claims?: boolean
          notes?: string
          owns_rights: boolean
          resource_ref: string
          resource_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          human_reviewed?: boolean
          id?: string
          music_licensed?: boolean
          no_celebrity_likeness?: boolean
          no_fake_endorsement?: boolean
          no_misleading_claims?: boolean
          notes?: string
          owns_rights?: boolean
          resource_ref?: string
          resource_type?: string
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
          campaign_folder_id: string | null
          campaign_id: string | null
          client_id: string | null
          created_at: string
          generation_type: string
          id: string
          image_url: string
          prompt: string
          size: string | null
          source_image_id: string | null
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          storage_path: string | null
          style: string | null
          user_id: string
        }
        Insert: {
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          generation_type: string
          id?: string
          image_url: string
          prompt: string
          size?: string | null
          source_image_id?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          storage_path?: string | null
          style?: string | null
          user_id: string
        }
        Update: {
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          generation_type?: string
          id?: string
          image_url?: string
          prompt?: string
          size?: string | null
          source_image_id?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          storage_path?: string | null
          style?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_strategy_content: {
        Row: {
          approval_status: Database["public"]["Enums"]["strategy_approval_status"]
          campaign_folder_id: string | null
          campaign_id: string | null
          caption: string | null
          client_id: string | null
          consultation_id: string
          content_type: string
          created_at: string
          cta: string | null
          hashtags: string | null
          id: string
          image_prompt: string | null
          platform: string
          scheduled_date: string | null
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          title: string | null
          video_script: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["strategy_approval_status"]
          campaign_folder_id?: string | null
          campaign_id?: string | null
          caption?: string | null
          client_id?: string | null
          consultation_id: string
          content_type: string
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          image_prompt?: string | null
          platform: string
          scheduled_date?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          title?: string | null
          video_script?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["strategy_approval_status"]
          campaign_folder_id?: string | null
          campaign_id?: string | null
          caption?: string | null
          client_id?: string | null
          consultation_id?: string
          content_type?: string
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          image_prompt?: string | null
          platform?: string
          scheduled_date?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          title?: string | null
          video_script?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_strategy_content_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_strategy_content_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "strategy_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      human_seo_ppc_requests: {
        Row: {
          assigned_to: string | null
          campaign_folder_id: string | null
          client_id: string | null
          consultation_id: string | null
          created_at: string
          free_consultation_used: boolean
          id: string
          meeting_id: string | null
          payment_required: boolean
          price: number | null
          request_status: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_folder_id?: string | null
          client_id?: string | null
          consultation_id?: string | null
          created_at?: string
          free_consultation_used?: boolean
          id?: string
          meeting_id?: string | null
          payment_required?: boolean
          price?: number | null
          request_status?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          campaign_folder_id?: string | null
          client_id?: string | null
          consultation_id?: string | null
          created_at?: string
          free_consultation_used?: boolean
          id?: string
          meeting_id?: string | null
          payment_required?: boolean
          price?: number | null
          request_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_seo_ppc_requests_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_seo_ppc_requests_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "seo_ppc_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      human_strategy_requests: {
        Row: {
          assigned_to: string | null
          campaign_folder_id: string | null
          client_id: string | null
          consultation_id: string | null
          created_at: string
          free_consultation_used: boolean
          id: string
          meeting_id: string | null
          payment_required: boolean
          price: number | null
          request_status: Database["public"]["Enums"]["human_request_status"]
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_folder_id?: string | null
          client_id?: string | null
          consultation_id?: string | null
          created_at?: string
          free_consultation_used?: boolean
          id?: string
          meeting_id?: string | null
          payment_required?: boolean
          price?: number | null
          request_status?: Database["public"]["Enums"]["human_request_status"]
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          campaign_folder_id?: string | null
          client_id?: string | null
          consultation_id?: string | null
          created_at?: string
          free_consultation_used?: boolean
          id?: string
          meeting_id?: string | null
          payment_required?: boolean
          price?: number | null
          request_status?: Database["public"]["Enums"]["human_request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_strategy_requests_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_strategy_requests_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "strategy_consultations"
            referencedColumns: ["id"]
          },
        ]
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
      marketing_profiles: {
        Row: {
          approval_required: boolean
          brand_colors: Json
          brand_tone: string | null
          budget_range: string | null
          business_name: string | null
          client_id: string | null
          client_portal_enabled: boolean
          competitors: string | null
          content_types: string[]
          conversion_goal: string | null
          created_at: string
          creation_mode: string
          demo_template: string | null
          human_consultation_requested: boolean
          id: string
          industry: string | null
          is_demo: boolean
          landing_page_url: string | null
          lead_type: string | null
          location: string | null
          logo_url: string | null
          main_goal: string | null
          media_urls: Json
          offers: string | null
          onboarding_completed: boolean
          onboarding_step: number
          platforms: string[]
          posting_frequency: string | null
          ppc_budget: number | null
          seo_competitors: string | null
          services: string | null
          target_audience: string | null
          target_keywords: string[]
          target_locations: string[]
          updated_at: string
          user_id: string
          usps: string | null
          website_url: string | null
        }
        Insert: {
          approval_required?: boolean
          brand_colors?: Json
          brand_tone?: string | null
          budget_range?: string | null
          business_name?: string | null
          client_id?: string | null
          client_portal_enabled?: boolean
          competitors?: string | null
          content_types?: string[]
          conversion_goal?: string | null
          created_at?: string
          creation_mode?: string
          demo_template?: string | null
          human_consultation_requested?: boolean
          id?: string
          industry?: string | null
          is_demo?: boolean
          landing_page_url?: string | null
          lead_type?: string | null
          location?: string | null
          logo_url?: string | null
          main_goal?: string | null
          media_urls?: Json
          offers?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          platforms?: string[]
          posting_frequency?: string | null
          ppc_budget?: number | null
          seo_competitors?: string | null
          services?: string | null
          target_audience?: string | null
          target_keywords?: string[]
          target_locations?: string[]
          updated_at?: string
          user_id: string
          usps?: string | null
          website_url?: string | null
        }
        Update: {
          approval_required?: boolean
          brand_colors?: Json
          brand_tone?: string | null
          budget_range?: string | null
          business_name?: string | null
          client_id?: string | null
          client_portal_enabled?: boolean
          competitors?: string | null
          content_types?: string[]
          conversion_goal?: string | null
          created_at?: string
          creation_mode?: string
          demo_template?: string | null
          human_consultation_requested?: boolean
          id?: string
          industry?: string | null
          is_demo?: boolean
          landing_page_url?: string | null
          lead_type?: string | null
          location?: string | null
          logo_url?: string | null
          main_goal?: string | null
          media_urls?: Json
          offers?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          platforms?: string[]
          posting_frequency?: string | null
          ppc_budget?: number | null
          seo_competitors?: string | null
          services?: string | null
          target_audience?: string | null
          target_keywords?: string[]
          target_locations?: string[]
          updated_at?: string
          user_id?: string
          usps?: string | null
          website_url?: string | null
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
          campaign_folder_id: string | null
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
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          start_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          video_link: string | null
        }
        Insert: {
          agenda?: string | null
          campaign_folder_id?: string | null
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
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          video_link?: string | null
        }
        Update: {
          agenda?: string | null
          campaign_folder_id?: string | null
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
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      ppc_keywords: {
        Row: {
          ad_group: string | null
          campaign_folder_id: string | null
          consultation_id: string
          created_at: string
          estimated_cpc: number | null
          id: string
          intent: string | null
          keyword: string
          match_type: string | null
          priority: string | null
        }
        Insert: {
          ad_group?: string | null
          campaign_folder_id?: string | null
          consultation_id: string
          created_at?: string
          estimated_cpc?: number | null
          id?: string
          intent?: string | null
          keyword: string
          match_type?: string | null
          priority?: string | null
        }
        Update: {
          ad_group?: string | null
          campaign_folder_id?: string | null
          consultation_id?: string
          created_at?: string
          estimated_cpc?: number | null
          id?: string
          intent?: string | null
          keyword?: string
          match_type?: string | null
          priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ppc_keywords_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppc_keywords_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "seo_ppc_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      ppc_recommendations: {
        Row: {
          ab_testing_plan: Json | null
          ad_copy_recommendations: Json | null
          budget_allocation: Json | null
          campaign_folder_id: string | null
          campaign_structure: Json | null
          consultation_id: string
          conversion_tracking_checklist: Json | null
          created_at: string
          id: string
          keyword_groups: Json | null
          landing_page_recommendations: Json | null
          negative_keywords: Json | null
          recommended_platforms: Json | null
          retargeting_strategy: Json | null
          sources_used: Json | null
        }
        Insert: {
          ab_testing_plan?: Json | null
          ad_copy_recommendations?: Json | null
          budget_allocation?: Json | null
          campaign_folder_id?: string | null
          campaign_structure?: Json | null
          consultation_id: string
          conversion_tracking_checklist?: Json | null
          created_at?: string
          id?: string
          keyword_groups?: Json | null
          landing_page_recommendations?: Json | null
          negative_keywords?: Json | null
          recommended_platforms?: Json | null
          retargeting_strategy?: Json | null
          sources_used?: Json | null
        }
        Update: {
          ab_testing_plan?: Json | null
          ad_copy_recommendations?: Json | null
          budget_allocation?: Json | null
          campaign_folder_id?: string | null
          campaign_structure?: Json | null
          consultation_id?: string
          conversion_tracking_checklist?: Json | null
          created_at?: string
          id?: string
          keyword_groups?: Json | null
          landing_page_recommendations?: Json | null
          negative_keywords?: Json | null
          recommended_platforms?: Json | null
          retargeting_strategy?: Json | null
          sources_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ppc_recommendations_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppc_recommendations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "seo_ppc_consultations"
            referencedColumns: ["id"]
          },
        ]
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
      seo_keywords: {
        Row: {
          campaign_folder_id: string | null
          consultation_id: string
          created_at: string
          difficulty_score: number | null
          id: string
          intent: string | null
          keyword: string
          page_target: string | null
          priority: string | null
          search_volume: number | null
        }
        Insert: {
          campaign_folder_id?: string | null
          consultation_id: string
          created_at?: string
          difficulty_score?: number | null
          id?: string
          intent?: string | null
          keyword: string
          page_target?: string | null
          priority?: string | null
          search_volume?: number | null
        }
        Update: {
          campaign_folder_id?: string | null
          consultation_id?: string
          created_at?: string
          difficulty_score?: number | null
          id?: string
          intent?: string | null
          keyword?: string
          page_target?: string | null
          priority?: string | null
          search_volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_keywords_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_keywords_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "seo_ppc_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_ppc_admin_settings: {
        Row: {
          booking_link: string
          created_at: string
          free_consultation_minutes: number
          id: string
          paid_consultation_price: number
          payment_link: string
          ppc_enabled: boolean
          ppc_specialist_ids: string[]
          seo_enabled: boolean
          seo_specialist_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_link?: string
          created_at?: string
          free_consultation_minutes?: number
          id?: string
          paid_consultation_price?: number
          payment_link?: string
          ppc_enabled?: boolean
          ppc_specialist_ids?: string[]
          seo_enabled?: boolean
          seo_specialist_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_link?: string
          created_at?: string
          free_consultation_minutes?: number
          id?: string
          paid_consultation_price?: number
          payment_link?: string
          ppc_enabled?: boolean
          ppc_specialist_ids?: string[]
          seo_enabled?: boolean
          seo_specialist_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_ppc_approvals: {
        Row: {
          approval_status: string
          approved_at: string | null
          client_id: string | null
          client_notes: string | null
          consultation_id: string
          created_at: string
          id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          client_id?: string | null
          client_notes?: string | null
          consultation_id: string
          created_at?: string
          id?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          client_id?: string | null
          client_notes?: string | null
          consultation_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_ppc_approvals_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "seo_ppc_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_ppc_consultations: {
        Row: {
          business_goal: string | null
          business_name: string
          campaign_folder_id: string | null
          campaign_id: string | null
          client_id: string | null
          competitors: string | null
          consultation_type: string | null
          conversion_goal: string | null
          created_at: string
          customizations: Json | null
          existing_landing_pages: string | null
          human_request_id: string | null
          id: string
          ideal_cost_per_lead: number | null
          industry: string | null
          location: string | null
          module: string
          monthly_budget: number | null
          offers: string | null
          platforms: string[] | null
          primary_goal: string | null
          recommendations: Json | null
          seo_scope: string | null
          services: string | null
          status: string
          target_audience: string | null
          target_customer: string | null
          target_keywords: string | null
          target_location: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          business_goal?: string | null
          business_name: string
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          competitors?: string | null
          consultation_type?: string | null
          conversion_goal?: string | null
          created_at?: string
          customizations?: Json | null
          existing_landing_pages?: string | null
          human_request_id?: string | null
          id?: string
          ideal_cost_per_lead?: number | null
          industry?: string | null
          location?: string | null
          module: string
          monthly_budget?: number | null
          offers?: string | null
          platforms?: string[] | null
          primary_goal?: string | null
          recommendations?: Json | null
          seo_scope?: string | null
          services?: string | null
          status?: string
          target_audience?: string | null
          target_customer?: string | null
          target_keywords?: string | null
          target_location?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          business_goal?: string | null
          business_name?: string
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          competitors?: string | null
          consultation_type?: string | null
          conversion_goal?: string | null
          created_at?: string
          customizations?: Json | null
          existing_landing_pages?: string | null
          human_request_id?: string | null
          id?: string
          ideal_cost_per_lead?: number | null
          industry?: string | null
          location?: string | null
          module?: string
          monthly_budget?: number | null
          offers?: string | null
          platforms?: string[] | null
          primary_goal?: string | null
          recommendations?: Json | null
          seo_scope?: string | null
          services?: string | null
          status?: string
          target_audience?: string | null
          target_customer?: string | null
          target_keywords?: string | null
          target_location?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_ppc_consultations_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_recommendations: {
        Row: {
          backlink_recommendations: Json | null
          campaign_folder_id: string | null
          competitor_gap_summary: Json | null
          consultation_id: string
          content_recommendations: Json | null
          created_at: string
          google_business_profile_recommendations: Json | null
          id: string
          keyword_strategy: Json | null
          local_seo_strategy: Json | null
          on_page_recommendations: Json | null
          seo_30_day_plan: Json | null
          seo_60_day_plan: Json | null
          seo_90_day_plan: Json | null
          sources_used: Json | null
          technical_seo_recommendations: Json | null
        }
        Insert: {
          backlink_recommendations?: Json | null
          campaign_folder_id?: string | null
          competitor_gap_summary?: Json | null
          consultation_id: string
          content_recommendations?: Json | null
          created_at?: string
          google_business_profile_recommendations?: Json | null
          id?: string
          keyword_strategy?: Json | null
          local_seo_strategy?: Json | null
          on_page_recommendations?: Json | null
          seo_30_day_plan?: Json | null
          seo_60_day_plan?: Json | null
          seo_90_day_plan?: Json | null
          sources_used?: Json | null
          technical_seo_recommendations?: Json | null
        }
        Update: {
          backlink_recommendations?: Json | null
          campaign_folder_id?: string | null
          competitor_gap_summary?: Json | null
          consultation_id?: string
          content_recommendations?: Json | null
          created_at?: string
          google_business_profile_recommendations?: Json | null
          id?: string
          keyword_strategy?: Json | null
          local_seo_strategy?: Json | null
          on_page_recommendations?: Json | null
          seo_30_day_plan?: Json | null
          seo_60_day_plan?: Json | null
          seo_90_day_plan?: Json | null
          sources_used?: Json | null
          technical_seo_recommendations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_recommendations_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_recommendations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "seo_ppc_consultations"
            referencedColumns: ["id"]
          },
        ]
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
          ai_generated: boolean
          campaign_folder_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          caption: string
          client_id: string | null
          client_name: string | null
          created_at: string
          cta: string | null
          hashtags: string | null
          id: string
          is_demo: boolean
          link: string | null
          media_url: string | null
          notes: string | null
          platform: string
          scheduled_at: string
          source_module: string | null
          source_post_id: string | null
          source_strategy_id: string | null
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          campaign_folder_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          caption?: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          is_demo?: boolean
          link?: string | null
          media_url?: string | null
          notes?: string | null
          platform: string
          scheduled_at?: string
          source_module?: string | null
          source_post_id?: string | null
          source_strategy_id?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          campaign_folder_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          caption?: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          is_demo?: boolean
          link?: string | null
          media_url?: string | null
          notes?: string | null
          platform?: string
          scheduled_at?: string
          source_module?: string | null
          source_post_id?: string | null
          source_strategy_id?: string | null
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_admin_settings: {
        Row: {
          available_strategist_ids: string[]
          booking_link: string
          created_at: string
          free_consultation_minutes: number
          human_consultation_enabled: boolean
          id: string
          paid_consultation_price: number
          payment_link: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_strategist_ids?: string[]
          booking_link?: string
          created_at?: string
          free_consultation_minutes?: number
          human_consultation_enabled?: boolean
          id?: string
          paid_consultation_price?: number
          payment_link?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_strategist_ids?: string[]
          booking_link?: string
          created_at?: string
          free_consultation_minutes?: number
          human_consultation_enabled?: boolean
          id?: string
          paid_consultation_price?: number
          payment_link?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_approvals: {
        Row: {
          approval_status: Database["public"]["Enums"]["strategy_approval_status"]
          approved_at: string | null
          client_id: string | null
          client_notes: string | null
          consultation_id: string
          created_at: string
          id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["strategy_approval_status"]
          approved_at?: string | null
          client_id?: string | null
          client_notes?: string | null
          consultation_id: string
          created_at?: string
          id?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["strategy_approval_status"]
          approved_at?: string | null
          client_id?: string | null
          client_notes?: string | null
          consultation_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_approvals_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "strategy_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_consultations: {
        Row: {
          business_goal: string | null
          business_name: string
          campaign_folder_id: string | null
          client_id: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          id: string
          industry: string
          location: string | null
          preferred_posting_frequency: string | null
          selected_platforms: string[]
          status: Database["public"]["Enums"]["strategy_status"]
          target_audience: string | null
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_goal?: string | null
          business_name: string
          campaign_folder_id?: string | null
          client_id?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          id?: string
          industry: string
          location?: string | null
          preferred_posting_frequency?: string | null
          selected_platforms?: string[]
          status?: Database["public"]["Enums"]["strategy_status"]
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_goal?: string | null
          business_name?: string
          campaign_folder_id?: string | null
          client_id?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          id?: string
          industry?: string
          location?: string | null
          preferred_posting_frequency?: string | null
          selected_platforms?: string[]
          status?: Database["public"]["Enums"]["strategy_status"]
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_consultations_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_recommendations: {
        Row: {
          best_practices_summary: string | null
          campaign_folder_id: string | null
          consultation_id: string
          created_at: string
          id: string
          recommended_content_pillars: string[]
          recommended_cta_strategy: string | null
          recommended_hashtag_strategy: string | null
          recommended_platforms: string[]
          recommended_posting_frequency: string | null
          recommended_posting_times: Json
          sources_used: Json
        }
        Insert: {
          best_practices_summary?: string | null
          campaign_folder_id?: string | null
          consultation_id: string
          created_at?: string
          id?: string
          recommended_content_pillars?: string[]
          recommended_cta_strategy?: string | null
          recommended_hashtag_strategy?: string | null
          recommended_platforms?: string[]
          recommended_posting_frequency?: string | null
          recommended_posting_times?: Json
          sources_used?: Json
        }
        Update: {
          best_practices_summary?: string | null
          campaign_folder_id?: string | null
          consultation_id?: string
          created_at?: string
          id?: string
          recommended_content_pillars?: string[]
          recommended_cta_strategy?: string | null
          recommended_hashtag_strategy?: string | null
          recommended_platforms?: string[]
          recommended_posting_frequency?: string | null
          recommended_posting_times?: Json
          sources_used?: Json
        }
        Relationships: [
          {
            foreignKeyName: "strategy_recommendations_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_recommendations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "strategy_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          client_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          priority: string
          source: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          client_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          priority?: string
          source?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          client_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          priority?: string
          source?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          campaign_folder_id: string | null
          campaign_id: string | null
          client_id: string | null
          created_at: string
          due_date: string | null
          id: string
          meeting_id: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
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
          duration: number | null
          file_name: string
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
          duration?: number | null
          file_name?: string
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
          duration?: number | null
          file_name?: string
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
      video_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          resource_id: string | null
          resource_type: string
          user_id: string
          video_project_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          resource_id?: string | null
          resource_type: string
          user_id: string
          video_project_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string
          video_project_id?: string | null
        }
        Relationships: []
      }
      video_projects: {
        Row: {
          campaign_folder_id: string | null
          campaign_id: string | null
          client_id: string | null
          created_at: string
          format: string
          id: string
          inputs: Json
          output: string
          output_json: Json
          platform: string
          source_type: Database["public"]["Enums"]["campaign_source_type"]
          status: string
          style: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          format?: string
          id?: string
          inputs?: Json
          output?: string
          output_json?: Json
          platform?: string
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: string
          style?: string
          title?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_folder_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          format?: string
          id?: string
          inputs?: Json
          output?: string
          output_json?: Json
          platform?: string
          source_type?: Database["public"]["Enums"]["campaign_source_type"]
          status?: string
          style?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_projects_campaign_folder_id_fkey"
            columns: ["campaign_folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      video_renders: {
        Row: {
          created_at: string
          export_format: string
          id: string
          platform: string
          render_status: string
          render_url: string
          user_id: string
          video_project_id: string
        }
        Insert: {
          created_at?: string
          export_format?: string
          id?: string
          platform?: string
          render_status?: string
          render_url?: string
          user_id: string
          video_project_id: string
        }
        Update: {
          created_at?: string
          export_format?: string
          id?: string
          platform?: string
          render_status?: string
          render_url?: string
          user_id?: string
          video_project_id?: string
        }
        Relationships: []
      }
      video_scenes: {
        Row: {
          created_at: string
          duration: number | null
          id: string
          media_url: string
          scene_order: number
          scene_prompt: string
          script_text: string
          text_overlay: string
          transition: string
          user_id: string
          video_project_id: string
          visual_description: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          id?: string
          media_url?: string
          scene_order?: number
          scene_prompt?: string
          script_text?: string
          text_overlay?: string
          transition?: string
          user_id: string
          video_project_id: string
          visual_description?: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          id?: string
          media_url?: string
          scene_order?: number
          scene_prompt?: string
          script_text?: string
          text_overlay?: string
          transition?: string
          user_id?: string
          video_project_id?: string
          visual_description?: string
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
      video_subtitles: {
        Row: {
          created_at: string
          end_time: number
          id: string
          start_time: number
          subtitle_text: string
          user_id: string
          video_project_id: string
        }
        Insert: {
          created_at?: string
          end_time?: number
          id?: string
          start_time?: number
          subtitle_text?: string
          user_id: string
          video_project_id: string
        }
        Update: {
          created_at?: string
          end_time?: number
          id?: string
          start_time?: number
          subtitle_text?: string
          user_id?: string
          video_project_id?: string
        }
        Relationships: []
      }
      video_templates: {
        Row: {
          category: string
          created_at: string
          format: string
          id: string
          name: string
          platform: string
          template_json: Json
        }
        Insert: {
          category?: string
          created_at?: string
          format?: string
          id?: string
          name: string
          platform?: string
          template_json?: Json
        }
        Update: {
          category?: string
          created_at?: string
          format?: string
          id?: string
          name?: string
          platform?: string
          template_json?: Json
        }
        Relationships: []
      }
      workspace_mode: {
        Row: {
          created_at: string
          demo_template: string | null
          mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_template?: string | null
          mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          demo_template?: string | null
          mode?: string
          updated_at?: string
          user_id?: string
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
      is_channel_admin: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      owns_seo_ppc_consultation: {
        Args: { _consultation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
      campaign_folder_status:
        | "draft"
        | "ai_generating"
        | "pending_client_approval"
        | "pending_human_review"
        | "human_review_required"
        | "approved"
        | "scheduled"
        | "active"
        | "completed"
        | "paused"
        | "rejected"
      campaign_folder_type:
        | "social_media"
        | "seo"
        | "ppc"
        | "combined"
        | "human_assisted"
        | "ai_generated"
        | "ai_human_review"
      campaign_source_type: "ai" | "human" | "ai_human_review"
      campaign_status:
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      campaign_type: "seo" | "ppc" | "social_media" | "website" | "branding"
      consultation_type: "ai_only" | "human_requested" | "human_completed"
      human_request_status:
        | "pending"
        | "assigned"
        | "scheduled"
        | "completed"
        | "cancelled"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "won"
        | "lost"
        | "discovery_booked"
      strategy_approval_status:
        | "pending"
        | "approved"
        | "changes_requested"
        | "rejected"
      strategy_status:
        | "intake"
        | "researching"
        | "recommended"
        | "approved"
        | "executing"
        | "executed"
        | "archived"
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
      campaign_folder_status: [
        "draft",
        "ai_generating",
        "pending_client_approval",
        "pending_human_review",
        "human_review_required",
        "approved",
        "scheduled",
        "active",
        "completed",
        "paused",
        "rejected",
      ],
      campaign_folder_type: [
        "social_media",
        "seo",
        "ppc",
        "combined",
        "human_assisted",
        "ai_generated",
        "ai_human_review",
      ],
      campaign_source_type: ["ai", "human", "ai_human_review"],
      campaign_status: [
        "planned",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      campaign_type: ["seo", "ppc", "social_media", "website", "branding"],
      consultation_type: ["ai_only", "human_requested", "human_completed"],
      human_request_status: [
        "pending",
        "assigned",
        "scheduled",
        "completed",
        "cancelled",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "won",
        "lost",
        "discovery_booked",
      ],
      strategy_approval_status: [
        "pending",
        "approved",
        "changes_requested",
        "rejected",
      ],
      strategy_status: [
        "intake",
        "researching",
        "recommended",
        "approved",
        "executing",
        "executed",
        "archived",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "waiting", "done"],
    },
  },
} as const
