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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          agent_paused: boolean | null
          agent_paused_at: string | null
          agent_reactivate_at: string | null
          appointment_id: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          messages_count: number | null
          outcome: string | null
          patient_id: string | null
          patient_phone: string
          paused_by_user_id: string | null
          started_at: string
          tenant_id: string
        }
        Insert: {
          agent_paused?: boolean | null
          agent_paused_at?: string | null
          agent_reactivate_at?: string | null
          appointment_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          messages_count?: number | null
          outcome?: string | null
          patient_id?: string | null
          patient_phone: string
          paused_by_user_id?: string | null
          started_at?: string
          tenant_id: string
        }
        Update: {
          agent_paused?: boolean | null
          agent_paused_at?: string | null
          agent_reactivate_at?: string | null
          appointment_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          messages_count?: number | null
          outcome?: string | null
          patient_id?: string | null
          patient_phone?: string
          paused_by_user_id?: string | null
          started_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          auto_noshow_at: string | null
          calendar_event_id: string | null
          checked_in_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_recurring: boolean | null
          last_contact_at: string | null
          notes: string | null
          parent_appointment_id: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          professional_id: string | null
          professional_name: string | null
          recurrence_end_date: string | null
          recurrence_rule: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_noshow_at?: string | null
          calendar_event_id?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          last_contact_at?: string | null
          notes?: string | null
          parent_appointment_id?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          professional_id?: string | null
          professional_name?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_noshow_at?: string | null
          calendar_event_id?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          last_contact_at?: string | null
          notes?: string | null
          parent_appointment_id?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          professional_id?: string | null
          professional_name?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_parent_appointment_id_fkey"
            columns: ["parent_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          patient_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          patient_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          patient_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audio_url: string | null
          created_at: string
          failed_count: number | null
          id: string
          image_url: string | null
          message: string | null
          name: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          tenant_id: string
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          image_url?: string | null
          message?: string | null
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          tenant_id: string
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          image_url?: string | null
          message?: string | null
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          tenant_id?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          created_at: string | null
          evolution_api_key: string | null
          evolution_api_url: string | null
          google_client_id: string | null
          google_client_secret: string | null
          id: string
          lovable_api_key: string | null
          resend_api_key: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          google_client_id?: string | null
          google_client_secret?: string | null
          id?: string
          lovable_api_key?: string | null
          resend_api_key?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          google_client_id?: string | null
          google_client_secret?: string | null
          id?: string
          lovable_api_key?: string | null
          resend_api_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          appointment_id: string | null
          body: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          patient_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          tenant_id: string
        }
        Insert: {
          appointment_id?: string | null
          body: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          patient_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          tenant_id: string
        }
        Update: {
          appointment_id?: string | null
          body?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          patient_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          note_type: string
          patient_id: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          patient_id: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          patient_id?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          assigned_to_user_id: string | null
          created_at: string | null
          email: string | null
          id: string
          last_interaction_at: string | null
          name: string
          notes: string | null
          pipeline_stage: string | null
          priority: number | null
          risk_score: number | null
          source: string | null
          status: string | null
          tags: string[] | null
          tenant_id: string
          total_appointments: number | null
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          name: string
          notes?: string | null
          pipeline_stage?: string | null
          priority?: number | null
          risk_score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id: string
          total_appointments?: number | null
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          assigned_to_user_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          name?: string
          notes?: string | null
          pipeline_stage?: string | null
          priority?: number | null
          risk_score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string
          total_appointments?: number | null
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          appointment_duration_minutes: number | null
          business_hours_end: string | null
          business_hours_start: string | null
          created_at: string | null
          google_calendar_id: string | null
          id: string
          is_active: boolean | null
          name: string
          specialty: string | null
          tenant_id: string
          updated_at: string | null
          working_days: string[] | null
        }
        Insert: {
          appointment_duration_minutes?: number | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          created_at?: string | null
          google_calendar_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specialty?: string | null
          tenant_id: string
          updated_at?: string | null
          working_days?: string[] | null
        }
        Update: {
          appointment_duration_minutes?: number | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          created_at?: string | null
          google_calendar_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specialty?: string | null
          tenant_id?: string
          updated_at?: string | null
          working_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      takeover_history: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          messages_during_takeover: number | null
          notes: string | null
          outcome: string | null
          patient_id: string | null
          patient_phone: string
          started_at: string
          started_by_user_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          messages_during_takeover?: number | null
          notes?: string | null
          outcome?: string | null
          patient_id?: string | null
          patient_phone: string
          started_at?: string
          started_by_user_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          messages_during_takeover?: number | null
          notes?: string | null
          outcome?: string | null
          patient_id?: string | null
          patient_phone?: string
          started_at?: string
          started_by_user_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "takeover_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeover_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_secrets: {
        Row: {
          created_at: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          openai_api_key: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          openai_api_key?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          openai_api_key?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_secrets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          agent_booking_confirmation: string | null
          agent_business_context: string | null
          agent_faqs: Json | null
          agent_greeting_message: string | null
          appointment_duration_minutes: number | null
          business_hours_end: string | null
          business_hours_start: string | null
          cancellation_template: string | null
          clinic_address: string | null
          clinic_name: string | null
          clinic_phone: string | null
          confirm_hours_before: number | null
          confirmation_template: string | null
          created_at: string | null
          followup_days_threshold: number | null
          followup_enabled: boolean | null
          followup_message_template: string | null
          google_calendar_connected: boolean | null
          google_calendar_id: string | null
          id: string
          max_attempts: number | null
          min_hours_for_replacement: number | null
          notification_emails: string[] | null
          notify_owner_on_booking: boolean | null
          reconfirm_hours_before: number | null
          reconfirmation_template: string | null
          response_window_hours: number | null
          takeover_alert_browser_notification: boolean | null
          takeover_alert_email: boolean | null
          takeover_alert_sound: boolean | null
          tenant_id: string
          timezone: string | null
          updated_at: string | null
          use_custom_openai: boolean | null
          waitlist_offer_template: string | null
          whatsapp_connected: boolean | null
          whatsapp_session_id: string | null
          working_days: string[] | null
        }
        Insert: {
          agent_booking_confirmation?: string | null
          agent_business_context?: string | null
          agent_faqs?: Json | null
          agent_greeting_message?: string | null
          appointment_duration_minutes?: number | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          cancellation_template?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          confirm_hours_before?: number | null
          confirmation_template?: string | null
          created_at?: string | null
          followup_days_threshold?: number | null
          followup_enabled?: boolean | null
          followup_message_template?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_id?: string | null
          id?: string
          max_attempts?: number | null
          min_hours_for_replacement?: number | null
          notification_emails?: string[] | null
          notify_owner_on_booking?: boolean | null
          reconfirm_hours_before?: number | null
          reconfirmation_template?: string | null
          response_window_hours?: number | null
          takeover_alert_browser_notification?: boolean | null
          takeover_alert_email?: boolean | null
          takeover_alert_sound?: boolean | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
          use_custom_openai?: boolean | null
          waitlist_offer_template?: string | null
          whatsapp_connected?: boolean | null
          whatsapp_session_id?: string | null
          working_days?: string[] | null
        }
        Update: {
          agent_booking_confirmation?: string | null
          agent_business_context?: string | null
          agent_faqs?: Json | null
          agent_greeting_message?: string | null
          appointment_duration_minutes?: number | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          cancellation_template?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          confirm_hours_before?: number | null
          confirmation_template?: string | null
          created_at?: string | null
          followup_days_threshold?: number | null
          followup_enabled?: boolean | null
          followup_message_template?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_id?: string | null
          id?: string
          max_attempts?: number | null
          min_hours_for_replacement?: number | null
          notification_emails?: string[] | null
          notify_owner_on_booking?: boolean | null
          reconfirm_hours_before?: number | null
          reconfirmation_template?: string | null
          response_window_hours?: number | null
          takeover_alert_browser_notification?: boolean | null
          takeover_alert_email?: boolean | null
          takeover_alert_sound?: boolean | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
          use_custom_openai?: boolean | null
          waitlist_offer_template?: string | null
          whatsapp_connected?: boolean | null
          whatsapp_session_id?: string | null
          working_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string | null
          id: string
          name: string
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          timezone: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          id?: string
          name: string
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          id?: string
          name?: string
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          tenant_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          tenant_id: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          patient_id: string
          preferred_date: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          priority: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          patient_id: string
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          patient_id?: string
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_patient_risk: {
        Args: { p_patient_id: string }
        Returns: Database["public"]["Enums"]["risk_level"]
      }
      check_agent_reactivation: { Args: never; Returns: undefined }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_subscription: { Args: { _tenant_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_trial_expired: { Args: { _tenant_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "super_admin"
      appointment_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
        | "in_replacement"
        | "filled"
      integration_status: "connected" | "disconnected" | "expired"
      message_direction: "outbound" | "inbound"
      message_status: "sent" | "delivered" | "read" | "failed"
      risk_level: "low" | "medium" | "high"
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
      app_role: ["admin", "staff", "super_admin"],
      appointment_status: [
        "pending",
        "confirmed",
        "cancelled",
        "no_show",
        "rescheduled",
        "in_replacement",
        "filled",
      ],
      integration_status: ["connected", "disconnected", "expired"],
      message_direction: ["outbound", "inbound"],
      message_status: ["sent", "delivered", "read", "failed"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
