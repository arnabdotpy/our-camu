import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Service worker registration is handled by Vite PWA plugin
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Service worker support detected');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
