export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      budget_entries: {
        Row: {
          amount: number | null;
          category: string | null;
          description: string | null;
          id: string;
          plan_id: string;
        };
        Insert: {
          amount?: number | null;
          category?: string | null;
          description?: string | null;
          id?: string;
          plan_id: string;
        };
        Update: {
          amount?: number | null;
          category?: string | null;
          description?: string | null;
          id?: string;
          plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_entries_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_events: {
        Row: {
          actor_id: string;
          created_at: string;
          event_id: string;
          event_type: string;
          id: string;
          payload: Json;
          plan_id: string;
          version: number;
        };
        Insert: {
          actor_id: string;
          created_at?: string;
          event_id?: string;
          event_type: string;
          id?: string;
          payload: Json;
          plan_id: string;
          version: number;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          event_id?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          plan_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "plan_events_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_members: {
        Row: {
          created_at: string;
          created_by: string | null;
          plan_id: string;
          tier: Database["public"]["Enums"]["plan_member_tier"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          plan_id: string;
          tier?: Database["public"]["Enums"]["plan_member_tier"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          plan_id?: string;
          tier?: Database["public"]["Enums"]["plan_member_tier"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_members_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_members_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_snapshots: {
        Row: {
          plan_id: string;
          state: Json;
          updated_at: string;
          version: number;
        };
        Insert: {
          plan_id: string;
          state?: Json;
          updated_at?: string;
          version?: number;
        };
        Update: {
          plan_id?: string;
          state?: Json;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "plan_snapshots_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: true;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          budget: number | null;
          cover_image: string | null;
          created_at: string;
          destination_country: string | null;
          destination_name: string | null;
          end_date: string | null;
          id: string;
          is_public: boolean;
          latitude: number | null;
          longitude: number | null;
          public_slug: string;
          start_date: string | null;
          title: string | null;
          user_id: string | null;
        };
        Insert: {
          budget?: number | null;
          cover_image?: string | null;
          created_at?: string;
          destination_country?: string | null;
          destination_name?: string | null;
          end_date?: string | null;
          id?: string;
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          public_slug?: string;
          start_date?: string | null;
          title?: string | null;
          user_id?: string | null;
        };
        Update: {
          budget?: number | null;
          cover_image?: string | null;
          created_at?: string;
          destination_country?: string | null;
          destination_name?: string | null;
          end_date?: string | null;
          id?: string;
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          public_slug?: string;
          start_date?: string | null;
          title?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          slug: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          slug: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_plan_member_by_email: {
        Args: {
          _email: string;
          _plan_id: string;
          _tier?: Database["public"]["Enums"]["plan_member_tier"];
        };
        Returns: {
          tier: Database["public"]["Enums"]["plan_member_tier"];
          user_id: string;
        }[];
      };
      append_plan_events: {
        Args: {
          base_version: number;
          events: Json;
          plan_id: string;
          snapshot_state?: Json;
        };
        Returns: Json;
      };
      create_full_plan: {
        Args: {
          _cover_image?: string;
          _dest_country?: string;
          _dest_lat?: number;
          _dest_long?: number;
          _dest_name: string;
          _end_date?: string;
          _start_date?: string;
          _title: string;
          _user_id?: string;
        };
        Returns: {
          result_plan_id: string;
          result_public_slug: string;
        }[];
      };
      get_user_planners: {
        Args: never;
        Returns: {
          cover_image: string;
          created_at: string;
          destination_name: string;
          end_date: string;
          id: string;
          latest_snapshot_at: string;
          public_slug: string;
          start_date: string;
          title: string;
        }[];
      };
      is_plan_admin: { Args: { _plan_id: string }; Returns: boolean };
      is_plan_member: { Args: { _plan_id: string }; Returns: boolean };
      leave_plan: { Args: { _plan_id: string }; Returns: undefined };
      maybe_reset_demo: { Args: never; Returns: boolean };
      plan_admin_count: { Args: { _plan_id: string }; Returns: number };
      remove_plan_member: {
        Args: { _plan_id: string; _user_id: string };
        Returns: undefined;
      };
      update_plan_dates: {
        Args: { _end_date: string; _plan_id: string; _start_date: string };
        Returns: undefined;
      };
      update_plan_member_tier: {
        Args: {
          _plan_id: string;
          _tier: Database["public"]["Enums"]["plan_member_tier"];
          _user_id: string;
        };
        Returns: undefined;
      };
      update_plan_title: {
        Args: { _new_title: string; _plan_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      plan_member_tier: "admin" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      plan_member_tier: ["admin", "member"],
    },
  },
} as const;
