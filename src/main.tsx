import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './ui/App';
import { useGameStore } from './store/gameStore';
import './ui/ui.css';
import './styles.css';

registerSW({ immediate: true });

// ?debug=1 exposes the store for the debug panel (milestone 7) and browser-driven tests.
if (new URLSearchParams(window.location.search).has('debug')) {
  (window as unknown as { __pagoda: { store: typeof useGameStore } }).__pagoda = { store: useGameStore };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
