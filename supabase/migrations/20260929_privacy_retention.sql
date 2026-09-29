-- ============================================================
-- פרטיות: צמצום מידע ומחיקה אוטומטית (חוק הגנת הפרטיות, תיקון 13)
-- תאריך: 29.09.2026
--
-- מה זה עושה:
--   1. כתובת ה-IP ביומן הפעולות (logs) נרשמת בשרת מתוך הפנייה עצמה.
--      הדפדפן כבר לא פונה ל-api.ipify.org (שירות חיצוני) כדי לגלות את ה-IP שלו.
--   2. purge_personal_data() - מוחקת לוגים ישנים מ-90 יום, מאפסת את reporter_ip
--      בדיווחים ישנים מ-90 יום ומוחקת רשומות הגבלת קצב שפג תוקפן.
--   3. אם ההרחבה pg_cron זמינה - מתזמנת את המחיקה לכל לילה.
--      אחרת: להפעיל pg_cron (Database → Extensions) ולהריץ שוב את הקובץ.
--
-- תקופת השמירה (90 יום) מופיעה גם במדיניות הפרטיות (src/lib/legal.ts).
-- הרצה: Supabase → SQL Editor → הדבקה → Run. אידמפוטנטי, אפשר להריץ שוב.
-- ============================================================

begin;

-- 1. ה-IP ביומן נקבע בשרת בלבד (כל ערך שהלקוח שולח נדרס)
create or replace function public.logs_set_ip()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  new.ip_address := public.request_ip();
  return new;
end;
$fn$;

drop trigger if exists logs_set_ip on public.logs;
create trigger logs_set_ip
before insert on public.logs
for each row execute function public.logs_set_ip();

revoke all on function public.logs_set_ip() from public, anon, authenticated;

-- 2. מחיקה אוטומטית של מידע אישי ישן
alter table public.reports alter column reporter_ip drop not null;

create or replace function public.purge_personal_data()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  delete from public.logs
  where timestamp < now() - interval '90 days';

  update public.reports
  set reporter_ip = null
  where reporter_ip is not null
    and created_at < now() - interval '90 days';

  delete from public.rate_limits
  where expires_at < now();
end;
$fn$;

revoke all on function public.purge_personal_data() from public, anon, authenticated;

-- 3. תזמון לילי (רק אם pg_cron מותקן)
do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'purge_personal_data';
    perform cron.schedule('purge_personal_data', '17 3 * * *', 'select public.purge_personal_data()');
  else
    raise notice 'pg_cron לא מותקן: המחיקה האוטומטית לא תוזמנה. יש להפעיל את ההרחבה ולהריץ שוב.';
  end if;
end;
$do$;

-- הרצה ראשונה מיידית
select public.purge_personal_data();

commit;
