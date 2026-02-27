-- tree_ratings: stores each user's 1-5 star rating for a skill tree
create table if not exists tree_ratings (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  tree_id    text        not null,
  rating     integer     not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  unique (user_id, tree_id)
);

create index if not exists tree_ratings_tree_id_idx on tree_ratings (tree_id);
create index if not exists tree_ratings_user_id_idx on tree_ratings (user_id);

-- RLS: users can read all ratings (needed for stats) but only write their own
alter table tree_ratings enable row level security;

create policy "Anyone can read ratings"
  on tree_ratings for select using (true);

create policy "Users can upsert own ratings"
  on tree_ratings for insert with check (auth.uid() = user_id);

create policy "Users can update own ratings"
  on tree_ratings for update using (auth.uid() = user_id);
