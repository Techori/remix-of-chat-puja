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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          admin_notes: string
          created_at: string
          email: string
          id: string
          industry: string
          message: string
          name: string
          phone: string
          service: string
          status: string
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          email: string
          id?: string
          industry?: string
          message?: string
          name: string
          phone?: string
          service?: string
          status?: string
        }
        Update: {
          admin_notes?: string
          created_at?: string
          email?: string
          id?: string
          industry?: string
          message?: string
          name?: string
          phone?: string
          service?: string
          status?: string
        }
        Relationships: []
      }
      country_logos: {
        Row: {
          country: string
          file_path: string
          theme: string
          updated_at: string
        }
        Insert: {
          country: string
          file_path: string
          theme: string
          updated_at?: string
        }
        Update: {
          country?: string
          file_path?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_programme_fees: {
        Row: {
          amount: number | null
          country: string
          currency: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          country: string
          currency: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          country?: string
          currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_reports: {
        Row: {
          active: boolean
          category: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          publish_date: string
          report_number: string
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          publish_date: string
          report_number: string
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          publish_date?: string
          report_number?: string
          title?: string
        }
        Relationships: []
      }
      employee_verification_attempts: {
        Row: {
          created_at: string
          employee_id: string
          id: number
          success: boolean
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: never
          success: boolean
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: never
          success?: boolean
        }
        Relationships: []
      }
      employees: {
        Row: {
          code_hash: string
          created_at: string
          department: string
          designation: string
          employee_id: string
          full_name: string
          id: string
          photo_url: string | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          department?: string
          designation?: string
          employee_id: string
          full_name: string
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          department?: string
          designation?: string
          employee_id?: string
          full_name?: string
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      form_submission_limits: {
        Row: {
          attempts: number
          key_hash: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          key_hash: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          key_hash?: string
          window_started_at?: string
        }
        Relationships: []
      }
      people_profiles: {
        Row: {
          bio: string
          created_at: string
          focus: string[]
          id: string
          location: string
          name: string
          person_group: string
          photo_url: string | null
          role: string
          slug: string
          sort_order: number
          source_application_id: string | null
          summary: string
        }
        Insert: {
          bio?: string
          created_at?: string
          focus?: string[]
          id?: string
          location?: string
          name: string
          person_group: string
          photo_url?: string | null
          role?: string
          slug: string
          sort_order?: number
          source_application_id?: string | null
          summary?: string
        }
        Update: {
          bio?: string
          created_at?: string
          focus?: string[]
          id?: string
          location?: string
          name?: string
          person_group?: string
          photo_url?: string | null
          role?: string
          slug?: string
          sort_order?: number
          source_application_id?: string | null
          summary?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          display_name: string
          id: string
          preferences: Json
        }
        Insert: {
          avatar_url?: string
          display_name?: string
          id: string
          preferences?: Json
        }
        Update: {
          avatar_url?: string
          display_name?: string
          id?: string
          preferences?: Json
        }
        Relationships: []
      }
      programme_payments: {
        Row: {
          amount_paise: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payer_email: string
          payer_name: string
          payer_phone: string
          programme: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payer_email: string
          payer_name: string
          payer_phone?: string
          programme?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payer_email?: string
          payer_name?: string
          payer_phone?: string
          programme?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: string
        }
        Relationships: []
      }
      prototype_ai_access_state: {
        Row: {
          blocked_at: string
          message: string
          model_id: string
          status_code: number
        }
        Insert: {
          blocked_at?: string
          message?: string
          model_id: string
          status_code: number
        }
        Update: {
          blocked_at?: string
          message?: string
          model_id?: string
          status_code?: number
        }
        Relationships: []
      }
      prototype_submissions: {
        Row: {
          ai_output: string
          created_at: string
          eligibility_context: string
          funding_goal: string
          id: string
          idea: string
          prototype: string
        }
        Insert: {
          ai_output?: string
          created_at?: string
          eligibility_context?: string
          funding_goal?: string
          id?: string
          idea: string
          prototype: string
        }
        Update: {
          ai_output?: string
          created_at?: string
          eligibility_context?: string
          funding_goal?: string
          id?: string
          idea?: string
          prototype?: string
        }
        Relationships: []
      }
      registration_applications: {
        Row: {
          admin_notes: string
          application_code: string
          category: string
          created_at: string
          details: Json
          document_name: string | null
          document_path: string | null
          email: string
          full_name: string
          id: string
          phone: string
          status: string
        }
        Insert: {
          admin_notes?: string
          application_code: string
          category: string
          created_at?: string
          details?: Json
          document_name?: string | null
          document_path?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string
          status?: string
        }
        Update: {
          admin_notes?: string
          application_code?: string
          category?: string
          created_at?: string
          details?: Json
          document_name?: string | null
          document_path?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          status?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      young_innovators_registrations: {
        Row: {
          application_code: string
          city: string
          consent_at: string
          created_at: string
          fee_amount: number
          gst_percent: number
          guardian_consent: boolean
          guardian_email: string
          guardian_name: string
          guardian_phone: string
          id: string
          idea: string
          idea_title: string
          school_class: number
          status: string
          student_name: string
        }
        Insert: {
          application_code: string
          city: string
          consent_at?: string
          created_at?: string
          fee_amount: number
          gst_percent?: number
          guardian_consent: boolean
          guardian_email: string
          guardian_name: string
          guardian_phone: string
          id?: string
          idea: string
          idea_title: string
          school_class: number
          status?: string
          student_name: string
        }
        Update: {
          application_code?: string
          city?: string
          consent_at?: string
          created_at?: string
          fee_amount?: number
          gst_percent?: number
          guardian_consent?: boolean
          guardian_email?: string
          guardian_name?: string
          guardian_phone?: string
          id?: string
          idea?: string
          idea_title?: string
          school_class?: number
          status?: string
          student_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_import_records: {
        Args: { _rows: Json; _table: string }
        Returns: Json
      }
      admin_save_employee: {
        Args: {
          _code: string
          _department: string
          _designation: string
          _employee_id: string
          _full_name: string
          _photo_url: string
          _status: string
          _valid_until: string
        }
        Returns: undefined
      }
      admin_setup_metadata: { Args: never; Returns: Json }
      claim_first_admin: { Args: never; Returns: boolean }
      consume_form_submission_limit: {
        Args: { _key_hash: string }
        Returns: boolean
      }
      first_admin_setup_status: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_employee: {
        Args: { _code: string; _employee_id: string }
        Returns: {
          department: string
          designation: string
          employee_id: string
          full_name: string
          photo_url: string
          status: string
          valid_until: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
