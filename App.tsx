import React, { useState } from 'react';
import Hero from './components/Hero';
import HairstyleStudio from './components/HairstyleStudio';
import { ViewState } from './types';

function App() {
  const [view, setView] = useState<ViewState>('landing');

  return (
    <div className="antialiased selection:bg-neon-purple selection:text-white">
      {view === 'landing' && (
        <Hero onStart={() => setView('studio')} />
      )}
      
      {view === 'studio' && (
        <HairstyleStudio onBack={() => setView('landing')} />
      )}
    </div>
  );
}

export default App;