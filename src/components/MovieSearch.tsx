import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { SearchResult } from '../types';

interface MovieSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: SearchResult[];
  searchLoading: boolean;
  onSearch: (query: string) => void;
  onAddMovie: (movie: SearchResult, rating: number) => void;
}

export function MovieSearch({ 
  isOpen, 
  onClose, 
  searchResults, 
  searchLoading, 
  onSearch, 
  onAddMovie 
}: MovieSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleAddMovie = () => {
    if (selectedMovie) {
      onAddMovie(selectedMovie, selectedRating);
      setSelectedMovie(null);
      setSelectedRating(5);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50">
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Discover Movies</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 border-b border-slate-700/50">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </form>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <div className="flex space-x-3">
                      <img
                        src={movie.poster_path 
                          ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                          : '/placeholder-poster.jpg'
                        }
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-white text-sm line-clamp-2">
                          {movie.title}
                        </h3>
                        <p className="text-slate-400 text-xs">
                          {new Date(movie.release_date).getFullYear()}
                        </p>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400 text-xs">★</span>
                          <span className="text-slate-400 text-xs">
                            {movie.vote_average.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query && !searchLoading ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No movies found. Try a different search term.</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">Search for movies to add to your portfolio.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedMovie && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add to Portfolio</h3>
                <button
                  onClick={() => setSelectedMovie(null)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex space-x-4 mb-4">
                <img
                  src={selectedMovie.poster_path 
                    ? `https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`
                    : '/placeholder-poster.jpg'
                  }
                  alt={selectedMovie.title}
                  className="w-20 h-28 object-cover rounded"
                />
                <div>
                  <h4 className="font-semibold text-white mb-1">{selectedMovie.title}</h4>
                  <p className="text-slate-400 text-sm">
                    {new Date(selectedMovie.release_date).getFullYear()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(star)}
                        className="w-8 h-8 transition-all duration-200 hover:scale-110"
                      >
                        <span
                          className={`text-2xl ${
                            star <= selectedRating
                              ? 'text-yellow-400'
                              : 'text-slate-600'
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddMovie}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Portfolio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}