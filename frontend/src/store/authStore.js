import { create } from 'zustand';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  
  setUser: (user) => set({ user }),
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  login: async (email, password) => {
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      get().setToken(data.access_token);
      
      // Fetch user data
      const userResponse = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await userResponse.json();
      get().setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },
  
  register: async (email, password, full_name) => {
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name })
      });
      
      if (!response.ok) throw new Error('Registration failed');
      
      const data = await response.json();
      get().setToken(data.access_token);
      
      // Fetch user data
      const userResponse = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await userResponse.json();
      get().setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }
}));