
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  name: string;
  role: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('ns_token');
    const savedUser = localStorage.getItem('ns_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setToken(data.token);
    const userInfo = { name: data.name, role: data.role, email };
    setUser(userInfo);
    localStorage.setItem('ns_token', data.token);
    localStorage.setItem('ns_user', JSON.stringify(userInfo));
  };

  const signup = async (formData: any) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Signup failed');
    const data = await res.json();
    setToken(data.token);
    const userInfo = { name: data.name, role: data.role, email: formData.email };
    setUser(userInfo);
    localStorage.setItem('ns_token', data.token);
    localStorage.setItem('ns_user', JSON.stringify(userInfo));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ns_token');
    localStorage.removeItem('ns_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
