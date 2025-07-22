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
          const user: User = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            email: session.user.email || '',
            total_points: 0,
            avatar_url: undefined,
            created_at: session.user.created_at,
          };
          setAuthState({ user, loading: false, error: null });
          
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
        console.error('Auth error:', error);
        if (mounted) {
          setAuthState({ user: null, loading: false, error: null });
        }
      }
    };

    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth timeout reached');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 3000);

    checkAuth().finally(() => {
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, creating basic user object');
        const user: User = {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || 'user',
          email: session.user.email || '',
          total_points: 0,
          avatar_url: undefined,
          created_at: session.user.created_at,
        };
        setAuthState({ user, loading: false, error: null });
        
        setTimeout(() => {
          if (mounted) {
            console.log('Fetching user points after sign in');
            refreshUserPointsInternal(session.user.id);
          }
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({ user: null, loading: false, error: null });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserPointsInternal = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('total_points, username')
        .eq('id', userId)
        .single();
      
      if (userData) {
        setAuthState(prev => prev.user ? {
          ...prev,
          user: {
            ...prev.user,
            total_points: userData.total_points || 0,
            username: userData.username || prev.user.username
          }
        } : prev);
      }
    } catch (error) {
      console.warn('Could not refresh user points internally:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Attempting login...');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState({ 
        user: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Attempting registration...');
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      console.log('Registration successful');
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthState({ 
        user: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  };

  const refreshUserPoints = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        setAuthState(prev => prev.user ? {
          ...prev,
          user: { ...prev.user, total_points: userData.total_points }
        } : prev);
      }
    } catch (error) {
      console.warn('Could not refresh user points:', error);
    }
  };

  const logout = () => {
    console.log('Logging out...');
    setAuthState({ user: null, loading: false, error: null });
    supabase.auth.signOut();
  };

  return {
    ...authState,
    login,
    register,
    logout,
    refreshUserPoints,
  };
}