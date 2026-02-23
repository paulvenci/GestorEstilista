-- Enable pg_cron extension (requires superuser or specific permissions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the send-reminders function to run every hour
-- Note: You need to replace YOUR_PROJECT_REF and YOUR_ANON_KEY/SERVICE_KEY
-- This is usually done via the Supabase Dashboard or by making an HTTP request to the function

-- Using pg_net to call the Edge Function from Postgres (if pg_cron is enabled)
-- SELECT cron.schedule(
--   'send-whatsapp-reminders',
--   '0 * * * *', -- Every hour
--   $$
--   select
--     net.http_post(
--         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--         body:='{}'::jsonb
--     ) as request_id;
--   $$
-- );
