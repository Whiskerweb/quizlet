// Types générés depuis Supabase
// Vous pouvez les régénérer avec: npx supabase gen types typescript --project-id YOUR_PROJECT_ID

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
          role: 'student' | 'teacher'
          study_level: string | null
          school: string | null
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
          role?: 'student' | 'teacher'
          study_level?: string | null
          school?: string | null
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
          role?: 'student' | 'teacher'
          study_level?: string | null
          school?: string | null
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
          folder_id: string | null
          password_hash: string | null
          subject: string | null
          created_at: string
          updated_at: string
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
          folder_id?: string | null
          password_hash?: string | null
          subject?: string | null
          created_at?: string
          updated_at?: string
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
          folder_id?: string | null
          password_hash?: string | null
          subject?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shared_sets: {
        Row: {
          id: string
          set_id: string
          user_id: string
          shared_by_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          set_id: string
          user_id: string
          shared_by_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          user_id?: string
          shared_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          user_id: string
          color: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          color?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          color?: string
          order?: number
          created_at?: string
          updated_at?: string
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
      answers: {
        Row: {
          id: string
          is_correct: boolean
          time_spent: number | null
          answered_at: string
          flashcard_id: string
          session_id: string
        }
        Insert: {
          id?: string
          is_correct: boolean
          time_spent?: number | null
          answered_at?: string
          flashcard_id: string
          session_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          time_spent?: number | null
          answered_at?: string
          flashcard_id?: string
          session_id?: string
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
      set_stats: {
        Row: {
          id: string
          views: number
          studies: number
          favorites: number
          average_score: number
          set_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          views?: number
          studies?: number
          favorites?: number
          average_score?: number
          set_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          views?: number
          studies?: number
          favorites?: number
          average_score?: number
          set_id?: string
          updated_at?: string
        }
      }
    }
  }
}



