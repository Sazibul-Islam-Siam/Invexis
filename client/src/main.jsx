import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Set global base URL for all Axios requests
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
