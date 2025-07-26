import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { MovieCard } from './components/MovieCard';
import { MovieSearch } from './components/MovieSearch';
import { UserSearch } from './components/UserSearch';
import { UserProfileView } from './components/UserProfileView';
import { EmptyState } from './components/EmptyState';
import { StatsCard } from './components/StatsCard';
import { AccountSettings } from './components/AccountSettings';
import { useAuth } from './hooks/useAuth';
import { useMovies } from './hooks/useMovies';
import { SearchResult, ViewMode } from './types';
import { getDefaultViewMode } from './utils/deviceDetection';
import { Plus, Grid3X3, List } from 'lucide-react';

export default function App() {
  const { user, loading, error, login, register, logout, refreshUserPoints } = useAuth();
  const { movies, loading: moviesLoading, searchResults, searchLoading, searchMovies, addMovie, updateRating, deleteMovie } = useMovies();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('moviewatch-view-mode');
    if (saved && (saved === 'grid' || saved === 'list')) {
      return saved as ViewMode;
    }
    return getDefaultViewMode();
  });

  useEffect(() => {
    localStorage.setItem('moviewatch-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        console.log('Emergency auth reset triggered');
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading MovieWatch...</p>
          <p className="text-slate-500 text-sm mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to MovieWatch</h1>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Track every film you watch, rate them, and build your cinematic portfolio. 
            Earn points and discover new movies.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
          >
            Get Started
          </button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={login}
          onRegister={register}
          loading={loading}
          error={error}
        />
      </div>
    );
  }

    const handleAddMovie = async (movie: SearchResult, rating: number) => {
    try {
      await addMovie(movie, rating);
      await refreshUserPoints();
      setShowSearchModal(false);
    } catch (error) {
      console.error('Error adding movie:', error);
      if (error instanceof Error && error.message.includes('already in your portfolio')) {
        alert('This movie is already in your portfolio!');
      } else {
        alert('Failed to add movie. Please try again.');
      }
    }
  };

  const handleRatingChange = async (movieId: string, rating: number) => {
    try {
      await updateRating(movieId, rating);
      await refreshUserPoints();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    try {
      const result = confirm('Are you sure you want to remove this movie from your portfolio? You will lose the points earned from it.');
      if (!result) return;
      
      await deleteMovie(movieId);
      await refreshUserPoints();
    } catch (error) {
      console.error('Error deleting movie:', error);
      if (error instanceof Error) {
        alert('Failed to delete movie: ' + error.message);
      } else {
        alert('Failed to delete movie. Please try again.');
      }
    }
  };

  const handleUserSelect = (userId: string) => {
    setViewingUserId(userId);
  };

  const handleBackToDiscover = () => {
    setViewingUserId(null);
  };

  if (viewingUserId) {
    return (
      <UserProfileView 
        userId={viewingUserId}
        currentUser={user}
        onBack={handleBackToDiscover}
        onLogout={logout}
        onRefreshCurrentUser={refreshUserPoints}
        onSearchClick={() => setShowUserSearch(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header
        user={user}
        onLogout={logout}
        onProfileClick={() => {}}
        onAccountClick={() => setShowAccountSettings(true)}
        onSearchClick={() => setShowUserSearch(true)}
      />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StatsCard movies={movies} totalPoints={user.total_points} />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Movie Portfolio</h2>
            
            <div className="flex items-center space-x-3">
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
              
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                title="Add Movie"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Movie</span>
              </button>
            </div>
          </div>

          {moviesLoading ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  {viewMode === 'grid' ? (
                    <>
                      <div className="bg-slate-700/50 aspect-[2/3] rounded-xl mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-700/50 rounded-xl p-4 flex space-x-4">
                      <div className="w-16 h-24 sm:w-20 sm:h-28 bg-slate-600/50 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-slate-600/50 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-600/50 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-600/50 rounded w-2/3"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : movies.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onRatingChange={handleRatingChange}
                  onDelete={handleDeleteMovie}
                  editable={true}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <EmptyState onAddMovie={() => setShowSearchModal(true)} />
          )}
        </div>
      </main>

      <MovieSearch
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSearch={searchMovies}
        onAddMovie={handleAddMovie}
      />

      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onUserSelect={handleUserSelect}
        />
      )}

      {showAccountSettings && (
        <AccountSettings
          user={user}
          onClose={() => setShowAccountSettings(false)}
          onLogout={logout}
          onRefreshUser={refreshUserPoints}
        />
      )}
    </div>
  );
}