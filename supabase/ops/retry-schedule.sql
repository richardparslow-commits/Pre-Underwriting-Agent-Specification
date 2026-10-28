-- Life Policy Pilot — notification retry schedule (operator-applied)
-- =============================================================================
-- Apply this file once in a project where pg_cron and pg_net are enabled.
-- It is kept out of the numbered migrations because enabling those extensions
-- is a project-level operator decision, not a schema change.
--
-- Before applying, store two secrets in Vault:
--   project_url  = https://<project-ref>.supabase.co
--   cron_secret  = the same value as the retry function's CRON_SECRET
--
-- Then run this file. Verify with:
--   select jobid, jobname, schedule, active from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 5;
--
-- The wrapper is a no-op when either secret is missing, so a half-configured
-- project does not hammer the function with unauthenticated requests.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_notification_retry()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'project_url';

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'cron_secret';

  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/retry-case-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
end;
$$;

revoke all on function public.invoke_notification_retry() from public;
revoke all on function public.invoke_notification_retry() from anon, authenticated;
grant execute on function public.invoke_notification_retry() to service_role;

select cron.schedule(
  'retry-case-notifications',
  '*/5 * * * *',
  $$select public.invoke_notification_retry();$$
)
where not exists (
  select 1 from cron.job where jobname = 'retry-case-notifications'
);
