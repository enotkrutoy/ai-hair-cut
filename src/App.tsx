
import React, { useState } from 'react';
import Hero from './components/Hero';
import HairstyleStudio from './components/HairstyleStudio';
import { ViewState } from './types';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  const [view, setView] = useState<ViewState>('landing');

  return (
    <ErrorBoundary>
      <div className="antialiased selection:bg-neon-purple selection:text-white">
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
