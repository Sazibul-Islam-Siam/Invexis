import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Set global base URL for all Axios requests
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Automatically attach active company header for supplier context
axios.interceptors.request.use((config) => {
  const activeCompany = localStorage.getItem('activeCompany');
  if (activeCompany) {
    config.headers['X-Active-Company'] = activeCompany;
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
