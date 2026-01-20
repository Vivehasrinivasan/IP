import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Toaster } from './components/ui/sonner';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import RepositoryDetail from './pages/RepositoryDetail';
import VulnerabilityFeed from './pages/VulnerabilityFeed';
import AIKnowledgeBase from './pages/AIKnowledgeBase';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';
import './App.css';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <div className="App grain-texture">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/dashboard" element={<PublicRoute><Dashboard /></PublicRoute>} />
          <Route path="/repositories" element={<PublicRoute><Repositories /></PublicRoute>} />
          <Route path="/repositories/:id" element={<PublicRoute><RepositoryDetail /></PublicRoute>} />
          <Route path="/vulnerabilities" element={<PublicRoute><VulnerabilityFeed /></PublicRoute>} />
          <Route path="/ai-knowledge" element={<PublicRoute><AIKnowledgeBase /></PublicRoute>} />
          <Route path="/activity" element={<PublicRoute><ActivityLog /></PublicRoute>} />
          <Route path="/settings" element={<PublicRoute><Settings /></PublicRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;