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
          {
            foreignKeyName: "athlete_game_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["team_id"]
          },
        ]
      }
      athlete_private: {
        Row: {
          athlete_id: string
          contact_email: string | null
          contact_phone: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          contact_email?: string | null
          contact_phone?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          contact_email?: string | null
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
      athletes: {
        Row: {
          bio: string | null
          claimed_at: string | null
          contact_visibility: string
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
          preferred_jersey_number: number | null
          primary_position: string | null
          profile_user_id: string | null
          secondary_positions: string[]
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
          contact_visibility?: string
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
          preferred_jersey_number?: number | null
          primary_position?: string | null
          profile_user_id?: string | null
          secondary_positions?: string[]
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
          contact_visibility?: string
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
          preferred_jersey_number?: number | null
          primary_position?: string | null
          profile_user_id?: string | null
          secondary_positions?: string[]
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
          stage_id: string | null
          status: Database["public"]["Enums"]["fixture_status"]
          tournament_id: string
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
          stage_id?: string | null
          status?: Database["public"]["Enums"]["fixture_status"]
          tournament_id: string
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
          stage_id?: string | null
          status?: Database["public"]["Enums"]["fixture_status"]
          tournament_id?: string
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
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "fixtures_stage_matches_tournament"
            columns: ["stage_id", "tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament_stages"
            referencedColumns: ["id", "tournament_id"]
          },
          {
            foreignKeyName: "fixtures_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "fixtures_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          athlete_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          league_id: string | null
          organization_id: string | null
          revoked_at: string | null
          sent_at: string
          status: Database["public"]["Enums"]["invitation_status"]
          team_id: string | null
          token_hash: string
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          athlete_id?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          league_id?: string | null
          organization_id?: string | null
          revoked_at?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id?: string | null
          token_hash: string
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          athlete_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          league_id?: string | null
          organization_id?: string | null
          revoked_at?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id?: string | null
          token_hash?: string
          type?: Database["public"]["Enums"]["invitation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["team_id"]
          },
        ]
      }
      leagues: {
        Row: {
          claimed_at: string | null
          commissioner_name: string | null
          competition_level: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
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
          social_links: Json
          updated_at: string
          verified: boolean
        }
        Insert: {
          claimed_at?: string | null
          commissioner_name?: string | null
          competition_level?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
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
          social_links?: Json
          updated_at?: string
          verified?: boolean
        }
        Update: {
          claimed_at?: string | null
          commissioner_name?: string | null
          competition_level?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
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
          social_links?: Json
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leagues_format_fkey"
            columns: ["format"]
            isOneToOne: false
            referencedRelation: "ref_formats"
            referencedColumns: ["key"]
          },
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
      ref_age_groups: {
        Row: {
          active: boolean
          key: string
          label: string
          sort_order: number
          under_age: number | null
        }
        Insert: {
          active?: boolean
          key: string
          label: string
          sort_order?: number
          under_age?: number | null
        }
        Update: {
          active?: boolean
          key?: string
          label?: string
          sort_order?: number
          under_age?: number | null
        }
        Relationships: []
      }
      ref_formats: {
        Row: {
          active: boolean
          key: string
          label: string
          players_per_side: number | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          key: string
          label: string
          players_per_side?: number | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          key?: string
          label?: string
          players_per_side?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      ref_gender_categories: {
        Row: {
          active: boolean
          allowed_genders: string[]
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          allowed_genders: string[]
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          allowed_genders?: string[]
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      ref_stage_types: {
        Row: {
          active: boolean
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          key?: string
          label?: string
          sort_order?: number
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
      team_members: {
        Row: {
          added_by: string | null
          athlete_id: string
          created_at: string
          id: string
          joined_at: string
          left_at: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          athlete_id: string
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          athlete_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["team_id"]
          },
        ]
      }
      teams: {
        Row: {
          accent_color: string | null
          bio: string | null
          claimed_at: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
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
          slogan: string | null
          slug: string
          social_links: Json
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          bio?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
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
          slogan?: string | null
          slug: string
          social_links?: Json
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          bio?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
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
          slogan?: string | null
          slug?: string
          social_links?: Json
          updated_at?: string
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          created_at: string
          id: string
          rejection_reason: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roster_unlocked: boolean
          status: Database["public"]["Enums"]["registration_status"]
          team_id: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_unlocked?: boolean
          status?: Database["public"]["Enums"]["registration_status"]
          team_id: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_unlocked?: boolean
          status?: Database["public"]["Enums"]["registration_status"]
          team_id?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_roster_entries: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          jersey_number: number
          position: string
          registration_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["roster_entry_status"]
          submitted_by: string | null
          team_id: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          jersey_number: number
          position: string
          registration_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["roster_entry_status"]
          submitted_by?: string | null
          team_id: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          jersey_number?: number
          position?: string
          registration_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["roster_entry_status"]
          submitted_by?: string | null
          team_id?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_roster_entries_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_roster_entries_registration_id_tournament_id_te_fkey"
            columns: ["registration_id", "tournament_id", "team_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id", "tournament_id", "team_id"]
          },
        ]
      }
      tournament_stages: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          sequence_order: number
          stage_type: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          sequence_order: number
          stage_type: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          sequence_order?: number
          stage_type?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_stages_stage_type_fkey"
            columns: ["stage_type"]
            isOneToOne: false
            referencedRelation: "ref_stage_types"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "tournament_stages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "tournament_stages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          age_group: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_date: string
          format: string
          gender_category: string
          id: string
          is_one_day: boolean | null
          league_id: string
          max_teams: number | null
          name: string
          points_draw: number
          points_loss: number
          points_win: number
          roster_limit: number | null
          season: string
          slug: string
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
        }
        Insert: {
          age_group?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date: string
          format: string
          gender_category: string
          id?: string
          is_one_day?: boolean | null
          league_id: string
          max_teams?: number | null
          name: string
          points_draw?: number
          points_loss?: number
          points_win?: number
          roster_limit?: number | null
          season: string
          slug: string
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Update: {
          age_group?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string
          format?: string
          gender_category?: string
          id?: string
          is_one_day?: boolean | null
          league_id?: string
          max_teams?: number | null
          name?: string
          points_draw?: number
          points_loss?: number
          points_win?: number
          roster_limit?: number | null
          season?: string
          slug?: string
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_age_group_fkey"
            columns: ["age_group"]
            isOneToOne: false
            referencedRelation: "ref_age_groups"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "tournaments_format_fkey"
            columns: ["format"]
            isOneToOne: false
            referencedRelation: "ref_formats"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "tournaments_gender_category_fkey"
            columns: ["gender_category"]
            isOneToOne: false
            referencedRelation: "ref_gender_categories"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "tournaments_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "user_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_standings"
            referencedColumns: ["team_id"]
          },
        ]
      }
    }
    Views: {
      tournament_standings: {
        Row: {
          draws: number | null
          games_played: number | null
          losses: number | null
          point_differential: number | null
          points_against: number | null
          points_for: number | null
          standings_points: number | null
          team_id: string | null
          team_name: string | null
          team_slug: string | null
          tournament_id: string | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _accept_invitation: { Args: { p_id: string }; Returns: Json }
      _invite_email_conflict: {
        Args: { p_athlete_id: string; p_email: string }
        Returns: string
      }
      _is_any_admin: { Args: never; Returns: boolean }
      _roster_editable: {
        Args: { p_registration_id: string }
        Returns: boolean
      }
      _roster_flags: {
        Args: { p_athlete_id: string; p_tournament_id: string }
        Returns: string[]
      }
      accept_invitation: { Args: { p_invitation_id: string }; Returns: Json }
      accept_invitation_by_token: {
        Args: { p_token_hash: string }
        Returns: Json
      }
      accept_unflagged_roster_entries: {
        Args: { p_registration_id: string }
        Returns: number
      }
      add_team_member: {
        Args: { p_athlete_id: string; p_team_id: string }
        Returns: undefined
      }
      admin_athlete_stats: { Args: never; Returns: Json }
      admin_list_athletes: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_position?: string
          p_q?: string
          p_status?: string
        }
        Returns: {
          can_manage: boolean
          claimed: boolean
          full_name: string
          home_city: string
          id: string
          invite_email: string
          invite_expires_at: string
          invite_status: string
          jersey_number: number
          photo_url: string
          primary_position: string
          secondary_positions: string[]
          slug: string
          team_name: string
          total_count: number
          verified: boolean
        }[]
      }
      admin_list_leagues: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_status?: string
        }
        Returns: {
          admin_count: number
          can_manage: boolean
          claimed: boolean
          country: string
          deleted: boolean
          id: string
          logo_url: string
          name: string
          organization_name: string
          orphaned: boolean
          region: string
          short_code: string
          slug: string
          total_count: number
          verified: boolean
        }[]
      }
      admin_list_teams: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_status?: string
        }
        Returns: {
          admin_count: number
          can_manage: boolean
          claimed: boolean
          country: string
          deleted: boolean
          home_city: string
          id: string
          logo_url: string
          name: string
          orphaned: boolean
          slug: string
          total_count: number
        }[]
      }
      admin_list_tournaments: {
        Args: {
          p_league_id?: string
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_status?: string
        }
        Returns: {
          age_group: string
          approved_teams: number
          can_manage: boolean
          deleted: boolean
          end_date: string
          format: string
          gender_category: string
          id: string
          is_one_day: boolean
          league_id: string
          league_name: string
          max_teams: number
          name: string
          pending_teams: number
          season: string
          slug: string
          start_date: string
          status: string
          total_count: number
        }[]
      }
      assert_valid_slug: { Args: { p_slug: string }; Returns: undefined }
      athlete_admin_duplicate_exists: {
        Args: { p_dob: string; p_name: string }
        Returns: boolean
      }
      athlete_duplicate_exists: {
        Args: { p_dob: string; p_name: string }
        Returns: boolean
      }
      athlete_in_admin_scope: {
        Args: { _athlete_id: string }
        Returns: boolean
      }
      athlete_roster_entries: {
        Args: { p_athlete_id: string }
        Returns: {
          jersey_number: number
          league_name: string
          position: string
          season: string
          start_date: string
          status: string
          team_id: string
          team_name: string
          tournament_id: string
          tournament_name: string
          tournament_slug: string
        }[]
      }
      athlete_team_memberships: {
        Args: { p_athlete_id: string }
        Returns: {
          joined_at: string
          left_at: string
          status: string
          team_id: string
          team_name: string
          team_slug: string
        }[]
      }
      can_access_athlete_private: {
        Args: { p_athlete_id: string }
        Returns: boolean
      }
      can_edit_athlete_profile: {
        Args: { _athlete_id: string }
        Returns: boolean
      }
      can_manage_league: { Args: { _league_id: string }; Returns: boolean }
      can_manage_team: { Args: { _team_id: string }; Returns: boolean }
      can_manage_tournament: {
        Args: { _tournament_id: string }
        Returns: boolean
      }
      can_review_fixture: { Args: { _fixture_id: string }; Returns: boolean }
      can_submit_for_fixture: {
        Args: { _fixture_id: string }
        Returns: boolean
      }
      can_view_athlete_contact: {
        Args: { _athlete_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      create_athlete_invitation: {
        Args: {
          p_athlete_id: string
          p_email: string
          p_expires_at: string
          p_token_hash: string
        }
        Returns: string
      }
      create_entity_invitation: {
        Args: {
          p_email: string
          p_entity_id: string
          p_expires_at: string
          p_token_hash: string
          p_type: Database["public"]["Enums"]["invitation_type"]
        }
        Returns: string
      }
      create_league: {
        Args: {
          p_country?: string
          p_name: string
          p_region?: string
          p_slug: string
        }
        Returns: string
      }
      create_league_admin_invitation: {
        Args: {
          p_email: string
          p_expires_at: string
          p_league_id: string
          p_token_hash: string
        }
        Returns: string
      }
      create_league_shell: {
        Args: {
          p_country?: string
          p_name: string
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
      create_team_admin_invitation: {
        Args: {
          p_email: string
          p_expires_at: string
          p_team_id: string
          p_token_hash: string
        }
        Returns: string
      }
      create_team_join_invitation: {
        Args: {
          p_athlete_id: string
          p_expires_at: string
          p_team_id: string
          p_token_hash: string
        }
        Returns: string
      }
      create_team_shell: {
        Args: {
          p_country?: string
          p_home_city?: string
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      create_tournament: {
        Args: {
          p_age_group: string
          p_description?: string
          p_end_date: string
          p_format: string
          p_gender_category: string
          p_league_id: string
          p_max_teams?: number
          p_name: string
          p_roster_limit?: number
          p_season: string
          p_slug: string
          p_start_date: string
        }
        Returns: string
      }
      delete_my_athlete_profile: { Args: never; Returns: undefined }
      delete_team_roster: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
      delete_unclaimed_athlete: {
        Args: { p_athlete_id: string }
        Returns: undefined
      }
      get_athlete_invitation: {
        Args: { p_athlete_id: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          sent_at: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _league_id?: string
          _organization_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _team_id?: string
        }
        Returns: boolean
      }
      invitation_recipient: {
        Args: { p_invitation_id: string }
        Returns: string
      }
      invite_email_conflict: {
        Args: { p_athlete_id?: string; p_email: string }
        Returns: string
      }
      invite_email_has_account: { Args: { p_email: string }; Returns: boolean }
      invite_signup_details: { Args: { p_token_hash: string }; Returns: Json }
      is_platform_admin: { Args: never; Returns: boolean }
      is_valid_social_links: { Args: { p: Json }; Returns: boolean }
      is_valid_team_social_links: { Args: { p: Json }; Returns: boolean }
      league_admins: {
        Args: { p_league_id: string }
        Returns: {
          added_at: string
          email: string
          full_name: string
          user_id: string
        }[]
      }
      league_has_verified_results: {
        Args: { p_league_id: string }
        Returns: boolean
      }
      league_pending_invitations: {
        Args: { p_league_id: string }
        Returns: {
          email: string
          expired: boolean
          expires_at: string
          id: string
          invite_type: Database["public"]["Enums"]["invitation_type"]
          sent_at: string
        }[]
      }
      my_pending_invitations: {
        Args: never
        Returns: {
          expired: boolean
          expires_at: string
          id: string
          invited_by_name: string
          label: string
          sent_at: string
          type: Database["public"]["Enums"]["invitation_type"]
        }[]
      }
      my_team_memberships: {
        Args: never
        Returns: {
          athlete_id: string
          joined_at: string
          logo_url: string
          team_id: string
          team_name: string
          team_slug: string
        }[]
      }
      preview_invitation: { Args: { p_token_hash: string }; Returns: Json }
      public_list_athletes: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_position?: string
          p_q?: string
          p_sort?: string
          p_verified_only?: boolean
        }
        Returns: {
          bio: string
          caps: number
          contact_visibility: string
          created_at: string
          date_of_birth: string
          dominant_hand: string
          full_name: string
          gender: string
          height_cm: number
          home_city: string
          id: string
          jersey_number: number
          nationality: string
          photo_url: string
          preferred_jersey_number: number
          primary_position: string
          secondary_positions: string[]
          slug: string
          social_links: Json
          started_playing_year: number
          team_name: string
          total_count: number
          touchdowns: number
          updated_at: string
          verified: boolean
          visibility: string
          weight_kg: number
        }[]
      }
      public_tournament_roster: {
        Args: { p_team_id?: string; p_tournament_id: string }
        Returns: {
          athlete_slug: string
          display_name: string
          jersey_number: number
          masked: boolean
          photo_url: string
          position: string
          team_id: string
          team_logo_url: string
          team_name: string
          team_slug: string
        }[]
      }
      release_my_athlete_profile: { Args: never; Returns: undefined }
      remove_league_admin: {
        Args: { p_league_id: string; p_user_id: string }
        Returns: undefined
      }
      remove_team_admin: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
      remove_team_member: {
        Args: { p_athlete_id: string; p_team_id: string }
        Returns: undefined
      }
      request_tournament_registration: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: string
      }
      restore_fixture: { Args: { p_fixture_id: string }; Returns: undefined }
      restore_league: { Args: { p_league_id: string }; Returns: undefined }
      restore_team: { Args: { p_team_id: string }; Returns: undefined }
      restore_tournament: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      review_roster_entry: {
        Args: { p_accept: boolean; p_entry_id: string; p_reason?: string }
        Returns: undefined
      }
      review_tournament_registration: {
        Args: {
          p_approve: boolean
          p_reason?: string
          p_registration_id: string
        }
        Returns: undefined
      }
      revoke_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      revoke_league_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      revoke_team_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      set_league_organization: {
        Args: { p_league_id: string; p_organization_id: string }
        Returns: undefined
      }
      set_league_verified: {
        Args: { p_league_id: string; p_verified: boolean }
        Returns: undefined
      }
      set_roster_unlocked: {
        Args: { p_registration_id: string; p_unlocked: boolean }
        Returns: undefined
      }
      set_tournament_status: {
        Args: {
          p_status: Database["public"]["Enums"]["tournament_status"]
          p_tournament_id: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_league: { Args: { p_league_id: string }; Returns: undefined }
      soft_delete_my_account: { Args: never; Returns: undefined }
      soft_delete_team: { Args: { p_team_id: string }; Returns: undefined }
      soft_delete_tournament: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      submit_roster_entry: {
        Args: {
          p_athlete_id: string
          p_jersey: number
          p_position: string
          p_registration_id: string
        }
        Returns: string
      }
      team_admins: {
        Args: { p_team_id: string }
        Returns: {
          added_at: string
          email: string
          full_name: string
          user_id: string
        }[]
      }
      team_has_verified_results: {
        Args: { p_team_id: string }
        Returns: boolean
      }
      team_members_list: {
        Args: { p_team_id: string }
        Returns: {
          athlete_id: string
          claimed: boolean
          full_name: string
          joined_at: string
          photo_url: string
          primary_position: string
          slug: string
        }[]
      }
      team_pending_invitations: {
        Args: { p_team_id: string }
        Returns: {
          email: string
          expired: boolean
          expires_at: string
          id: string
          invite_type: Database["public"]["Enums"]["invitation_type"]
          label: string
          sent_at: string
        }[]
      }
      team_rosters: {
        Args: { p_team_id: string }
        Returns: {
          accepted_count: number
          age_group: string
          can_delete: boolean
          can_edit: boolean
          format: string
          gender_category: string
          league_name: string
          pending_count: number
          registration_id: string
          registration_status: string
          rejection_reason: string
          roster_limit: number
          roster_unlocked: boolean
          season: string
          start_date: string
          tournament_id: string
          tournament_name: string
          tournament_status: string
        }[]
      }
      tournament_has_verified_results: {
        Args: { p_tournament_id: string }
        Returns: boolean
      }
      tournament_roster: {
        Args: { p_registration_id: string }
        Returns: {
          athlete_id: string
          athlete_name: string
          athlete_slug: string
          claimed: boolean
          created_at: string
          entry_id: string
          flags: string[]
          jersey_number: number
          photo_url: string
          position: string
          primary_position: string
          rejection_reason: string
          status: string
        }[]
      }
      tournament_roster_summary: {
        Args: { p_tournament_id: string }
        Returns: {
          accepted_count: number
          flagged_count: number
          logo_url: string
          pending_count: number
          registration_id: string
          roster_unlocked: boolean
          team_id: string
          team_name: string
          team_slug: string
        }[]
      }
      tournament_team_has_results: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: boolean
      }
      update_roster_entry: {
        Args: { p_entry_id: string; p_jersey: number; p_position: string }
        Returns: undefined
      }
      void_fixture: {
        Args: { p_fixture_id: string; p_reason: string }
        Returns: undefined
      }
      withdraw_roster_entry: {
        Args: { p_entry_id: string }
        Returns: undefined
      }
      withdraw_tournament_registration: {
        Args: { p_registration_id: string }
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
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      invitation_type:
        | "athlete_claim"
        | "team_join"
        | "team_claim"
        | "league_claim"
        | "org_claim"
      platform_role: "user" | "super_admin"
      registration_status: "pending" | "approved" | "rejected" | "withdrawn"
      roster_entry_status: "pending" | "accepted" | "rejected" | "withdrawn"
      tournament_status:
        | "draft"
        | "registration_open"
        | "in_progress"
        | "completed"
        | "cancelled"
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
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      invitation_type: [
        "athlete_claim",
        "team_join",
        "team_claim",
        "league_claim",
        "org_claim",
      ],
      platform_role: ["user", "super_admin"],
      registration_status: ["pending", "approved", "rejected", "withdrawn"],
      roster_entry_status: ["pending", "accepted", "rejected", "withdrawn"],
      tournament_status: [
        "draft",
        "registration_open",
        "in_progress",
        "completed",
        "cancelled",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
