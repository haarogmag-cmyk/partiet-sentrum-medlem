export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MembershipType = 'lav' | 'middel' | 'hoy' | 'unge_sentrum'
export type MembershipStatus = 'aktiv' | 'inaktiv' | 'utmeldt'
export type PaymentMethod = 'vipps' | 'stripe' | 'faktura' | 'manuell'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type EventSignupStatus = 'påmeldt' | 'venteliste' | 'avmeldt'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          address: string | null
          postal_code: string | null
          city: string | null
          birth_year: number | null
          membership_type: MembershipType | null
          membership_status: MembershipStatus
          membership_start: string | null
          membership_paid_until: string | null
          fylkeslag_id: number | null
          lokallag: string | null
          is_admin: boolean
          notes: string | null
          also_unge_sentrum: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      fylkeslag: {
        Row: {
          id: number
          name: string
          slug: string
          region: string | null
          leader_name: string | null
          leader_email: string | null
          contact_email: string | null
          description: string | null
          member_count: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['fylkeslag']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['fylkeslag']['Insert']>
      }
      membership_payments: {
        Row: {
          id: string
          profile_id: string
          amount: number
          currency: string
          payment_method: PaymentMethod | null
          payment_status: PaymentStatus
          period_from: string
          period_to: string
          external_payment_id: string | null
          notes: string | null
          also_unge_sentrum: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['membership_payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['membership_payments']['Insert']>
      }
      forms: {
        Row: {
          id: string
          title: string
          description: string | null
          slug: string | null
          fields: Json
          is_active: boolean
          requires_membership: boolean
          max_responses: number | null
          closes_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['forms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['forms']['Insert']>
      }
      form_responses: {
        Row: {
          id: string
          form_id: string
          profile_id: string | null
          respondent_email: string | null
          respondent_name: string | null
          data: Json
          submitted_at: string
        }
        Insert: Omit<Database['public']['Tables']['form_responses']['Row'], 'id' | 'submitted_at'>
        Update: Partial<Database['public']['Tables']['form_responses']['Insert']>
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string | null
          starts_at: string
          ends_at: string | null
          is_online: boolean
          online_url: string | null
          max_attendees: number | null
          fylkeslag_id: number | null
          requires_membership: boolean
          signup_form_id: string | null
          is_published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      event_signups: {
        Row: {
          id: string
          event_id: string
          profile_id: string | null
          guest_name: string | null
          guest_email: string | null
          status: EventSignupStatus
          signed_up_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_signups']['Row'], 'id' | 'signed_up_at'>
        Update: Partial<Database['public']['Tables']['event_signups']['Insert']>
      }
      news_posts: {
        Row: {
          id: string
          title: string
          slug: string | null
          excerpt: string | null
          content: string | null
          cover_image_url: string | null
          is_published: boolean
          published_at: string | null
          fylkeslag_id: number | null
          author_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['news_posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['news_posts']['Insert']>
      }
    }
  }
}

// Convenient row type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Fylkeslag = Database['public']['Tables']['fylkeslag']['Row']
export type MembershipPayment = Database['public']['Tables']['membership_payments']['Row']
export type Form = Database['public']['Tables']['forms']['Row']
export type FormResponse = Database['public']['Tables']['form_responses']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventSignup = Database['public']['Tables']['event_signups']['Row']
export type NewsPost = Database['public']['Tables']['news_posts']['Row']
