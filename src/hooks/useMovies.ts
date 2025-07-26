import { useState, useEffect } from 'react';
import { MovieEntry, SearchResult } from '../types';
import { tmdbService, TMDBMovie } from '../lib/tmdb';
import { supabase } from '../lib/supabase';
import { calculateMoviePoints, calculateTryHardModeUnlockTime, calculateDailyWatchtime } from '../utils/pointsCalculation';

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

    const checkPointsInterval = setInterval(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        checkAndAwardWatchtimePoints();
      }
    }, 30000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in useMovies:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        setMovies([]);
        setCurrentUserId(null);
        setSearchResults([]);
        setLoading(false);
        clearInterval(checkPointsInterval);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadMovies();
        checkAndAwardWatchtimePoints();
      }
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(checkPointsInterval);
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

    const addMovie = async (movie: SearchResult, rating: number | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const existingEntry = movies.find(entry => 
      entry.movie.tmdb_id === movie.id && entry.user_id === user.id
    );
    if (existingEntry) {
      console.log('Movie already exists in portfolio, skipping duplicate add');
      return {
        watchtimePoints: 0,
        ratingPoints: 0, 
        totalEarned: 0,
        isTryHardMode: false,
        canRateAfter: null,
        dailyWatchtime: 0,
        canEarnMorePoints: true
      };
    }

    console.log('Adding movie:', movie.title, 'TMDB ID:', movie.id);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('try_hard_mode')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

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

      const isTryHardMode = userData?.try_hard_mode || false;
      
      const pointsCalc = await calculateMoviePoints(
        user.id, 
        movieRecord.runtime, 
        !!rating,
        new Date()
      );

      console.log('Points calculation for', movieRecord.title, ':', {
        runtime: movieRecord.runtime,
        hasRating: !!rating,
        pointsCalc
      });

      let canRateAfter = null;
      if (isTryHardMode) {
        canRateAfter = calculateTryHardModeUnlockTime(movieRecord.runtime);
      }

      const pointsToAwardNow = isTryHardMode ? 0 : (rating != null ? pointsCalc.totalPoints : pointsCalc.watchtimePoints);

      const { data: newEntry, error: entryError } = await supabase
        .from('movie_entries')
        .insert({
          user_id: user.id,
          movie_id: movieRecord.id,
          rating_stars: isTryHardMode ? null : rating,
          watchtime_minutes: movieRecord.runtime,
          can_rate_after: canRateAfter?.toISOString(),
          points_earned: pointsToAwardNow,
          rating_points: isTryHardMode ? 0 : (rating != null ? pointsCalc.ratingPoints : 0),
          watchtime_points: isTryHardMode ? 0 : pointsCalc.watchtimePoints,
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
      
      if (pointsToAwardNow > 0) {
        const { error: pointsUpdateError } = await supabase
          .rpc('increment_user_points', { 
            user_id: user.id, 
            points_to_add: pointsToAwardNow 
          });

        if (pointsUpdateError) {
          console.error('Error updating user points:', pointsUpdateError);
        }
      }

      const { data: updatedUser } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        if (isTryHardMode) {
          console.log(`Try-hard mode: Movie added with 0 points. Points will be awarded after ${canRateAfter?.toLocaleString()}`);
        } else {
          console.log('User earned', pointsToAwardNow, 'points! New total:', updatedUser.total_points);
        }
        if (!pointsCalc.canEarnPoints) {
          console.log('Daily watchtime limit reached (7 hours)');
        }
      }
      
      return { 
        watchtimePoints: isTryHardMode ? 0 : pointsCalc.watchtimePoints, 
        ratingPoints: isTryHardMode ? 0 : pointsCalc.ratingPoints, 
        totalEarned: pointsToAwardNow,
        isTryHardMode,
        canRateAfter: canRateAfter?.toISOString(),
        dailyWatchtime: pointsCalc.dailyWatchtime,
        canEarnMorePoints: pointsCalc.canEarnPoints
      };
    } catch (error) {
      console.error('Error adding movie:', error);
      throw error;
    }
  };

  const updateRating = async (movieId: string, rating: number | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: movieEntry, error: entryError } = await supabase
        .from('movie_entries')
        .select('*, movies(*)')
        .eq('id', movieId)
        .eq('user_id', user.id)
        .single();

      if (entryError) throw entryError;

      if (movieEntry.can_rate_after && new Date() < new Date(movieEntry.can_rate_after)) {
        const timeLeft = new Date(movieEntry.can_rate_after).getTime() - new Date().getTime();
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
        throw new Error(`You can rate this movie in ${minutesLeft} minutes (Try-hard mode active)`);
      }

      let newRatingPoints = 0;
      let totalPointsToAdd = 0;

      if (movieEntry.rating_points === 0) {
        const entryDate = new Date(movieEntry.created_at);
        const dailyWatchtimeWhenAdded = await calculateDailyWatchtime(user.id, entryDate);
        
        if (dailyWatchtimeWhenAdded === movieEntry.watchtime_minutes) {
          newRatingPoints = 5;
        }
        
        totalPointsToAdd = newRatingPoints;
      }

      const { error } = await supabase
        .from('movie_entries')
        .update({ 
          rating_stars: rating,
          rating_points: movieEntry.rating_points + newRatingPoints,
          points_earned: movieEntry.points_earned + totalPointsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', movieId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (totalPointsToAdd > 0) {
        const { error: pointsUpdateError } = await supabase
          .rpc('increment_user_points', { 
            user_id: user.id, 
            points_to_add: totalPointsToAdd 
          });

        if (pointsUpdateError) {
          console.error('Error updating user points:', pointsUpdateError);
        }
      }

      setMovies(prev => 
        prev.map(movie => 
          movie.id === movieId 
            ? { 
                ...movie, 
                rating_stars: rating, 
                rating_points: movieEntry.rating_points + newRatingPoints,
                points_earned: movieEntry.points_earned + totalPointsToAdd,
                updated_at: new Date().toISOString() 
              }
            : movie
        )
      );
      
      if (totalPointsToAdd > 0) {
        console.log(`Rating awarded! User earned ${totalPointsToAdd} rating points.`);
      }

    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  };

  const checkAndAwardWatchtimePoints = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: finishedMovies, error } = await supabase
        .from('movie_entries')
        .select(`
          *,
          movie:movies(*)
        `)
        .eq('user_id', user.id)
        .not('can_rate_after', 'is', null)
        .lte('can_rate_after', new Date().toISOString())
        .eq('watchtime_points', 0);

      if (error) throw error;

      if (finishedMovies && finishedMovies.length > 0) {
        for (const movieEntry of finishedMovies) {
          const runtime = movieEntry.movie?.runtime || movieEntry.watchtime_minutes;
          const baseWatchtimePoints = runtime <= 60 ? 10 :
                                     runtime <= 120 ? 20 :
                                     runtime <= 180 ? 30 : 40;

          const entryDate = new Date(movieEntry.created_at);
          const dailyWatchtimeWhenAdded = await calculateDailyWatchtime(user.id, entryDate);
          
          let watchtimePoints = 0;
          if (dailyWatchtimeWhenAdded === movieEntry.watchtime_minutes) {
            watchtimePoints = baseWatchtimePoints;
          } else {
            const reductionFactor = Math.max(0.1, 1 - ((dailyWatchtimeWhenAdded - runtime) / 420));
            watchtimePoints = Math.floor(baseWatchtimePoints * reductionFactor);
          }

          if (watchtimePoints > 0) {
            await supabase
              .from('movie_entries')
              .update({
                watchtime_points: watchtimePoints,
                points_earned: movieEntry.points_earned + watchtimePoints,
                updated_at: new Date().toISOString()
              })
              .eq('id', movieEntry.id);

            await supabase
              .rpc('increment_user_points', {
                user_id: user.id,
                points_to_add: watchtimePoints
              });

            console.log(`Movie "${movieEntry.movie.title}" finished! Awarded ${watchtimePoints} watchtime points.`);

            setMovies(prev => 
              prev.map(movie => 
                movie.id === movieEntry.id 
                  ? {
                      ...movie,
                      watchtime_points: watchtimePoints,
                      points_earned: (movie.points_earned || 0) + watchtimePoints,
                      updated_at: new Date().toISOString()
                    }
                  : movie
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking watchtime points:', error);
    }
  };

  const deleteMovie = async (movieEntryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: movieEntry } = await supabase
        .from('movie_entries')
        .select('points_earned')
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

      const pointsToDeduct = movieEntry.points_earned || 0;
      if (pointsToDeduct > 0) {
        const { error: pointsUpdateError } = await supabase
          .rpc('increment_user_points', { 
            user_id: user.id, 
            points_to_add: -pointsToDeduct
          });

        if (pointsUpdateError) {
          console.error('Error updating user points:', pointsUpdateError);
        }
      }

      setMovies(prev => prev.filter(movie => movie.id !== movieEntryId));
      
      const { data: updatedUser } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single();
      
      if (updatedUser && pointsToDeduct > 0) {
        console.log('User lost', pointsToDeduct, 'points! New total:', updatedUser.total_points);
      }
      
      return { pointsDeducted: pointsToDeduct, newTotal: updatedUser?.total_points || 0 };
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
    checkAndAwardWatchtimePoints,
  };
}