import { Calendar, Clock, Star, Trash2 } from 'lucide-react';
import { MovieEntry } from '../types';

interface MovieCardProps {
  movie: MovieEntry;
  onRatingChange: (movieId: string, rating: number) => void;
  onDelete?: (movieId: string) => void;
  editable?: boolean;
}

export function MovieCard({ movie, onRatingChange, onDelete, editable = true }: MovieCardProps) {
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