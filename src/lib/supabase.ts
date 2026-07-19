import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local and in Vercel project settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  nationality: string | null;
  cv_url: string | null;
  cv_filename: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  category: string | null;
  city: string | null;
  country: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  job_type: string;
  description: string | null;
  requirements: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  posted_by: string | null;
  created_at: string;
};

export type Application = {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  applied_at: string;
};
