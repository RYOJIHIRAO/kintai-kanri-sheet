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
      attendance_records: {
        Row: {
          id: string
          user_id: string
          date: string
          work_spans: Json
          breaks: Json
          status: string
          note: string
          work_content: string
          computed_work_min: number
          computed_overtime_min: number
          computed_night_min: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          work_spans: Json
          breaks: Json
          status: string
          note: string
          work_content: string
          computed_work_min: number
          computed_overtime_min: number
          computed_night_min: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          work_spans?: Json
          breaks?: Json
          status?: string
          note?: string
          work_content?: string
          computed_work_min?: number
          computed_overtime_min?: number
          computed_night_min?: number
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          employee_id: string
          name: string
          email: string
          role: string
          hourly_wage: number
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          name: string
          email: string
          role: string
          hourly_wage: number
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          name?: string
          email?: string
          role?: string
          hourly_wage?: number
          created_at?: string
        }
      }
    }
  }
}
