-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text unique not null,
  display_name text,
  twitter_username text,
  profile_image text,
  bio text,
  verified boolean default false,
  tier text check (tier in ('nano', 'micro', 'macro', 'mega')),
  followers integer default 0,
  engagement_rate decimal default 0,
  influence_score integer default 0,
  insightiq_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tokens table
create table public.tokens (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  symbol text unique not null,
  description text,
  logo_url text,
  contract_address text unique not null,
  total_supply text not null,
  current_price text default '0.01',
  creator_id uuid references public.users(id),
  creator_wallet text not null,
  verified boolean default false,
  is_public boolean default true,
  is_active boolean default true,
  metrics jsonb default '{}',
  milestones jsonb default '[]',
  tokenomics jsonb default '{}',
  holders_count integer default 1,
  market_cap text default '0',
  volume_24h text default '0',
  current_milestone integer default 0,
  milestones_achieved integer[] default '{}',
  next_milestone_target integer default 100,
  test_mode boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create analytics table
create table public.analytics (
  id uuid default uuid_generate_v4() primary key,
  token_id uuid references public.tokens(id),
  contract_address text not null,
  period text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  token_price decimal default 0,
  holders_count integer default 0,
  market_cap decimal default 0,
  volume_24h decimal default 0,
  followers integer default 0,
  engagement_rate decimal default 0,
  influence_score integer default 0,
  creator_id uuid references public.users(id)
);

-- Create events table for tracking
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null,
  event_data jsonb default '{}',
  user_id uuid references public.users(id),
  token_id uuid references public.tokens(id),
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create token_holdings table
create table public.token_holdings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  token_id uuid references public.tokens(id),
  balance text not null default '0',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, token_id)
);

-- Create indexes for better performance
create index idx_users_wallet_address on public.users(wallet_address);
create index idx_tokens_contract_address on public.tokens(contract_address);
create index idx_tokens_symbol on public.tokens(symbol);
create index idx_tokens_creator_id on public.tokens(creator_id);
create index idx_analytics_token_id on public.analytics(token_id);
create index idx_analytics_timestamp on public.analytics(timestamp);
create index idx_events_timestamp on public.events(timestamp);
create index idx_token_holdings_user_id on public.token_holdings(user_id);
create index idx_token_holdings_token_id on public.token_holdings(token_id);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.tokens enable row level security;
alter table public.analytics enable row level security;
alter table public.events enable row level security;
alter table public.token_holdings enable row level security;

-- Create policies for public read access
create policy "Public tokens are viewable by everyone" on public.tokens
  for select using (is_public = true);

create policy "Public user profiles are viewable by everyone" on public.users
  for select using (true);

create policy "Analytics are viewable by everyone" on public.analytics
  for select using (true);

-- Create policies for authenticated users
create policy "Users can insert their own profile" on public.users
  for insert with check (true);

create policy "Users can update their own profile" on public.users
  for update using (true);

create policy "Users can create tokens" on public.tokens
  for insert with check (true);

create policy "Token creators can update their tokens" on public.tokens
  for update using (true);

create policy "Users can insert analytics" on public.analytics
  for insert with check (true);

create policy "Users can insert events" on public.events
  for insert with check (true);

create policy "Users can manage their token holdings" on public.token_holdings
  for all using (true);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tokens
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.token_holdings
  for each row execute procedure public.handle_updated_at();
