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
      availability_blocks: {
        Row: {
          block_date: string
          created_at: string
          end_time: string | null
          id: string
          reason: string
          start_time: string | null
          workspace_id: string
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          reason?: string
          start_time?: string | null
          workspace_id?: string
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          reason?: string
          start_time?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          adult_present: boolean
          at_risk: boolean
          created_at: string
          customer_confirmed_at: string | null
          customer_id: string
          deposit_forfeited: boolean
          deposit_php: number
          deposit_reference: string | null
          duration_minutes: number
          end_time: string
          id: string
          items: Json
          manage_token: string
          notes: string
          reference: string
          service_date: string
          slot: unknown
          start_time: string
          status: string
          total_php: number
          workspace_id: string
          zone_id: string
        }
        Insert: {
          adult_present?: boolean
          at_risk?: boolean
          created_at?: string
          customer_confirmed_at?: string | null
          customer_id: string
          deposit_forfeited?: boolean
          deposit_php?: number
          deposit_reference?: string | null
          duration_minutes: number
          end_time: string
          id?: string
          items?: Json
          manage_token?: string
          notes?: string
          reference?: string
          service_date: string
          slot?: unknown
          start_time: string
          status?: string
          total_php: number
          workspace_id?: string
          zone_id: string
        }
        Update: {
          adult_present?: boolean
          at_risk?: boolean
          created_at?: string
          customer_confirmed_at?: string | null
          customer_id?: string
          deposit_forfeited?: boolean
          deposit_php?: number
          deposit_reference?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          items?: Json
          manage_token?: string
          notes?: string
          reference?: string
          service_date?: string
          slot?: unknown
          start_time?: string
          status?: string
          total_php?: number
          workspace_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          sent_by: string
          workspace_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          sent_by?: string
          workspace_id?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          sent_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booked_at: string | null
          booking_reference: string | null
          channel: string
          created_at: string
          customer_name: string
          draft_reply: string | null
          extracted: Json
          id: string
          language: string | null
          last_message_at: string
          lead_token: string
          link_opened_at: string | null
          status: string
          suggested_slots: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          booked_at?: string | null
          booking_reference?: string | null
          channel?: string
          created_at?: string
          customer_name?: string
          draft_reply?: string | null
          extracted?: Json
          id?: string
          language?: string | null
          last_message_at?: string
          lead_token?: string
          link_opened_at?: string | null
          status?: string
          suggested_slots?: Json
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          booked_at?: string | null
          booking_reference?: string | null
          channel?: string
          created_at?: string
          customer_name?: string
          draft_reply?: string | null
          extracted?: Json
          id?: string
          language?: string | null
          last_message_at?: string
          lead_token?: string
          link_opened_at?: string | null
          status?: string
          suggested_slots?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          access_notes: string
          address: string
          created_at: string
          full_name: string
          id: string
          landmark: string
          mobile: string
          workspace_id: string
          zone_id: string | null
        }
        Insert: {
          access_notes?: string
          address: string
          created_at?: string
          full_name: string
          id?: string
          landmark?: string
          mobile: string
          workspace_id?: string
          zone_id?: string | null
        }
        Update: {
          access_notes?: string
          address?: string
          created_at?: string
          full_name?: string
          id?: string
          landmark?: string
          mobile?: string
          workspace_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox_messages: {
        Row: {
          action_url: string | null
          body: string
          booking_id: string | null
          channel: string
          conversation_id: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          recipient: string
          recipient_name: string
          sim_time: string
          status: string
          waitlist_id: string | null
          workspace_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          booking_id?: string | null
          channel?: string
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind: string
          recipient: string
          recipient_name?: string
          sim_time?: string
          status?: string
          waitlist_id?: string | null
          workspace_id?: string
        }
        Update: {
          action_url?: string | null
          body?: string
          booking_id?: string | null
          channel?: string
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          recipient?: string
          recipient_name?: string
          sim_time?: string
          status?: string
          waitlist_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbox_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbox_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          description: string
          duration_minutes: number
          id: string
          name: string
          per_unit: boolean
          price_php: number
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          description?: string
          duration_minutes: number
          id?: string
          name: string
          per_unit?: boolean
          price_php: number
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          description?: string
          duration_minutes?: number
          id?: string
          name?: string
          per_unit?: boolean
          price_php?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          auto_reply: boolean
          automations: Json
          demo_seeded_on: string | null
          deposit_php: number
          id: number
          lunch_end: string
          lunch_start: string
          max_minutes_per_day: number
          peak_mode: boolean
          sim_offset_minutes: number
          work_days: number[]
          work_end: string
          work_start: string
          workspace_id: string
        }
        Insert: {
          auto_reply?: boolean
          automations?: Json
          demo_seeded_on?: string | null
          deposit_php?: number
          id?: number
          lunch_end?: string
          lunch_start?: string
          max_minutes_per_day?: number
          peak_mode?: boolean
          sim_offset_minutes?: number
          work_days?: number[]
          work_end?: string
          work_start?: string
          workspace_id?: string
        }
        Update: {
          auto_reply?: boolean
          automations?: Json
          demo_seeded_on?: string | null
          deposit_php?: number
          id?: number
          lunch_end?: string
          lunch_start?: string
          max_minutes_per_day?: number
          peak_mode?: boolean
          sim_offset_minutes?: number
          work_days?: number[]
          work_end?: string
          work_start?: string
          workspace_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          full_name: string
          id: string
          mobile: string
          offered_at: string | null
          service_slug: string | null
          status: string
          token: string
          units: number
          workspace_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          mobile: string
          offered_at?: string | null
          service_slug?: string | null
          status?: string
          token?: string
          units?: number
          workspace_id?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          mobile?: string
          offered_at?: string | null
          service_slug?: string | null
          status?: string
          token?: string
          units?: number
          workspace_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          barangays: string[]
          color: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          barangays?: string[]
          color?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          barangays?: string[]
          color?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_workspace_id: { Args: { _user_id?: string }; Returns: string }
      demo_workspace_id: { Args: never; Returns: string }
      ensure_demo_fresh: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      live_workspace_id: { Args: never; Returns: string }
      reset_my_demo_workspace: { Args: never; Returns: boolean }
      seed_demo_workspace: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "owner" | "demo"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner", "demo"],
    },
  },
} as const
