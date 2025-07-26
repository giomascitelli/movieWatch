import { useState, useEffect } from 'react';
import { ArrowLeft, User, Film, Grid3X3, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MovieEntry, ViewMode } from '../types';
import { getDefaultViewMode } from '../utils/deviceDetection';
import { MovieCard } from './MovieCard';
import { StatsCard } from './StatsCard';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  total_points: number;
  created_at: string;
}

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
}

export function UserProfileView({ userId, onBack }: UserProfileViewProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userMovies, setUserMovies] = useState<MovieEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('moviewatch-profile-view-mode');
    if (saved && (saved === 'grid' || saved === 'list')) {
      return saved as ViewMode;
    }
    return getDefaultViewMode();
  });

  useEffect(() => {
    localStorage.setItem('moviewatch-profile-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading profile for user ID:', userId);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      console.log('User profile loaded:', user);

      const { data: movies, error: moviesError } = await supabase
        .from('movie_entries')
        .select(`
          *,
          movie:movies(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (moviesError) throw moviesError;

      console.log(`Movies for user ${user.username} (${userId}):`, movies);

      setUserProfile(user);
      setUserMovies(movies || []);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error || 'User not found'}</div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Discovery</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{userProfile.username}</h1>
                <p className="text-slate-400">
                  Member since {new Date(userProfile.created_at).getFullYear()}
                </p>
              </div>
            </div>

            <div className="text-slate-400 text-sm">
              View-only mode
            </div>
          </div>
        </div>
      </div>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <StatsCard 
              movies={userMovies} 
              totalPoints={userProfile.total_points}
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {userProfile.username}'s Movie Collection
            </h2>
            
            <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {userMovies.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {userMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onRatingChange={() => {}}
                  editable={false}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Film className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No movies yet
              </h3>
              <p className="text-slate-400">
                {userProfile.username} hasn't added any movies to their portfolio yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
