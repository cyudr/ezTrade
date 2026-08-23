import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { TimezoneProvider } from './context/TimezoneContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TimezoneProvider>
        <App />
      </TimezoneProvider>
    </ThemeProvider>
  </StrictMode>,
);
