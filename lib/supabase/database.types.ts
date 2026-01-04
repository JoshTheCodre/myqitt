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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          assignments_data: Json
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignments_data?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignments_data?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      catchups: {
        Row: {
          content_md: string | null
          created_at: string | null
          cta: Json | null
          department: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          items: Json | null
          level: number | null
          school: string | null
          semester: string | null
          summary: string | null
          targets: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          content_md?: string | null
          created_at?: string | null
          cta?: Json | null
          department?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          level?: number | null
          school?: string | null
          semester?: string | null
          summary?: string | null
          targets?: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          content_md?: string | null
          created_at?: string | null
          cta?: Json | null
          department?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          level?: number | null
          school?: string | null
          semester?: string | null
          summary?: string | null
          targets?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catchups_school_fkey"
            columns: ["school"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connection_type: string
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          connection_type?: string
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          course_data: Json | null
          created_at: string | null
          department: string
          description: string | null
          id: string
          school: string
          updated_at: string | null
        }
        Insert: {
          course_data?: Json | null
          created_at?: string | null
          department: string
          description?: string | null
          id?: string
          school: string
          updated_at?: string | null
        }
        Update: {
          course_data?: Json | null
          created_at?: string | null
          department?: string
          description?: string | null
          id?: string
          school?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_fkey"
            columns: ["school"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_tokens: {
        Row: {
          created_at: string | null
          device_type: string | null
          fcm_token: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          fcm_token: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          fcm_token?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          created_at: string | null
          day: string
          id: string
          timetable_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day?: string
          id?: string
          timetable_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day?: string
          id?: string
          timetable_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      todays_classes: {
        Row: {
          course_code: string
          course_title: string | null
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_cancelled: boolean | null
          location: string
          notes: string | null
          start_time: string
          timetable_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_code: string
          course_title?: string | null
          created_at?: string | null
          date?: string
          end_time: string
          id?: string
          is_cancelled?: boolean | null
          location: string
          notes?: string | null
          start_time: string
          timetable_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_code?: string
          course_title?: string | null
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_cancelled?: boolean | null
          location?: string
          notes?: string | null
          start_time?: string
          timetable_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todays_classes_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetable"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          course_rep_id: string | null
          created_at: string | null
          department: string | null
          email: string
          followers_count: number | null
          id: string
          invite_code: string | null
          level: number | null
          name: string | null
          phone_number: string | null
          roles: string[] | null
          school: string | null
          semester: string | null
          session: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          course_rep_id?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          followers_count?: number | null
          id?: string
          invite_code?: string | null
          level?: number | null
          name?: string | null
          phone_number?: string | null
          roles?: string[] | null
          school?: string | null
          semester?: string | null
          session?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          course_rep_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          followers_count?: number | null
          id?: string
          invite_code?: string | null
          level?: number | null
          name?: string | null
          phone_number?: string | null
          roles?: string[] | null
          school?: string | null
          semester?: string | null
          session?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_course_rep_id_fkey"
            columns: ["course_rep_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_school_fkey"
            columns: ["school"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_session: { Args: { user_level: number }; Returns: string }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      cleanup_old_todays_classes: { Args: never; Returns: undefined }
      decrement_followers_count: {
        Args: { user_id: string }
        Returns: undefined
      }
      generate_invite_code: { Args: never; Returns: string }
      increment_followers_count: {
        Args: { user_id: string }
        Returns: undefined
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
  public: {
    Enums: {},
  },
} as const
