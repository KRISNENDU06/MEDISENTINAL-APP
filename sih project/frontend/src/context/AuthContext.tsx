import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  quickLogin: (role: 'ADMIN' | 'HEALTH_OFFICIAL' | 'VIEWER') => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isHealthOfficial: boolean;
  isViewer: boolean;
  canManageAlerts: boolean;
  canAddObservations: boolean;
  canViewAnomalyMatrix: boolean;
  canRunRiskEngine: boolean;
}

export const DEMO_CREDENTIALS = {
  ADMIN: { email: 'admin@sih.gov.in', password: 'Admin@12345', label: 'Admin (Full Control)' },
  HEALTH_OFFICIAL: { email: 'official@sih.gov.in', password: 'Official@12345', label: 'Health Official (Alerts & RRT)' },
  VIEWER: { email: 'viewer@sih.gov.in', password: 'Viewer@12345', label: 'Citizen / Customer (Public View)' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sih_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sih_auth_token');
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch {
          // Token expired or invalid
          localStorage.removeItem('sih_auth_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem('sih_auth_token', res.access_token);
      setToken(res.access_token);

      const profile = await api.getMe();
      setUser(profile);
      showToast('success', 'Logged In', `Welcome, ${profile.full_name} (${profile.role})`);
      return true;
    } catch (err: any) {
      showToast('error', 'Login Failed', err.message || 'Invalid email or password');
      return false;
    }
  };

  const quickLogin = async (role: keyof typeof DEMO_CREDENTIALS): Promise<boolean> => {
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) return false;
    return login(creds.email, creds.password);
  };

  const logout = () => {
    localStorage.removeItem('sih_auth_token');
    setToken(null);
    setUser(null);
    showToast('info', 'Logged Out', 'You have been switched to Citizen / Guest Mode.');
  };

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isHealthOfficial = role === 'HEALTH_OFFICIAL';
  const isViewer = role === 'VIEWER' || !role;
  const canManageAlerts = role === 'ADMIN' || role === 'HEALTH_OFFICIAL';
  const canAddObservations = role === 'ADMIN';
  const canViewAnomalyMatrix = role === 'ADMIN' || role === 'HEALTH_OFFICIAL';
  const canRunRiskEngine = role === 'ADMIN' || role === 'HEALTH_OFFICIAL';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        quickLogin,
        logout,
        isAdmin,
        isHealthOfficial,
        isViewer,
        canManageAlerts,
        canAddObservations,
        canViewAnomalyMatrix,
        canRunRiskEngine,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

