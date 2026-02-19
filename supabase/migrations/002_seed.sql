-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Seed data — children + camps
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this AFTER 001_initial_schema.sql.
-- Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING).

-- ─── Children ────────────────────────────────────────────────────────────────
insert into public.children (name) values
  ('Marlow'),
  ('Violet')
on conflict (name) do nothing;

-- ─── Camps ───────────────────────────────────────────────────────────────────
-- image_url is left blank — replace with real photo URLs (S3, Supabase Storage, etc.)
-- TODO: Replace empty image_url values with actual camp photo URLs.

insert into public.camps (name, location, description, image_url) values
  -- ME camps
  ('Air Track Park',              'ME', 'Tumbling and obstacle courses',      ''),
  ('American Girl',               'ME', 'Dolls, crafts, themed activities',   ''),
  ('Cooking – Around the World',  'ME', 'Cook global recipes',                ''),
  ('Cooking – Cozy Comfort Food', 'ME', 'Make classic comfort dishes',        ''),
  ('Cooking – Taste of Italy',    'ME', 'Cook Italian recipes',               ''),
  ('Cooking – Tasty Eats',        'ME', 'Prepare simple popular meals',       ''),
  ('Dave & Busters',              'ME', 'Arcade games and outings',           ''),
  ('Edible Science',              'ME', 'Science experiments using food',     ''),
  ('Jewelry Making',              'ME', 'Design and create jewelry',          ''),
  ('Rock Climbing',               'ME', 'Indoor climbing practice',           ''),
  ('Sewing',                      'ME', 'Sew beginner projects',              ''),
  ('Slime Factory',               'ME', 'Make and customize slime',           ''),
  ('Spa Retreat',                 'ME', 'DIY spa crafts and activities',      ''),

  -- ECKE camps
  ('Adventure Camp',              'ECKE', 'Off-site adventures and outings',    ''),
  ('Basketball',                  'ECKE', 'Practice skills and play games',     ''),
  ('Dance Sampler',               'ECKE', 'Try different dance styles',         ''),
  ('Farming with Coastal Roots',  'ECKE', 'Farm activities and gardening',      ''),
  ('Girls Soccer',                'ECKE', 'Soccer drills and games',            ''),
  ('Girls Volleyball',            'ECKE', 'Volleyball practice and games',      ''),
  ('Magic',                       'ECKE', 'Learn and perform magic tricks',     ''),
  ('Pickleball',                  'ECKE', 'Learn and play pickleball',          ''),
  ('Soccer',                      'ECKE', 'Soccer drills and scrimmages',       ''),
  ('Splash',                      'ECKE', 'Swim and water activities',          ''),
  ('Viral Dance',                 'ECKE', 'Learn trending dance routines',      ''),
  ('Volleyball',                  'ECKE', 'Volleyball skills and games',        ''),
  ('Wheels, Waves & Whirls',      'ECKE', 'Skating, rides, beach outings',      ''),
  ('Zoo Explorers',               'ECKE', 'Visit zoo and learn animals',        ''),

  -- GC camps
  ('Gymnastics',                  'GC',   'Gymnastics skills and tumbling',     '')

on conflict (name) do nothing;
