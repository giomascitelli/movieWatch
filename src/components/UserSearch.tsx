import { useState } from 'react';
import { Search, User, Star, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  total_points: number;
  created_at: string;
  movie_count?: number;
}

interface UserSearchProps {
  onClose: () => void;
  onUserSelect: (userId: string) => void;
}

export function UserSearch({ onClose, onUserSelect }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser?.id, currentUser?.email);
      
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, username, email');
      
      console.log('All users in database:', allUsers);
      if (allUsersError) console.error('Error fetching all users:', allUsersError);
      
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          total_points,
          created_at
        `)
        .ilike('username', `%${query}%`)
        .neq('id', currentUser?.id || '')
        .limit(10);

      console.log('Search query:', `%${query}%`);
      console.log('Current user ID to exclude:', currentUser?.id);
      console.log('Search error:', error);
      console.log('Found users:', users);

      if (error) throw error;

      const usersWithMovieCount = await Promise.all(
        (users || []).map(async (user) => {
          const { count, error: countError } = await supabase
            .from('movie_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (countError) {
            console.error('Error counting movies for user', user.username, ':', countError);
          }
          
          console.log(`User ${user.username} (${user.id}) has ${count} movies`);
          
          return {
            ...user,
            movie_count: count || 0
          };
        })
      );

      console.log('Users with movie counts:', usersWithMovieCount);
      setSearchResults(usersWithMovieCount);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleUserClick = (userId: string) => {
    onUserSelect(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Find Movie Pals</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for users by username..."
              className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {user.username}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Member since {new Date(user.created_at).getFullYear()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-slate-400">
                    <div className="hidden sm:flex items-center space-x-1">
                      <Film className="w-4 h-4" />
                      <span className="text-sm">{user.movie_count} movies</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">{user.total_points} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No users found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Start typing to search for users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
