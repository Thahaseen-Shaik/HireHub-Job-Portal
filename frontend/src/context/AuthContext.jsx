import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrentUser()
        .then(res => {
          setUser(res.data.user);
          setToken(token);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const loginRes = await authAPI.login({ email, password });
    const token = loginRes.data.token;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(loginRes.data.user);
    return loginRes.data;
  };

  const register = async (name, email, password, role = 'user') => {
    return await authAPI.register({ name, email, password, role });
  };

  const verifyOTP = async (userId, otp) => {
    const res = await authAPI.verifyOTP({ userId, otp });
    const token = res.data.token;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
