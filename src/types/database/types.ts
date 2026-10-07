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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      athlete_game_stats: {
        Row: {
          athlete_id: string
          created_at: string
          fixture_id: string
          flags_pulled: number
          id: string
          interceptions: number
          passing_touchdowns: number
          receptions: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string
          submitted_by: string | null
          team_id: string
          touchdowns: number
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          athlete_id: string
          created_at?: string
          fixture_id: string
          flags_pulled?: number
          id?: string
          interceptions?: number
          passing_touchdowns?: number
          receptions?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          submitted_by?: string | null
          team_id: string
          touchdowns?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          athlete_id?: string
          created_at?: string
          fixture_id?: string
          flags_pulled?: number
          id?: string
          interceptions?: number
          passing_touchdowns?: number
          receptions?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          submitted_by?: string | null
          team_id?: string
          touchdowns?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "athlete_game_stats_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_game_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_game_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_private: {
        Row: {
          athlete_id: string
          contact_phone: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          contact_phone?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          contact_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_private_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_private_records: {
        Row: {
          athlete_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          medical_clearance: string
          medical_cleared_on: string | null
          medical_expires_on: string | null
          medical_notes: string | null
          national_id: string | null
          passport_expires_on: string | null
          passport_number: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          athlete_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          medical_clearance?: string
          medical_cleared_on?: string | null
          medical_expires_on?: string | null
          medical_notes?: string | null
          national_id?: string | null
          passport_expires_on?: string | null
          passport_number?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          athlete_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          medical_clearance?: string
          medical_cleared_on?: string | null
          medical_expires_on?: string | null
          medical_notes?: string | null
          national_id?: string | null
          passport_expires_on?: string | null
          passport_number?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_private_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_team_history: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          jersey_number: number | null
          position: string | null
          season_id: string
          team_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          jersey_number?: number | null
          position?: string | null
          season_id: string
          team_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          jersey_number?: number | null
          position?: string | null
          season_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_team_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_team_history_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_team_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          bio: string | null
          claimed_at: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          dominant_hand: string | null
          full_name: string
          gender: string | null
          height_cm: number | null
          home_city: string | null
          id: string
          nationality: string | null
          parental_consent: boolean
          parental_consent_at: string | null
          photo_url: string | null
          positions: string[]
          preferred_jersey_number: number | null
          profile_user_id: string | null
          slug: string
          social_links: Json
          started_playing_year: number | null
          updated_at: string
          verified: boolean
          visibility: string
          weight_kg: number | null
        }
        Insert: {
          bio?: string | null
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          dominant_hand?: string | null
          full_name: string
          gender?: string | null
          height_cm?: number | null
          home_city?: string | null
          id?: string
          nationality?: string | null
          parental_consent?: boolean
          parental_consent_at?: string | null
          photo_url?: string | null
          positions?: string[]
          preferred_jersey_number?: number | null
          profile_user_id?: string | null
          slug: string
          social_links?: Json
          started_playing_year?: number | null
          updated_at?: string
          verified?: boolean
          visibility?: string
          weight_kg?: number | null
        }
        Update: {
          bio?: string | null
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          dominant_hand?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          home_city?: string | null
          id?: string
          nationality?: string | null
          parental_consent?: boolean
          parental_consent_at?: string | null
          photo_url?: string | null
          positions?: string[]
          preferred_jersey_number?: number | null
          profile_user_id?: string | null
          slug?: string
          social_links?: Json
          started_playing_year?: number | null
          updated_at?: string
          verified?: boolean
          visibility?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          attendance: number | null
          away_team_id: string
          created_at: string
          home_team_id: string
          id: string
          pitch: string | null
          referee_name: string | null
          scheduled_at: string
          season_id: string
          status: Database["public"]["Enums"]["fixture_status"]
          updated_at: string
          venue: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          attendance?: number | null
          away_team_id: string
          created_at?: string
          home_team_id: string
          id?: string
          pitch?: string | null
          referee_name?: string | null
          scheduled_at: string
          season_id: string
          status?: Database["public"]["Enums"]["fixture_status"]
          updated_at?: string
          venue?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          attendance?: number | null
          away_team_id?: string
          created_at?: string
          home_team_id?: string
          id?: string
          pitch?: string | null
          referee_name?: string | null
          scheduled_at?: string
          season_id?: string
          status?: Database["public"]["Enums"]["fixture_status"]
          updated_at?: string
          venue?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          commissioner_name: string | null
          competition_level: string | null
          country: string | null
          created_at: string
          format: string | null
          id: string
          logo_url: string | null
          max_teams: number | null
          name: string
          organization_id: string | null
          region: string | null
          roster_limit: number | null
          rulebook: string | null
          short_code: string | null
          slug: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          commissioner_name?: string | null
          competition_level?: string | null
          country?: string | null
          created_at?: string
          format?: string | null
          id?: string
          logo_url?: string | null
          max_teams?: number | null
          name: string
          organization_id?: string | null
          region?: string | null
          roster_limit?: number | null
          rulebook?: string | null
          short_code?: string | null
          slug: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          commissioner_name?: string | null
          competition_level?: string | null
          country?: string | null
          created_at?: string
          format?: string | null
          id?: string
          logo_url?: string | null
          max_teams?: number | null
          name?: string
          organization_id?: string | null
          region?: string | null
          roster_limit?: number | null
          rulebook?: string | null
          short_code?: string | null
          slug?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leagues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          acronym: string | null
          affiliation_scope: string | null
          country: string | null
          created_at: string
          description: string | null
          founded_year: number | null
          headquarters_city: string | null
          id: string
          logo_url: string | null
          name: string
          parent_organization_id: string | null
          president_name: string | null
          region: string | null
          rulebook: string | null
          slug: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          acronym?: string | null
          affiliation_scope?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters_city?: string | null
          id?: string
          logo_url?: string | null
          name: string
          parent_organization_id?: string | null
          president_name?: string | null
          region?: string | null
          rulebook?: string | null
          slug: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          acronym?: string | null
          affiliation_scope?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters_city?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          parent_organization_id?: string | null
          president_name?: string | null
          region?: string | null
          rulebook?: string | null
          slug?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          platform_role: Database["public"]["Enums"]["platform_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start?: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          away_score: number
          created_at: string
          fixture_id: string
          home_score: number
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string
          submitted_by: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          away_score: number
          created_at?: string
          fixture_id: string
          home_score: number
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          away_score?: number
          created_at?: string
          fixture_id?: string
          home_score?: number
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "results_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: true
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          league_id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["season_status"]
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          league_id: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["season_status"]
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          league_id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["season_status"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      team_season_registrations: {
        Row: {
          created_at: string
          id: string
          league_id: string
          season_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          season_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          season_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_season_registrations_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_season_registrations_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_season_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          accent_color: string | null
          country: string | null
          created_at: string
          founded_year: number | null
          head_coach_name: string | null
          home_city: string | null
          home_ground: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          roster_capacity: number | null
          short_name: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          country?: string | null
          created_at?: string
          founded_year?: number | null
          head_coach_name?: string | null
          home_city?: string | null
          home_ground?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          roster_capacity?: number | null
          short_name?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          country?: string | null
          created_at?: string
          founded_year?: number | null
          head_coach_name?: string | null
          home_city?: string | null
          home_ground?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          roster_capacity?: number | null
          short_name?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          league_id: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id?: string | null
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      league_standings: {
        Row: {
          draws: number | null
          games_played: number | null
          losses: number | null
          point_differential: number | null
          points_against: number | null
          points_for: number | null
          season_id: string | null
          standings_points: number | null
          team_id: string | null
          team_name: string | null
          team_slug: string | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assert_valid_slug: { Args: { p_slug: string }; Returns: undefined }
      athlete_duplicate_exists: {
        Args: { p_dob: string; p_name: string }
        Returns: boolean
      }
      can_access_athlete_private: {
        Args: { p_athlete_id: string }
        Returns: boolean
      }
      can_edit_athlete_profile: {
        Args: { _athlete_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      create_league: {
        Args: {
          p_country?: string
          p_name: string
          p_organization_id?: string
          p_region?: string
          p_slug: string
        }
        Returns: string
      }
      create_organization: {
        Args: {
          p_country?: string
          p_description?: string
          p_logo_url?: string
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      create_team: {
        Args: {
          p_country?: string
          p_home_city?: string
          p_logo_url?: string
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      delete_my_athlete_profile: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _league_id?: string
          _organization_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _team_id?: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      release_my_athlete_profile: { Args: never; Returns: undefined }
      restore_fixture: { Args: { p_fixture_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_my_account: { Args: never; Returns: undefined }
      void_fixture: {
        Args: { p_fixture_id: string; p_reason: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "federation_admin"
        | "league_admin"
        | "team_admin"
        | "athlete"
      fixture_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      platform_role: "user" | "super_admin"
      season_status: "upcoming" | "active" | "completed"
      verification_status: "pending" | "approved" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "federation_admin",
        "league_admin",
        "team_admin",
        "athlete",
      ],
      fixture_status: ["scheduled", "in_progress", "completed", "cancelled"],
      platform_role: ["user", "super_admin"],
      season_status: ["upcoming", "active", "completed"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
