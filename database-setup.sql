CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  total_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  release_date DATE,
  runtime INTEGER,
  overview TEXT,
  vote_average REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.movie_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  rating_stars INTEGER CHECK (rating_stars >= 1 AND rating_stars <= 5) NOT NULL,
  watchtime_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Authenticated users can view public profiles" ON public.users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING ((select auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Anyone can view movies" ON public.movies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert movies" ON public.movies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own movie entries" ON public.movie_entries
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Authenticated users can view public movie entries" ON public.movie_entries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own movie entries" ON public.movie_entries
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own movie entries" ON public.movie_entries
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own movie entries" ON public.movie_entries
  FOR DELETE USING ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
DECLARE
  watchtime_points INTEGER;
  rating_points INTEGER := 5;
  total_new_points INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT runtime INTO watchtime_points FROM public.movies WHERE id = OLD.movie_id;
  ELSE
    SELECT runtime INTO watchtime_points FROM public.movies WHERE id = NEW.movie_id;
  END IF;
  
  IF watchtime_points <= 60 THEN
    watchtime_points := 10;
  ELSIF watchtime_points <= 120 THEN
    watchtime_points := 20;
  ELSIF watchtime_points <= 180 THEN
    watchtime_points := 30;
  ELSE
    watchtime_points := 40;
  END IF;

  IF TG_OP = 'INSERT' THEN
    total_new_points := watchtime_points;
    IF NEW.rating_stars IS NOT NULL THEN
      total_new_points := total_new_points + rating_points;
    END IF;
    
    UPDATE public.users 
    SET total_points = total_points + total_new_points
    WHERE id = NEW.user_id;
    
  ELSIF TG_OP = 'UPDATE' AND NEW.rating_stars != OLD.rating_stars THEN
    IF OLD.rating_stars IS NULL AND NEW.rating_stars IS NOT NULL THEN
      UPDATE public.users 
      SET total_points = total_points + rating_points
      WHERE id = NEW.user_id;
    END IF;
  
  ELSIF TG_OP = 'DELETE' THEN
    total_new_points := watchtime_points;
    IF OLD.rating_stars IS NOT NULL THEN
      total_new_points := total_new_points + rating_points;
    END IF;
    
    UPDATE public.users 
    SET total_points = total_points - total_new_points
    WHERE id = OLD.user_id;
    
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER on_movie_entry_added
  AFTER INSERT ON public.movie_entries
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_points();

CREATE TRIGGER on_movie_entry_updated
  AFTER UPDATE ON public.movie_entries
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_points();

CREATE TRIGGER on_movie_entry_deleted
  AFTER DELETE ON public.movie_entries
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_points();

CREATE INDEX idx_movie_entries_user_id ON public.movie_entries(user_id);
CREATE INDEX idx_movie_entries_movie_id ON public.movie_entries(movie_id);