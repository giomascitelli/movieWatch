import { useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import { supabase } from '../lib/supabase';

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserPoints: () => Promise<void>;
} {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log('Simple auth check...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('User found, creating basic user object');
          const basicUser: User = {
            id: session.user.id,
            username: 'Loading...',
            email: session.user.email || '',
            total_points: 0,
            avatar_url: undefined,
            created_at: session.user.created_at,
          };
          setAuthState({ user: basicUser, loading: false, error: null });
          
          setTimeout(() => {
            if (mounted) {
              refreshUserPointsInternal(session.user.id);
            }
          }, 100);
        } else {
          console.log('No session, user not logged in');
          setAuthState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setAuthState({ user: null, loading: false, error: 'Authentication check failed' });
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (mounted) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 5000);

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (!mounted) return;

        if (session?.user) {
          const basicUser: User = {
            id: session.user.id,
            username: 'Loading...',
            email: session.user.email || '',
            total_points: 0,
            avatar_url: undefined,
            created_at: session.user.created_at,
          };
          setAuthState({ user: basicUser, loading: false, error: null });
          
          setTimeout(() => {
            if (mounted) {
              refreshUserPointsInternal(session.user.id);
            }
          }, 100);
        } else {
          setAuthState({ user: null, loading: false, error: null });
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserPointsInternal = async (userId: string) => {
    try {
      console.log('Fetching user data from database for user:', userId);
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, total_points, avatar_url, created_at, try_hard_mode')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (userData) {
        console.log('Database user data:', userData);
        setAuthState(prevState => ({
          ...prevState,
          user: prevState.user ? {
            ...prevState.user,
            username: userData.username || prevState.user.username,
            total_points: userData.total_points || 0,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at || prevState.user.created_at,
            try_hard_mode: userData.try_hard_mode || false,
          } : null
        }));
      }
    } catch (error) {
      console.error('Error in refreshUserPointsInternal:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('Login successful');
      console.log('useAuth.ts:92 Fetching user points after sign in');
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed'
      }));
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username);
      
      if (checkError) {
        console.error('Error checking username:', checkError);
      } else if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username already taken. Please choose a different username.');
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else if (error.message.includes('Password')) {
          throw new Error('Password must be at least 6 characters long.');
        } else {
          throw new Error(error.message);
        }
      }
      
      console.log('Registration successful');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Database error saving new user') || 
          error.message.includes('duplicate key') ||
          error.message.includes('username') && error.message.includes('already exists')) {
        errorMessage = 'Username already taken. Please choose a different username.';
      }
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage || 'Registration failed. Please try again.'
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await supabase.auth.signOut();
      setAuthState({ user: null, loading: false, error: null });
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthState(prev => ({ ...prev, error: error.message }));
    }
  };

  const refreshUserPoints = async () => {
    if (authState.user) {
      await refreshUserPointsInternal(authState.user.id);
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    refreshUserPoints,
  };
}