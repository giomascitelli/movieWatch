import { Star, LogOut, Users, User } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  onProfileClick: () => void;
  onSearchClick: () => void;
}

export function Header({ user, onLogout, onProfileClick, onSearchClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">MovieWatch</h1>
          </div>

          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={onSearchClick}
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Movie Pals</span>
              </button>
              <button
                onClick={onProfileClick}
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </nav>
          )}

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-800/50 rounded-full px-4 py-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold">{user.total_points}</span>
                <span className="text-slate-400 text-sm">pts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white text-sm hidden sm:block">{user.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}