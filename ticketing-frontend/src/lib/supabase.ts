import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrbxgxgdyvcchvmclwrg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyYnhneGdkeXZjY2h2bWNsd3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyOTc5NDQsImV4cCI6MjEwMjg3Mzk0NH0.49FY37MpKzmeJ8LAjZeKCI09kA0f3Bx-5822jrgk6t4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
