import React, { useEffect, useState } from 'react';
import Hero from './components/Hero';
import HairstyleStudio from './components/HairstyleStudio';
import { ViewState } from './types';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

declare global {
  interface Window {
    Telegram: any;
  }
}

function App() {
  const [view, setView] = useState<ViewState>('landing');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Настройка темы
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor || '#09090b');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor || '#ffffff');
      
      // Обработка кнопки Back
      if (view === 'studio') {
        tg.BackButton.show();
        tg.BackButton.onClick(() => setView('landing'));
      } else {
        tg.BackButton.hide();
      }
    }
  }, [view]);

  return (
    <ErrorBoundary>
      <div className="antialiased selection:bg-neon-purple selection:text-white min-h-screen bg-dark-bg text-white">
        {view === 'landing' && (
          <Hero onStart={() => setView('studio')} />
        )}
        
        {view === 'studio' && (
          <HairstyleStudio onBack={() => setView('landing')} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;