import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types/index';
import { getUserByEmail, verifyPassword } from '../services/airtable';
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
        const parsedUser = JSON.parse(storedUser);
        // Restore user session
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('afreq_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Check if Airtable is configured
      if (!config.airtable.apiKey || !config.airtable.baseId) {
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
        throw new Error('Invalid email or password.');
      }

      // Debug: Check what fields we received
      console.error('DEBUG - User object received:', {
        id: user.id,
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
        allFields: Object.keys(user)
      });

      // Verify password using bcrypt
      if (!user.password) {
        // Account exists but no password set - this is a legacy account
        // For security, we should not allow login without a password
        throw new Error('Password field not found in your account. Please ensure the Airtable Users table has a "password" field (text type) and contact the administrator.');
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password.');
      }

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
