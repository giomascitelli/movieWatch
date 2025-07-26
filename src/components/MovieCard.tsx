import { Calendar, Clock, Star, Trash2 } from 'lucide-react';
import { MovieEntry } from '../types';

interface MovieCardProps {
  movie: MovieEntry;
  onRatingChange: (movieId: string, rating: number) => void;
  onDelete?: (movieId: string) => void;
  editable?: boolean;
  viewMode?: 'grid' | 'list';
}

export function MovieCard({ movie, onRatingChange, onDelete, editable = true, viewMode = 'grid' }: MovieCardProps) {
  const handleStarClick = (rating: number) => {
    if (editable) {
      onRatingChange(movie.id, rating);
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (viewMode === 'list') {
    return (
      <div className="group relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 p-4">
        {onDelete && editable && (
          <button
            onClick={() => onDelete(movie.id)}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            title="Remove from portfolio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex space-x-4">
          <div className="relative overflow-hidden rounded-lg flex-shrink-0">
            <img
              src={movie.movie.poster_path 
                ? `https://image.tmdb.org/t/p/w200${movie.movie.poster_path}`
                : '/placeholder-poster.jpg'
              }
              alt={movie.movie.title}
              className="w-16 h-24 sm:w-20 sm:h-28 object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <h3 className="font-semibold text-white text-base sm:text-lg line-clamp-2 group-hover:text-purple-400 transition-colors">
              {movie.movie.title}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{new Date(movie.movie.release_date).getFullYear()}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatRuntime(movie.watchtime_minutes)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    disabled={!editable}
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
                      editable ? 'hover:scale-110' : 'cursor-default'
                    }`}
                  >
                    <Star
                      className={`w-full h-full ${
                        star <= movie.rating_stars
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-600'
                      } ${editable ? 'hover:text-yellow-300' : ''}`}
                    />
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-slate-400 hidden sm:block">
                Rating: {movie.rating_stars}★
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 hidden sm:block">
              {movie.movie.overview}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105">
      {onDelete && editable && (
        <button
          onClick={() => onDelete(movie.id)}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          title="Remove from portfolio"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={movie.movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.movie.poster_path}`
            : '/placeholder-poster.jpg'
          }
          alt={movie.movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors">
          {movie.movie.title}
        </h3>

        <div className="flex items-center space-x-2 text-slate-400">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {new Date(movie.movie.release_date).getFullYear()}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatRuntime(movie.watchtime_minutes)}</span>
        </div>

        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              disabled={!editable}
              className={`w-6 h-6 transition-all duration-200 ${
                editable ? 'hover:scale-110' : 'cursor-default'
              }`}
            >
              <Star
                className={`w-full h-full ${
                  star <= movie.rating_stars
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                } ${editable ? 'hover:text-yellow-300' : ''}`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Watchtime: {movie.watchtime_minutes}m</span>
          <span>Rating: {movie.rating_stars}★</span>
        </div>
      </div>
    </div>
  );
}