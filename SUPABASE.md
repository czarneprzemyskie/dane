Supabase integration

This project now uses Supabase for persistent storage and authentication.

Setup steps:

1. Create a Supabase project and run the SQL in `supabase.sql` (or paste it into Supabase SQL editor) to create the `profiles`, `plates`, and `posts` tables.
2. Add these environment variables to your Vite environment (locally in a `.env` file or via your hosting provider):
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public API key
3. The app uses a simple username-based auth flow for convenience: when registering, an email is derived as `username@example.com`. For production, use real emails and consider enabling email confirmation.
4. Install dependencies if needed and run the app: `npm install` then `npm run dev`.

Notes:

- If you added GitHub secrets for deployment, make sure your hosting provider injects them as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build/runtime.
- The SQL schema is included in `supabase.sql` and can be modified to suit your needs.
