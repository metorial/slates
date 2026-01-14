import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';

import './index.css';
import './reset.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <App />
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
