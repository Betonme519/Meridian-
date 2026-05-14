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
      chat_message: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          mode: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          mode?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          mode?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      course: {
        Row: {
          category: string | null
          code: string
          counts_in_gpa: boolean
          created_at: string
          credits: number | null
          grade_letter: string | null
          grade_point: number | null
          id: string
          instructor: string | null
          name: string
          notes: string | null
          semester: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          code: string
          counts_in_gpa?: boolean
          created_at?: string
          credits?: number | null
          grade_letter?: string | null
          grade_point?: number | null
          id?: string
          instructor?: string | null
          name: string
          notes?: string | null
          semester?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          code?: string
          counts_in_gpa?: boolean
          created_at?: string
          credits?: number | null
          grade_letter?: string | null
          grade_point?: number | null
          id?: string
          instructor?: string | null
          name?: string
          notes?: string | null
          semester?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan: {
        Row: {
          created_at: string
          edges: Json
          goal_mode: string | null
          id: string
          is_archived: boolean
          name: string
          nodes: Json
          updated_at: string
          user_id: string
          viewport: Json | null
        }
        Insert: {
          created_at?: string
          edges?: Json
          goal_mode?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          nodes?: Json
          updated_at?: string
          user_id: string
          viewport?: Json | null
        }
        Update: {
          created_at?: string
          edges?: Json
          goal_mode?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          nodes?: Json
          updated_at?: string
          user_id?: string
          viewport?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          goal_mode: string | null
          goal_weights: Json
          grade: number | null
          id: string
          major: string | null
          name: string | null
          school: string | null
          target_gpa: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_mode?: string | null
          goal_weights?: Json
          grade?: number | null
          id: string
          major?: string | null
          name?: string | null
          school?: string | null
          target_gpa?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_mode?: string | null
          goal_weights?: Json
          grade?: number | null
          id?: string
          major?: string | null
          name?: string | null
          school?: string | null
          target_gpa?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rag_source: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime: string | null
          name: string
          parse_error: string | null
          parsed_at: string | null
          parsed_status: string
          parsed_text: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          mime?: string | null
          name: string
          parse_error?: string | null
          parsed_at?: string | null
          parsed_status?: string
          parsed_text?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime?: string | null
          name?: string
          parse_error?: string | null
          parsed_at?: string | null
          parsed_status?: string
          parsed_text?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rule: {
        Row: {
          body: string | null
          branch: string
          created_at: string
          id: string
          rag_source_id: string | null
          source: string | null
          source_page: string | null
          title: string
          trust: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          branch: string
          created_at?: string
          id?: string
          rag_source_id?: string | null
          source?: string | null
          source_page?: string | null
          title: string
          trust?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          branch?: string
          created_at?: string
          id?: string
          rag_source_id?: string | null
          source?: string | null
          source_page?: string | null
          title?: string
          trust?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_rag_source_id_fkey"
            columns: ["rag_source_id"]
            isOneToOne: false
            referencedRelation: "rag_source"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_conflict: {
        Row: {
          confidence: string | null
          created_at: string
          id: string
          judgement: string | null
          resolved_by: string | null
          rule_a_id: string
          rule_b_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          id?: string
          judgement?: string | null
          resolved_by?: string | null
          rule_a_id: string
          rule_b_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string | null
          created_at?: string
          id?: string
          judgement?: string | null
          resolved_by?: string | null
          rule_a_id?: string
          rule_b_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_conflict_rule_a_id_fkey"
            columns: ["rule_a_id"]
            isOneToOne: false
            referencedRelation: "rule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_conflict_rule_b_id_fkey"
            columns: ["rule_b_id"]
            isOneToOne: false
            referencedRelation: "rule"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
