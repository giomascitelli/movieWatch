export interface User {
  id: string;
  username: string;
  email: string;
  total_points: number;
  avatar_url?: string;
  created_at: string;
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  runtime: number;
  overview: string;
  vote_average: number;
  tmdb_id: number;
}

export interface MovieEntry {
  id: string;
  user_id: string;
  movie_id: string;
  rating_stars: number;
  watchtime_minutes: number;
  created_at: string;
  updated_at: string;
  movie: Movie;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface SearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
}

export type ViewMode = 'grid' | 'list';