import { useState, useEffect } from 'react';
import { MovieEntry, SearchResult } from '../types';
import { tmdbService, TMDBMovie } from '../lib/tmdb';
import { supabase } from '../lib/supabase';

export function useMovies() {
  const [movies, setMovies] = useState<MovieEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (currentUserId !== (user?.id || null)) {
        setMovies([]);
        setCurrentUserId(user?.id || null);
      }
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: movieEntries, error } = await supabase
          .from('movie_entries')
          .select(`
            *,
            movie:movies(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMovies(movieEntries || []);
        setLoading(false);
      } catch (error) {
        console.error('Error loading movies:', error);
        setLoading(false);
      }
    };

    loadMovies();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in useMovies:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        setMovies([]);
        setCurrentUserId(null);
        setSearchResults([]);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadMovies();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  const searchMovies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await tmdbService.searchMovies(query);
      const searchResults: SearchResult[] = response.results.map((movie: TMDBMovie) => ({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
      }));
      setSearchResults(searchResults);
    } catch (error) {
      console.error('Error searching movies:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const addMovie = async (movie: SearchResult, rating: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const movieDetails = await tmdbService.getMovieDetails(movie.id);
      
      const { data: existingMovie, error: movieSelectError } = await supabase
        .from('movies')
        .select('*')
        .eq('tmdb_id', movie.id)
        .single();

      let movieRecord;
      if (movieSelectError && movieSelectError.code === 'PGRST116') {
        const { data: newMovie, error: movieInsertError } = await supabase
          .from('movies')
          .insert({
            tmdb_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            runtime: movieDetails.runtime || 120,
            overview: movie.overview,
            vote_average: movie.vote_average,
          })
          .select()
          .single();

        if (movieInsertError) throw movieInsertError;
        movieRecord = newMovie;
      } else if (movieSelectError) {
        throw movieSelectError;
      } else {
        movieRecord = existingMovie;
      }

      const { data: newEntry, error: entryError } = await supabase
        .from('movie_entries')
        .insert({
          user_id: user.id,
          movie_id: movieRecord.id,
          rating_stars: rating,
          watchtime_minutes: movieRecord.runtime,
        })
        .select(`
          *,
          movie:movies(*)
        `)
        .single();

      if (entryError) {
        if (entryError.code === '23505') {
          throw new Error('This movie is already in your portfolio');
        }
        throw entryError;
      }

      setMovies(prev => [newEntry, ...prev]);
      
      const watchtimePoints = movieRecord.runtime <= 60 ? 10 :
                             movieRecord.runtime <= 120 ? 20 :
                             movieRecord.runtime <= 180 ? 30 : 40;
      const ratingPoints = 5;
      const totalPoints = watchtimePoints + ratingPoints;
      
      const { data: updatedUser } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        console.log('User earned', totalPoints, 'points! New total:', updatedUser.total_points);
      }
      
      return { watchtimePoints, ratingPoints, totalEarned: totalPoints };
    } catch (error) {
      console.error('Error adding movie:', error);
      throw error;
    }
  };

  const updateRating = async (movieId: string, rating: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('movie_entries')
        .update({ 
          rating_stars: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', movieId)
        .eq('user_id', user.id);

      if (error) throw error;

      setMovies(prev => 
        prev.map(movie => 
          movie.id === movieId 
            ? { ...movie, rating_stars: rating, updated_at: new Date().toISOString() }
            : movie
        )
      );
      
      const { data: updatedUser } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        console.log('User earned 5 points for rating! New total:', updatedUser.total_points);
      }
      
      return { ratingPoints: 5, newTotal: updatedUser?.total_points || 0 };
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  };

  const deleteMovie = async (movieEntryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: movieEntry } = await supabase
        .from('movie_entries')
        .select(`
          *,
          movie:movies(runtime)
        `)
        .eq('id', movieEntryId)
        .eq('user_id', user.id)
        .single();

      if (!movieEntry) throw new Error('Movie not found in your portfolio');

      const { error } = await supabase
        .from('movie_entries')
        .delete()
        .eq('id', movieEntryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setMovies(prev => prev.filter(movie => movie.id !== movieEntryId));
      
      const runtime = movieEntry.movie?.runtime || 120;
      const watchtimePoints = runtime <= 60 ? 10 :
                             runtime <= 120 ? 20 :
                             runtime <= 180 ? 30 : 40;
      const ratingPoints = movieEntry.rating_stars ? 5 : 0;
      const totalDeducted = watchtimePoints + ratingPoints;
      
      const { data: updatedUser } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        console.log('User lost', totalDeducted, 'points! New total:', updatedUser.total_points);
      }
      
      return { pointsDeducted: totalDeducted, newTotal: updatedUser?.total_points || 0 };
    } catch (error) {
      console.error('Error deleting movie:', error);
      throw error;
    }
  };

  return {
    movies,
    loading,
    searchResults,
    searchLoading,
    searchMovies,
    addMovie,
    updateRating,
    deleteMovie,
  };
}