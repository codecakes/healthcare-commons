import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useFingerprint } from '@/hooks/useFingerprint';
import apolloClient from '@/lib/apollo';
import { LOGOUT } from '@/lib/graphql';

type UserRole = 'patient' | 'provider' | null;
type AppState = 'welcome' | 'demographics' | 'search' | 'provider-verification' | 'provider-dashboard';

interface AppContextType {
  userRole: UserRole;
  appState: AppState;
  currentLanguage: string;
  sessionData: any;
  isLoggedIn: boolean;
  setUserRole: (role: UserRole) => void;
  setAppState: (state: AppState) => void;
  setCurrentLanguage: (language: string) => void;
  logout: () => Promise<void>;
  login: (role: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { sessionData, loading, updateSessionData } = useFingerprint();

  useEffect(() => {
    // Check for existing session on app load
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedState = localStorage.getItem('appState') as AppState;
    const savedLanguage = localStorage.getItem('currentLanguage');
    
    if (savedRole && savedState) {
      setUserRole(savedRole);
      setAppState(savedState);
      setIsLoggedIn(true);
    }
    
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const login = (role: UserRole) => {
    setUserRole(role);
    setIsLoggedIn(true);
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('loginTimestamp', new Date().toISOString());
  };

  const logout = async () => {
    console.log('Logging out user...');

    // Inform the server to clear auth cookies
    try {
      await apolloClient.mutate({ mutation: LOGOUT });
    } catch (err) {
      console.error('Logout mutation failed', err);
    }
    
    // Reset all state
    setUserRole(null);
    setAppState('welcome');
    setIsLoggedIn(false);
    
    // Clear all session data from localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('appState');
    localStorage.removeItem('demographicData');
    localStorage.removeItem('providerData');
    localStorage.removeItem('loginTimestamp');

    // Keep language preference
    localStorage.setItem('currentLanguage', currentLanguage);

    // Reset session data for demographics
    updateSessionData({ demographicsCompleted: false });

    // For debugging - log remaining localStorage items
    console.log('Logout completed, user returning to welcome screen');
  };

  const handleSetAppState = (state: AppState) => {
    setAppState(state);
    localStorage.setItem('appState', state);
  };

  const handleSetLanguage = (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('currentLanguage', language);
  };

  const value: AppContextType = {
    userRole,
    appState,
    currentLanguage,
    sessionData,
    isLoggedIn,
    setUserRole,
    setAppState: handleSetAppState,
    setCurrentLanguage: handleSetLanguage,
    logout,
    login
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};