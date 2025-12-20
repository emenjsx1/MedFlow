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
      appointments: {
        Row: {
          calendar_event_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          last_contact_at: string | null
          notes: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          professional_name: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          calendar_event_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          professional_name?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          calendar_event_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          professional_name?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      patients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          risk_score: number | null
          tenant_id: string
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          risk_score?: number | null
          tenant_id: string
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          risk_score?: number | null
          tenant_id?: string
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
      tenant_settings: {
        Row: {
          agent_booking_confirmation: string | null
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
          google_access_token: string | null
          google_calendar_connected: boolean | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          max_attempts: number | null
          min_hours_for_replacement: number | null
          openai_api_key: string | null
          reconfirm_hours_before: number | null
          reconfirmation_template: string | null
          response_window_hours: number | null
          tenant_id: string
          updated_at: string | null
          use_custom_openai: boolean | null
          waitlist_offer_template: string | null
          whatsapp_connected: boolean | null
          whatsapp_session_id: string | null
          working_days: string[] | null
        }
        Insert: {
          agent_booking_confirmation?: string | null
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
          google_access_token?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          max_attempts?: number | null
          min_hours_for_replacement?: number | null
          openai_api_key?: string | null
          reconfirm_hours_before?: number | null
          reconfirmation_template?: string | null
          response_window_hours?: number | null
          tenant_id: string
          updated_at?: string | null
          use_custom_openai?: boolean | null
          waitlist_offer_template?: string | null
          whatsapp_connected?: boolean | null
          whatsapp_session_id?: string | null
          working_days?: string[] | null
        }
        Update: {
          agent_booking_confirmation?: string | null
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
          google_access_token?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          max_attempts?: number | null
          min_hours_for_replacement?: number | null
          openai_api_key?: string | null
          reconfirm_hours_before?: number | null
          reconfirmation_template?: string | null
          response_window_hours?: number | null
          tenant_id?: string
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
          created_at: string | null
          id: string
          name: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
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
