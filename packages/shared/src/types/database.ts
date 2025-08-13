export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          query?: string
          operationName?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_analysis_log: {
        Row: {
          analysis_result: Json
          confidence_score: number | null
          created_at: string | null
          error_message: string | null
          id: string
          method: string
          processing_time_ms: number | null
          success: boolean | null
          visit_id: string
        }
        Insert: {
          analysis_result: Json
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          method: string
          processing_time_ms?: number | null
          success?: boolean | null
          visit_id: string
        }
        Update: {
          analysis_result?: Json
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          method?: string
          processing_time_ms?: number | null
          success?: boolean | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_log_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_predictions: {
        Row: {
          actual_outcome_date: string | null
          actual_purchased: boolean | null
          actual_satisfaction_score: number | null
          confidence_score: number
          created_at: string | null
          id: string
          outcome_variance: number | null
          predicted_priority_ranking: number
          predicted_purchase_probability: number
          predicted_sentiment_score: number
          prediction_accuracy: number | null
          prediction_method: string
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          actual_outcome_date?: string | null
          actual_purchased?: boolean | null
          actual_satisfaction_score?: number | null
          confidence_score: number
          created_at?: string | null
          id?: string
          outcome_variance?: number | null
          predicted_priority_ranking: number
          predicted_purchase_probability: number
          predicted_sentiment_score: number
          prediction_accuracy?: number | null
          prediction_method: string
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          actual_outcome_date?: string | null
          actual_purchased?: boolean | null
          actual_satisfaction_score?: number | null
          confidence_score?: number
          created_at?: string | null
          id?: string
          outcome_variance?: number | null
          predicted_priority_ranking?: number
          predicted_purchase_probability?: number
          predicted_sentiment_score?: number
          prediction_accuracy?: number | null
          prediction_method?: string
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      consultants: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          id: string
          name: string
          performance_metrics: Json | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          performance_metrics?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          performance_metrics?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          language_preference: string | null
          name: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          language_preference?: string | null
          name: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          language_preference?: string | null
          name?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      interactions: {
        Row: {
          consultant_id: string
          content: string | null
          created_at: string | null
          id: string
          outcome: string | null
          scheduled_follow_up: string | null
          type: string
          visit_id: string
        }
        Insert: {
          consultant_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          outcome?: string | null
          scheduled_follow_up?: string | null
          type: string
          visit_id: string
        }
        Update: {
          consultant_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          outcome?: string | null
          scheduled_follow_up?: string | null
          type?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      message_status: {
        Row: {
          channel: string
          cost: number | null
          created_at: string | null
          customer_id: string
          error_message: string | null
          id: string
          interaction_id: string | null
          message_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          cost?: number | null
          created_at?: string | null
          customer_id: string
          error_message?: string | null
          id?: string
          interaction_id?: string | null
          message_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          cost?: number | null
          created_at?: string | null
          customer_id?: string
          error_message?: string | null
          id?: string
          interaction_id?: string | null
          message_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_status_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_status_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          ai_analysis: Json | null
          ai_priority_ranking: number | null
          ai_purchase_probability: number | null
          ai_sentiment_score: number | null
          budget_range: string | null
          consultant_id: string
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          purchase_timeline: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          vehicle_interest: Json
          visit_date: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_priority_ranking?: number | null
          ai_purchase_probability?: number | null
          ai_sentiment_score?: number | null
          budget_range?: string | null
          consultant_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          purchase_timeline?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_interest: Json
          visit_date?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_priority_ranking?: number | null
          ai_purchase_probability?: number | null
          ai_sentiment_score?: number | null
          budget_range?: string | null
          consultant_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          purchase_timeline?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_interest?: Json
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_performance_metrics: {
        Row: {
          analysis_date: string | null
          avg_confidence_score: number | null
          avg_processing_time_ms: number | null
          method: string | null
          success_rate: number | null
          successful_analyses: number | null
          total_analyses: number | null
        }
        Relationships: []
      }
      ai_prediction_accuracy: {
        Row: {
          avg_accuracy: number | null
          avg_confidence: number | null
          avg_variance: number | null
          completed_predictions: number | null
          precision_high_probability: number | null
          prediction_method: string | null
          prediction_week: string | null
          recall_rate: number | null
          total_predictions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_manager_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

