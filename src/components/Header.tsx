import { Star, LogOut, Users, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { User as UserType } from '../types';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  onProfileClick: () => void;
  onSearchClick: () => void;
}

export function Header({ user, onLogout, onProfileClick, onSearchClick }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={onSearchClick}
                className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-slate-800/50"
                title="Movie Pals"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Movie Pals</span>
              </button>
              
              <button
                onClick={onProfileClick}
                className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-slate-800/50"
                title="Profile"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Profile</span>
              </button>

              <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-800/50 rounded-full px-2 sm:px-4 py-1 sm:py-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-white font-semibold text-sm">{user.total_points}</span>
                <span className="text-slate-400 text-xs hidden sm:inline">pts</span>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-1 sm:space-x-2 hover:bg-slate-800/50 rounded-lg p-1 sm:p-2 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white text-sm hidden md:block">{user.username}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700/50 py-1 z-50">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}