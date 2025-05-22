import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import setupAxiosInterceptors from './services/axiosConfig'
import setupKeycloakListeners from './services/keycloakEvents'

// Thiết lập axios interceptors
setupAxiosInterceptors();

// Thiết lập keycloak event listeners
setupKeycloakListeners();

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  // </StrictMode>,
)
