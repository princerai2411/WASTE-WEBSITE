/* ========================================
   Supabase Client Setup
   ========================================
   1. Create a free project at https://supabase.com
   2. Go to Project Settings → API
   3. Copy your "Project URL" and "anon public" key below
   4. Run the SQL in supabase-schema.sql (SQL Editor tab) to create
      the `listings` table and storage bucket policies
   5. Create a Storage bucket named "listings" and set it to Public
      (Storage → New bucket → name: listings → Public bucket: ON)
*/

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
