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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bypass_logs: {
        Row: {
          bypassed_at: string
          bypassed_by: string
          employment_status_id: string
          id: string
          reason: string
          scope: Database["public"]["Enums"]["bypass_scope"]
        }
        Insert: {
          bypassed_at?: string
          bypassed_by: string
          employment_status_id: string
          id?: string
          reason: string
          scope?: Database["public"]["Enums"]["bypass_scope"]
        }
        Update: {
          bypassed_at?: string
          bypassed_by?: string
          employment_status_id?: string
          id?: string
          reason?: string
          scope?: Database["public"]["Enums"]["bypass_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "bypass_logs_bypassed_by_fkey"
            columns: ["bypassed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bypass_logs_employment_status_id_fkey"
            columns: ["employment_status_id"]
            isOneToOne: false
            referencedRelation: "employment_status"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_proofs: {
        Row: {
          business_field: string | null
          company_name: string
          created_at: string
          employment_status_id: string
          file_path: string
          id: string
          notes: string | null
          position: string | null
          proof_type: Database["public"]["Enums"]["employment_proof_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["employment_proof_status"]
          updated_at: string
        }
        Insert: {
          business_field?: string | null
          company_name: string
          created_at?: string
          employment_status_id: string
          file_path: string
          id?: string
          notes?: string | null
          position?: string | null
          proof_type: Database["public"]["Enums"]["employment_proof_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employment_proof_status"]
          updated_at?: string
        }
        Update: {
          business_field?: string | null
          company_name?: string
          created_at?: string
          employment_status_id?: string
          file_path?: string
          id?: string
          notes?: string | null
          position?: string | null
          proof_type?: Database["public"]["Enums"]["employment_proof_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employment_proof_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_proofs_employment_status_id_fkey"
            columns: ["employment_status_id"]
            isOneToOne: false
            referencedRelation: "employment_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_proofs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_status: {
        Row: {
          created_at: string
          current_status: Database["public"]["Enums"]["employment_current_status"]
          declared_at: string
          id: string
          period_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_status: Database["public"]["Enums"]["employment_current_status"]
          declared_at?: string
          id?: string
          period_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_status?: Database["public"]["Enums"]["employment_current_status"]
          declared_at?: string
          id?: string
          period_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_status_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_status_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      graduation_book_data: {
        Row: {
          cap_gown_size: string | null
          created_at: string
          id: string
          photo_file_path: string
          print_degree: string
          print_full_name: string
          quote_text: string | null
          registration_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["book_data_status"]
          updated_at: string
        }
        Insert: {
          cap_gown_size?: string | null
          created_at?: string
          id?: string
          photo_file_path: string
          print_degree: string
          print_full_name: string
          quote_text?: string | null
          registration_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["book_data_status"]
          updated_at?: string
        }
        Update: {
          cap_gown_size?: string | null
          created_at?: string
          id?: string
          photo_file_path?: string
          print_degree?: string
          print_full_name?: string
          quote_text?: string | null
          registration_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["book_data_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_book_data_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "graduation_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_book_data_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_date: string
          payment_method: string | null
          proof_file_path: string
          registration_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_date: string
          payment_method?: string | null
          proof_file_path: string
          registration_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          proof_file_path?: string
          registration_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graduation_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "graduation_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_registrations: {
        Row: {
          attendance_choice:
            | Database["public"]["Enums"]["attendance_choice"]
            | null
          attendance_notes: string | null
          created_at: string
          final_status_at: string | null
          final_status_set_by: string | null
          id: string
          period_id: string
          status: Database["public"]["Enums"]["graduation_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_choice?:
            | Database["public"]["Enums"]["attendance_choice"]
            | null
          attendance_notes?: string | null
          created_at?: string
          final_status_at?: string | null
          final_status_set_by?: string | null
          id?: string
          period_id: string
          status?: Database["public"]["Enums"]["graduation_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_choice?:
            | Database["public"]["Enums"]["attendance_choice"]
            | null
          attendance_notes?: string | null
          created_at?: string
          final_status_at?: string | null
          final_status_set_by?: string | null
          id?: string
          period_id?: string
          status?: Database["public"]["Enums"]["graduation_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_registrations_final_status_set_by_fkey"
            columns: ["final_status_set_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_registrations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_thresholds: {
        Row: {
          created_at: string
          id: string
          min_applications: number
          period_id: string
          set_by: string
          study_program_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_applications: number
          period_id: string
          set_by: string
          study_program_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_applications?: number
          period_id?: string
          set_by?: string
          study_program_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_thresholds_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_thresholds_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_thresholds_study_program_id_fkey"
            columns: ["study_program_id"]
            isOneToOne: false
            referencedRelation: "study_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          application_status: Database["public"]["Enums"]["job_application_status"]
          applied_at: string
          created_at: string
          employment_status_id: string
          id: string
          proof_file_path: string | null
          updated_at: string
          vacancy_id: string | null
          vacancy_name_external: string | null
        }
        Insert: {
          application_status?: Database["public"]["Enums"]["job_application_status"]
          applied_at: string
          created_at?: string
          employment_status_id: string
          id?: string
          proof_file_path?: string | null
          updated_at?: string
          vacancy_id?: string | null
          vacancy_name_external?: string | null
        }
        Update: {
          application_status?: Database["public"]["Enums"]["job_application_status"]
          applied_at?: string
          created_at?: string
          employment_status_id?: string
          id?: string
          proof_file_path?: string | null
          updated_at?: string
          vacancy_id?: string | null
          vacancy_name_external?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_employment_status_id_fkey"
            columns: ["employment_status_id"]
            isOneToOne: false
            referencedRelation: "employment_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "job_vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_vacancies: {
        Row: {
          company_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          posted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          posted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          posted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_vacancies_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_module:
            | Database["public"]["Enums"]["notification_module"]
            | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_module?:
            | Database["public"]["Enums"]["notification_module"]
            | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_module?:
            | Database["public"]["Enums"]["notification_module"]
            | null
          sent_at?: string | null
          title?: string
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
      periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          type: Database["public"]["Enums"]["period_type"]
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          type: Database["public"]["Enums"]["period_type"]
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          type?: Database["public"]["Enums"]["period_type"]
        }
        Relationships: []
      }
      status_histories: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          module: Database["public"]["Enums"]["status_module"]
          new_status: string
          old_status: string | null
          reason: string | null
          source_id: string
          source_table: string
          student_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          module: Database["public"]["Enums"]["status_module"]
          new_status: string
          old_status?: string | null
          reason?: string | null
          source_id: string
          source_table: string
          student_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          module?: Database["public"]["Enums"]["status_module"]
          new_status?: string
          old_status?: string | null
          reason?: string | null
          source_id?: string
          source_table?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_histories_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_histories_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          degree_level: Database["public"]["Enums"]["degree_level"]
          faculty_id: string
          id: string
          nim: string
          study_program_id: string
          supervisor_name: string | null
          thesis_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree_level: Database["public"]["Enums"]["degree_level"]
          faculty_id: string
          id?: string
          nim: string
          study_program_id: string
          supervisor_name?: string | null
          thesis_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree_level?: Database["public"]["Enums"]["degree_level"]
          faculty_id?: string
          id?: string
          nim?: string
          study_program_id?: string
          supervisor_name?: string | null
          thesis_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_study_program_id_fkey"
            columns: ["study_program_id"]
            isOneToOne: false
            referencedRelation: "study_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_programs: {
        Row: {
          code: string | null
          created_at: string
          degree_level: Database["public"]["Enums"]["degree_level"]
          faculty_id: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          degree_level: Database["public"]["Enums"]["degree_level"]
          faculty_id: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          degree_level?: Database["public"]["Enums"]["degree_level"]
          faculty_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_programs_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      tracer_studies: {
        Row: {
          company_name: string | null
          competency_usage_level: string | null
          created_at: string
          current_condition: string
          field_relevance: string | null
          id: string
          job_acquisition_method: string | null
          period_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_range: string | null
          status: Database["public"]["Enums"]["tracer_status"]
          student_id: string
          submitted_at: string | null
          suggestions: string | null
          updated_at: string
          waiting_time_months: number | null
        }
        Insert: {
          company_name?: string | null
          competency_usage_level?: string | null
          created_at?: string
          current_condition: string
          field_relevance?: string | null
          id?: string
          job_acquisition_method?: string | null
          period_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["tracer_status"]
          student_id: string
          submitted_at?: string | null
          suggestions?: string | null
          updated_at?: string
          waiting_time_months?: number | null
        }
        Update: {
          company_name?: string | null
          competency_usage_level?: string | null
          created_at?: string
          current_condition?: string
          field_relevance?: string | null
          id?: string
          job_acquisition_method?: string | null
          period_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["tracer_status"]
          student_id?: string
          submitted_at?: string | null
          suggestions?: string | null
          updated_at?: string
          waiting_time_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracer_studies_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracer_studies_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracer_studies_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone_number?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      yudisium_applications: {
        Row: {
          created_at: string
          id: string
          period_id: string
          status: Database["public"]["Enums"]["yudisium_status"]
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_id: string
          status?: Database["public"]["Enums"]["yudisium_status"]
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          period_id?: string
          status?: Database["public"]["Enums"]["yudisium_status"]
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yudisium_applications_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yudisium_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      yudisium_documents: {
        Row: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          notes: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yudisium_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "yudisium_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yudisium_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      yudisium_reviews: {
        Row: {
          application_id: string
          created_at: string
          decided_at: string
          decision: Database["public"]["Enums"]["review_decision"] | null
          id: string
          input_by: string
          notes: string | null
          review_method: Database["public"]["Enums"]["review_method"]
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["yudisium_reviewer_role"]
        }
        Insert: {
          application_id: string
          created_at?: string
          decided_at: string
          decision?: Database["public"]["Enums"]["review_decision"] | null
          id?: string
          input_by: string
          notes?: string | null
          review_method: Database["public"]["Enums"]["review_method"]
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["yudisium_reviewer_role"]
        }
        Update: {
          application_id?: string
          created_at?: string
          decided_at?: string
          decision?: Database["public"]["Enums"]["review_decision"] | null
          id?: string
          input_by?: string
          notes?: string | null
          review_method?: Database["public"]["Enums"]["review_method"]
          reviewer_id?: string
          reviewer_role?: Database["public"]["Enums"]["yudisium_reviewer_role"]
        }
        Relationships: [
          {
            foreignKeyName: "yudisium_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "yudisium_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yudisium_reviews_input_by_fkey"
            columns: ["input_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yudisium_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_student_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      has_approved_tracer: { Args: never; Returns: boolean }
      has_approved_yudisium: {
        Args: { check_period_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_role: {
        Args: { p_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_student: { Args: never; Returns: boolean }
      student_id_for_user: { Args: { p_user_id?: string }; Returns: string }
    }
    Enums: {
      attendance_choice: "hadir" | "in_absentia"
      book_data_status: "pending" | "revision_needed" | "complete"
      bypass_scope: "hiring_threshold"
      degree_level: "sarjana" | "magister"
      document_status: "pending" | "approved" | "revision_needed"
      document_type: "ktp" | "kk" | "ijazah" | "dokumen_lain"
      employment_current_status:
        | "belum_bekerja"
        | "sudah_bekerja"
        | "wirausaha"
        | "melanjutkan_studi"
      employment_proof_status: "pending" | "revision_needed" | "verified"
      employment_proof_type:
        | "surat_keterangan_kerja"
        | "kontrak_kerja"
        | "sk_pengangkatan"
        | "slip_gaji"
        | "lainnya"
      graduation_status:
        | "menunggu_kesediaan"
        | "menunggu_pembayaran"
        | "menunggu_verifikasi_pembayaran"
        | "pembayaran_ditolak"
        | "pembayaran_terverifikasi"
        | "menunggu_data_buku"
        | "revisi_data_buku"
        | "data_buku_lengkap"
        | "terdaftar_sebagai_wisudawan"
        | "wisuda_in_absentia"
      job_application_status: "diproses" | "interview" | "diterima" | "ditolak"
      notification_channel: "in_app" | "email" | "whatsapp"
      notification_module: "yudisium" | "hiring_tracer" | "wisuda" | "general"
      payment_status: "pending" | "verified" | "rejected"
      period_type: "yudisium" | "wisuda"
      review_decision: "lolos" | "tidak_lolos"
      review_method: "manual" | "digital"
      status_module: "yudisium" | "hiring_tracer" | "wisuda"
      tracer_status: "draft" | "submitted" | "revision" | "approved"
      user_role:
        | "mahasiswa"
        | "kaprodi"
        | "admin_fakultas"
        | "admin_bkk"
        | "admin_keuangan"
        | "admin_kemahasiswaan"
        | "admin_wisuda"
      yudisium_reviewer_role: "kaprodi" | "admin_fakultas"
      yudisium_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "revision"
        | "approved"
        | "rejected"
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
    Enums: {
      attendance_choice: ["hadir", "in_absentia"],
      book_data_status: ["pending", "revision_needed", "complete"],
      bypass_scope: ["hiring_threshold"],
      degree_level: ["sarjana", "magister"],
      document_status: ["pending", "approved", "revision_needed"],
      document_type: ["ktp", "kk", "ijazah", "dokumen_lain"],
      employment_current_status: [
        "belum_bekerja",
        "sudah_bekerja",
        "wirausaha",
        "melanjutkan_studi",
      ],
      employment_proof_status: ["pending", "revision_needed", "verified"],
      employment_proof_type: [
        "surat_keterangan_kerja",
        "kontrak_kerja",
        "sk_pengangkatan",
        "slip_gaji",
        "lainnya",
      ],
      graduation_status: [
        "menunggu_kesediaan",
        "menunggu_pembayaran",
        "menunggu_verifikasi_pembayaran",
        "pembayaran_ditolak",
        "pembayaran_terverifikasi",
        "menunggu_data_buku",
        "revisi_data_buku",
        "data_buku_lengkap",
        "terdaftar_sebagai_wisudawan",
        "wisuda_in_absentia",
      ],
      job_application_status: ["diproses", "interview", "diterima", "ditolak"],
      notification_channel: ["in_app", "email", "whatsapp"],
      notification_module: ["yudisium", "hiring_tracer", "wisuda", "general"],
      payment_status: ["pending", "verified", "rejected"],
      period_type: ["yudisium", "wisuda"],
      review_decision: ["lolos", "tidak_lolos"],
      review_method: ["manual", "digital"],
      status_module: ["yudisium", "hiring_tracer", "wisuda"],
      tracer_status: ["draft", "submitted", "revision", "approved"],
      user_role: [
        "mahasiswa",
        "kaprodi",
        "admin_fakultas",
        "admin_bkk",
        "admin_keuangan",
        "admin_kemahasiswaan",
        "admin_wisuda",
      ],
      yudisium_reviewer_role: ["kaprodi", "admin_fakultas"],
      yudisium_status: [
        "draft",
        "submitted",
        "under_review",
        "revision",
        "approved",
        "rejected",
      ],
    },
  },
} as const
