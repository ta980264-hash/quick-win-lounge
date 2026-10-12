create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own profile" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create table public.transaction_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  email text,
  type text not null check (type in ('deposit','withdraw')),
  amount numeric not null check (amount > 0),
  method text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.transaction_requests to authenticated;
grant all on public.transaction_requests to service_role;
alter table public.transaction_requests enable row level security;
create policy "insert own" on public.transaction_requests for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
create policy "read own or admin" on public.transaction_requests for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.transaction_requests for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  if new.email_confirmed_at is not null and lower(new.email) = 'acagaming75@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_auth_user();
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.handle_auth_user();