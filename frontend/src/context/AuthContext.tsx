import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, LoginCredentials } from '../api/authApi';

import { employeeApi } from '../api/employeeApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('pms_user');
    const token = localStorage.getItem('pms_token');
    if (savedUser && token) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);

      // Async sync profile photo and name
      employeeApi.getProfile()
        .then((p) => {
          if (p.profilePhoto !== parsed.profilePhoto || p.name !== parsed.name) {
            const updated = { ...parsed, name: p.name, profilePhoto: p.profilePhoto };
            setUser(updated);
            localStorage.setItem('pms_user', JSON.stringify(updated));
          }
        })
        .catch((e) => console.warn('Could not sync profile details', e));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('pms_token', response.token);
      localStorage.setItem('pms_user', JSON.stringify(response));
      setUser(response);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedFields };
    setUser(newUser);
    localStorage.setItem('pms_user', JSON.stringify(newUser));
  };

  const logout = () => {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
