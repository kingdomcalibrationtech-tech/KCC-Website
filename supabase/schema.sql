create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  source text not null default 'website',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  message text not null,
  source text not null default 'website',
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  category text not null default 'Special Event',
  start_at timestamptz not null,
  end_at timestamptz not null,
  venue text,
  time_label text,
  focus text,
  details text,
  poster_url text,
  poster_alt text,
  cta_label text,
  cta_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_date_check check (end_at >= start_at)
);

create index if not exists events_visibility_dates_idx
  on public.events (is_published, start_at, end_at);

alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.events enable row level security;

comment on table public.events is 'Church events managed from the Supabase dashboard.';
comment on column public.events.poster_url is 'Public URL for an event poster image. Supabase Storage public URLs work well here.';

insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true)
on conflict (id) do update
set public = excluded.public;

insert into public.events (
  slug,
  title,
  summary,
  category,
  start_at,
  end_at,
  venue,
  time_label,
  focus,
  details,
  cta_label,
  cta_url,
  sort_order
)
values
  (
    'six-hours-of-prayer-2026-05-02',
    '6 Hours of Prayer',
    'A focused time of intercession, waiting on the Lord, and pressing into His presence together as a church family.',
    'Special Event',
    '2026-05-02T09:00:00+03:00',
    '2026-05-02T15:00:00+03:00',
    'Woodvale Center, 2nd Floor, Westlands, Nairobi',
    '9:00 AM - 3:00 PM',
    'Prayer, intercession, and spiritual alignment.',
    'Come ready to seek the Lord together in one voice and one heart.',
    'Get Directions',
    'https://maps.google.com/?q=Woodvale+Centre+Westlands+Nairobi',
    10
  ),
  (
    'arise-and-shine-conference-2026-06-19',
    'Arise & Shine Conference',
    'A three-day gathering built around this year''s church theme: "Arise and Shine, for your light has come and the glory of the Lord has risen upon you." Expect worship, teaching, prayer, and moments of impartation as we prepare hearts to carry His light.',
    'Conference',
    '2026-06-19T08:00:00+03:00',
    '2026-06-21T18:00:00+03:00',
    'Woodvale Center, 2nd Floor, Westlands, Nairobi',
    'June 19 - June 21',
    'Worship, teaching, prayer, and impartation.',
    'Full schedule and session details coming soon.',
    'Get Directions',
    'https://maps.google.com/?q=Woodvale+Centre+Westlands+Nairobi',
    20
  )
on conflict (slug) do nothing;
