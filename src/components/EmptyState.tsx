import React from 'react';
import { Film, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddMovie: () => void;
}

export function EmptyState({ onAddMovie }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 bg-slate-700/50 rounded-full flex items-center justify-center">
        <Film className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Start Your Movie Portfolio
      </h3>
      <p className="text-slate-400 mb-8 max-w-md mx-auto">
        Track every film you watch, rate them, and build your cinematic journey. 
        Earn points for every movie you add and rating you give.
      </p>
      <button
        onClick={onAddMovie}
        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
      >
        <Plus className="w-5 h-5" />
        <span>Add Your First Movie</span>
      </button>
    </div>
  );
}