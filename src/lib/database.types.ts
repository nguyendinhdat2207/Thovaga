// Viết tay theo đúng schema ở supabase/migrations/0001_init.sql.
// Nếu sau này chỉnh schema, cập nhật file này (hoặc dùng
// `supabase gen types typescript --project-id <id>` để sinh lại tự động).
//
// Mỗi bảng cần đủ Row/Insert/Update/Relationships để khớp với GenericTable
// của @supabase/postgrest-js — thiếu Relationships khiến toàn bộ suy luận
// type của supabase-js sập về `never`.

export type SubjectCategory = "school" | "data_ai" | "toeic";

export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: string;
          name: string;
          category: SubjectCategory;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: SubjectCategory;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Insert"]>;
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          source_file_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          title: string;
          source_file_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["decks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "decks_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          deck_id: string;
          prompt: string;
          options: string[];
          correct_option: number;
          explanation: string | null;
        };
        Insert: {
          id?: string;
          deck_id: string;
          prompt: string;
          options: string[];
          correct_option: number;
          explanation?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "questions_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          id: string;
          deck_id: string;
          started_at: string;
          finished_at: string;
          duration_seconds: number;
          score: number;
          total_questions: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          started_at: string;
          finished_at: string;
          duration_seconds: number;
          score: number;
          total_questions: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attempts_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          },
        ];
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option: number | null;
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option?: number | null;
          is_correct: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["attempt_answers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      vocab_decks: {
        Row: {
          id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vocab_decks"]["Insert"]>;
        Relationships: [];
      };
      vocab_words: {
        Row: {
          id: string;
          deck_id: string;
          en: string;
          vi: string;
          example: string | null;
        };
        Insert: {
          id?: string;
          deck_id: string;
          en: string;
          vi: string;
          example?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["vocab_words"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vocab_words_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "vocab_decks";
            referencedColumns: ["id"];
          },
        ];
      };
      vocab_progress: {
        Row: {
          word_id: string;
          box: number;
          correct: number;
          wrong: number;
          next_review: string;
          updated_at: string;
        };
        Insert: {
          word_id: string;
          box?: number;
          correct?: number;
          wrong?: number;
          next_review?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vocab_progress"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vocab_progress_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: true;
            referencedRelation: "vocab_words";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type Attempt = Database["public"]["Tables"]["attempts"]["Row"];
export type AttemptAnswer = Database["public"]["Tables"]["attempt_answers"]["Row"];
export type VocabDeck = Database["public"]["Tables"]["vocab_decks"]["Row"];
export type VocabWord = Database["public"]["Tables"]["vocab_words"]["Row"];
export type VocabProgress = Database["public"]["Tables"]["vocab_progress"]["Row"];
