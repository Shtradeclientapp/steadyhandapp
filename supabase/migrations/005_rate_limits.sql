-- Rate limiting table: one row per (user, route, time window)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id   uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route     text    NOT NULL,
  window_ts timestamptz NOT NULL,
  count     int     NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, route, window_ts)
);

-- No RLS needed — only accessed via service role key
ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

-- Purge windows older than 2 hours to keep the table small
CREATE INDEX IF NOT EXISTS rate_limits_window_ts_idx ON public.rate_limits (window_ts);

-- Atomic increment — returns the new count for the current window
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id   uuid,
  p_route     text,
  p_window_ts timestamptz
) RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
BEGIN
  -- Clean up stale windows older than 2 hours while we're here
  DELETE FROM public.rate_limits
  WHERE window_ts < now() - interval '2 hours';

  INSERT INTO public.rate_limits (user_id, route, window_ts, count)
  VALUES (p_user_id, p_route, p_window_ts, 1)
  ON CONFLICT (user_id, route, window_ts)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;
