create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

create index if not exists partnership_offers_owner_id_idx
  on public.partnership_offers (owner_id);

create index if not exists partnership_offers_created_at_idx
  on public.partnership_offers (created_at desc);

create index if not exists partnership_offers_stage_idx
  on public.partnership_offers (stage);

create index if not exists partnership_interests_offer_id_idx
  on public.partnership_interests (offer_id);

create index if not exists partnership_interests_profile_id_idx
  on public.partnership_interests (profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_partnership_offers_updated_at on public.partnership_offers;
create trigger set_partnership_offers_updated_at
before update on public.partnership_offers
for each row
execute function public.set_updated_at();

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "offers are publicly readable" on public.partnership_offers;
create policy "offers are publicly readable"
on public.partnership_offers
for select
to anon, authenticated
using (true);

drop policy if exists "users insert their own offers" on public.partnership_offers;
create policy "users insert their own offers"
on public.partnership_offers
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "users update their own offers" on public.partnership_offers;
create policy "users update their own offers"
on public.partnership_offers
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "users delete their own offers" on public.partnership_offers;
create policy "users delete their own offers"
on public.partnership_offers
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "interest participants can read interests" on public.partnership_interests;
create policy "interest participants can read interests"
on public.partnership_interests
for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.partnership_offers offers
    where offers.id = partnership_interests.offer_id
      and offers.owner_id = auth.uid()
  )
);

drop policy if exists "users insert their own interests" on public.partnership_interests;
create policy "users insert their own interests"
on public.partnership_interests
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "users delete their own interests" on public.partnership_interests;
create policy "users delete their own interests"
on public.partnership_interests
for delete
to authenticated
using (profile_id = auth.uid());
