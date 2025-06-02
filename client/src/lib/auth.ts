import { useState, useEffect, createContext, useContext, createElement } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

interface User {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: user, error } = useQuery<User>({
    queryKey: ['/api/user/me'],
    retry: false,
    enabled: !!getAuthToken(),
  });

  useEffect(() => {
    // Check if we have a token on mount
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user !== undefined || error) {
      setLoading(false);
    }
  }, [user, error]);

  const login = (token: string) => {
    localStorage.setItem('auth_token', token);
    queryClient.invalidateQueries({ queryKey: ['/api/user/me'] });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    queryClient.clear();
    window.location.reload();
  };

  return {
    user: user ?? null,
    loading,
    login,
    logout,
  };
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return headers;
}

// Provider component to wrap the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  
  return createElement(AuthContext.Provider, { value: auth }, children);
}
