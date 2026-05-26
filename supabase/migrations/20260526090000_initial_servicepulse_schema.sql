create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_email text not null default '',
  name text not null,
  slug text not null,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'pro')),
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past-due', 'canceled')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  monthly_price numeric not null default 99,
  seats_included integer not null default 1,
  seats_used integer not null default 0,
  trial_ends_at date not null default (current_date + interval '14 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  data_region text not null default 'us' check (data_region in ('us', 'eu', 'uae')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'operator' check (role in ('owner', 'operator', 'technician')),
  status text not null default 'active' check (status in ('active', 'invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  status text not null default 'new',
  quoted_value numeric not null default 0,
  invoice_status text not null default 'not_sent',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  quantity integer not null default 1,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'trialing',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id)
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.usage_events enable row level security;
alter table public.billing_accounts enable row level security;

create policy "workspace owners can manage their workspaces"
on public.workspaces
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "members can view their memberships"
on public.workspace_members
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "workspace owners can manage members"
on public.workspace_members
for all
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_members.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_members.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

create policy "workspace owners can manage customers"
on public.customers
for all
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = customers.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = customers.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

create policy "workspace owners can manage jobs"
on public.jobs
for all
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = jobs.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = jobs.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

create policy "workspace owners can read usage"
on public.usage_events
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = usage_events.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

create policy "workspace owners can manage billing"
on public.billing_accounts
for all
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = billing_accounts.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = billing_accounts.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);
