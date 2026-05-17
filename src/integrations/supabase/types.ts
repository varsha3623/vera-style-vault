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
      outfit_feedback: {
        Row: {
          created_at: string
          id: string
          liked: boolean
          note: string | null
          outfit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked: boolean
          note?: string | null
          outfit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked?: boolean
          note?: string | null
          outfit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_feedback_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          collage_url: string | null
          color_harmony: string | null
          confidence: number | null
          created_at: string
          id: string
          item_ids: string[]
          mood: string | null
          occasion: string | null
          reasoning: string | null
          saved: boolean
          suggested_accessories: string[]
          title: string
          user_id: string
          weather: Json | null
          worn: boolean
          worn_at: string | null
        }
        Insert: {
          collage_url?: string | null
          color_harmony?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          item_ids?: string[]
          mood?: string | null
          occasion?: string | null
          reasoning?: string | null
          saved?: boolean
          suggested_accessories?: string[]
          title: string
          user_id: string
          weather?: Json | null
          worn?: boolean
          worn_at?: string | null
        }
        Update: {
          collage_url?: string | null
          color_harmony?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          item_ids?: string[]
          mood?: string | null
          occasion?: string | null
          reasoning?: string | null
          saved?: boolean
          suggested_accessories?: string[]
          title?: string
          user_id?: string
          weather?: Json | null
          worn?: boolean
          worn_at?: string | null
        }
        Relationships: []
      }
      preferences: {
        Row: {
          extra: Json
          lifestyle: string | null
          location: string | null
          short_outfits_allowed: boolean
          sleeveless_allowed: boolean
          style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          extra?: Json
          lifestyle?: string | null
          location?: string | null
          short_outfits_allowed?: boolean
          sleeveless_allowed?: boolean
          style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          extra?: Json
          lifestyle?: string | null
          location?: string | null
          short_outfits_allowed?: boolean
          sleeveless_allowed?: boolean
          style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          aesthetic: string | null
          ai_analyzed: boolean
          ai_description: string | null
          category: string | null
          colors: string[]
          created_at: string
          gender: string | null
          id: string
          image_url: string
          is_favorite: boolean
          last_worn_at: string | null
          name: string | null
          occasions: string[]
          pattern: string | null
          primary_color: string | null
          seasons: string[]
          style: string | null
          subcategory: string | null
          user_id: string
          worn_count: number
        }
        Insert: {
          aesthetic?: string | null
          ai_analyzed?: boolean
          ai_description?: string | null
          category?: string | null
          colors?: string[]
          created_at?: string
          gender?: string | null
          id?: string
          image_url: string
          is_favorite?: boolean
          last_worn_at?: string | null
          name?: string | null
          occasions?: string[]
          pattern?: string | null
          primary_color?: string | null
          seasons?: string[]
          style?: string | null
          subcategory?: string | null
          user_id: string
          worn_count?: number
        }
        Update: {
          aesthetic?: string | null
          ai_analyzed?: boolean
          ai_description?: string | null
          category?: string | null
          colors?: string[]
          created_at?: string
          gender?: string | null
          id?: string
          image_url?: string
          is_favorite?: boolean
          last_worn_at?: string | null
          name?: string | null
          occasions?: string[]
          pattern?: string | null
          primary_color?: string | null
          seasons?: string[]
          style?: string | null
          subcategory?: string | null
          user_id?: string
          worn_count?: number
        }
        Relationships: []
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
