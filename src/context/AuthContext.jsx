import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profileRes = await api.get('/profile');
        setUser(profileRes.data);
      } catch (err) {
        // Error here likely means no valid cookie, user is not logged in.
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      // Token is now set in httpOnly cookie by backend
      setUser(res.data.user);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Login error", err);
      return { success: false, message: err.response?.data?.message || 'Erreur de connexion' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);

      // If user is a donor, they are not logged in immediately (waiting for validation)
      if (userData.role === 'donor') {
        return { success: true };
      }

      // Token is now set in httpOnly cookie by backend
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      console.error("Register error", err);
      return { success: false, message: err.response?.data?.message || err.message || 'Erreur d\'inscription' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
