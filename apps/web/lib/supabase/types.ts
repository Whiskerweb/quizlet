/**
 * Types générés pour Supabase
 * 
 * Note: Ces types devraient normalement être générés automatiquement avec:
 * npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
 * 
 * Pour l'instant, nous définissons une structure de base basée sur le schéma SQL.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          first_name: string | null
          last_name: string | null
          avatar: string | null
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          first_name?: string | null
          last_name?: string | null
          avatar?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          first_name?: string | null
          last_name?: string | null
          avatar?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sets: {
        Row: {
          id: string
          title: string
          description: string | null
          is_public: boolean
          share_id: string
          cover_image: string | null
          tags: string[]
          language: string | null
          user_id: string
          created_at: string
          updated_at: string
          password_hash?: string | null
          subject?: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          is_public?: boolean
          share_id?: string
          cover_image?: string | null
          tags?: string[]
          language?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          password_hash?: string | null
          subject?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          is_public?: boolean
          share_id?: string
          cover_image?: string | null
          tags?: string[]
          language?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          password_hash?: string | null
          subject?: string | null
        }
      }
      flashcards: {
        Row: {
          id: string
          front: string
          back: string
          image_url: string | null
          audio_url: string | null
          order: number
          set_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          front: string
          back: string
          image_url?: string | null
          audio_url?: string | null
          order?: number
          set_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          front?: string
          back?: string
          image_url?: string | null
          audio_url?: string | null
          order?: number
          set_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          mode: string
          score: number | null
          total_cards: number
          completed: boolean
          started_at: string
          completed_at: string | null
          user_id: string
          set_id: string
        }
        Insert: {
          id?: string
          mode: string
          score?: number | null
          total_cards: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
          user_id: string
          set_id: string
        }
        Update: {
          id?: string
          mode?: string
          score?: number | null
          total_cards?: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
          user_id?: string
          set_id?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          total_sets: number
          total_flashcards: number
          total_study_time: number
          total_sessions: number
          average_score: number
          user_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          total_sets?: number
          total_flashcards?: number
          total_study_time?: number
          total_sessions?: number
          average_score?: number
          user_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          total_sets?: number
          total_flashcards?: number
          total_study_time?: number
          total_sessions?: number
          average_score?: number
          user_id?: string
          updated_at?: string
        }
      }
      card_progress: {
        Row: {
          id: string
          ease_factor: number
          interval: number
          repetitions: number
          next_review: string
          last_review: string | null
          user_id: string
          flashcard_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          last_review?: string | null
          user_id: string
          flashcard_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          last_review?: string | null
          user_id?: string
          flashcard_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      create_or_update_profile: {
        Args: {
          user_id: string
          user_email: string
          user_username: string
          user_first_name?: string | null
          user_last_name?: string | null
        }
        Returns: void
      }
      increment_flashcard_count: {
        Args: {
          set_id_param: string
        }
        Returns: void
      }
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
  }
}
