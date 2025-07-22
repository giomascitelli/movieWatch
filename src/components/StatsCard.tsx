import { Trophy, Star, Clock, Film } from 'lucide-react';
import { MovieEntry } from '../types';

interface StatsCardProps {
  movies: MovieEntry[];
  totalPoints: number;
}

export function StatsCard({ movies, totalPoints }: StatsCardProps) {
  const totalWatchtime = movies.reduce((sum, movie) => sum + movie.watchtime_minutes, 0);
  const averageRating = movies.length > 0 
    ? movies.reduce((sum, movie) => sum + movie.rating_stars, 0) / movies.length
    : 0;

  const formatWatchtime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const stats = [
    {
      icon: Trophy,
      label: 'Total Points',
      value: totalPoints.toLocaleString(),
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      icon: Film,
      label: 'Movies Watched',
      value: movies.length.toString(),
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      icon: Clock,
      label: 'Total Watchtime',
      value: formatWatchtime(totalWatchtime),
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: averageRating.toFixed(1),
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
        >
          <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center mb-4`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}