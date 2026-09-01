-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.budget_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  plan_id uuid NOT NULL,
  description text,
  category text,
  amount numeric,
  CONSTRAINT budget_entries_pkey PRIMARY KEY (id),
  CONSTRAINT budget_entries_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.plan_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  version bigint NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  event_id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid NOT NULL,
  CONSTRAINT plan_events_pkey PRIMARY KEY (id),
  CONSTRAINT plan_events_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.plan_members (
  plan_id uuid NOT NULL,
  user_id uuid NOT NULL,
  tier USER-DEFINED NOT NULL DEFAULT 'member'::plan_member_tier,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT plan_members_pkey PRIMARY KEY (plan_id, user_id),
  CONSTRAINT plan_members_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id),
  CONSTRAINT plan_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT plan_members_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.plan_snapshots (
  plan_id uuid NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  state jsonb NOT NULL DEFAULT jsonb_build_object('days', '[]'::jsonb),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plan_snapshots_pkey PRIMARY KEY (plan_id),
  CONSTRAINT plan_snapshots_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  title text,
  start_date date,
  end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  budget numeric,
  public_slug text NOT NULL DEFAULT translate(encode(gen_random_bytes(9), 'base64'::text), '/+'::text, '_-'::text) UNIQUE,
  cover_image text,
  is_public boolean NOT NULL DEFAULT false,
  destination_name text,
  destination_country text,
  latitude double precision,
  longitude double precision,
  CONSTRAINT plans_pkey PRIMARY KEY (id),
  CONSTRAINT plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  slug text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.demo_baseline (
  plan_id uuid NOT NULL,
  plan jsonb NOT NULL,
  snapshot jsonb NOT NULL,
  budget jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT demo_baseline_pkey PRIMARY KEY (plan_id)
);
CREATE TABLE public.demo_reset_state (
  id boolean NOT NULL DEFAULT true CHECK (id),
  last_reset_at timestamp with time zone NOT NULL,
  CONSTRAINT demo_reset_state_pkey PRIMARY KEY (id)
);