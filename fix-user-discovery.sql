CREATE POLICY "Authenticated users can view public profiles" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view public movie entries" ON public.movie_entries
  FOR SELECT TO authenticated USING (true);
