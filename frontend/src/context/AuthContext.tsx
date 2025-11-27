import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types/index';
import { getUserByEmail } from '../services/airtable';
import { config } from '../config/env';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem('afreq_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('afreq_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Check if Airtable is configured
      if (!config.airtable.apiKey || !config.airtable.baseId) {
        console.warn('Airtable not configured, using demo mode');
        // Fall back to demo mode
        const mockUser: User = {
          id: 'demo-' + Date.now(),
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email: email,
          role: email.includes('admin') ? 'admin' :
                email.includes('china') ? 'china_team' :
                email.includes('ghana') ? 'ghana_team' : 'customer',
        };

        setUser(mockUser);
        localStorage.setItem('afreq_user', JSON.stringify(mockUser));
        return mockUser;
      }

      // Try to get user from Airtable
      const user = await getUserByEmail(email);

      if (!user) {
        throw new Error('User not found. Please contact administrator.');
      }

      // In production, verify password here (e.g., using bcrypt comparison)
      // For now, accepting any password for demo purposes
      // TODO: Implement proper password verification

      setUser(user);
      localStorage.setItem('afreq_user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('afreq_user');
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role || user?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
