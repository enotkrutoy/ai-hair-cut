import React, { useState, useRef, useEffect } from 'react';
import { Character, Scene, LoadingState } from '../types';
import { generateCharacterImage, generateSceneImage } from '../services/geminiService';
import { ImageIcon, FilmIcon, PlusIcon, SparklesIcon, TrashIcon } from './ui/Icons';

interface CharacterStudioProps {
  onBack: () => void;
}

const CharacterStudio: React.FC<CharacterStudioProps> = ({ onBack }) => {
  // State
  const [character, setCharacter] = useState<Character | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Inputs
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [style, setStyle] = useState('Cinematic 3D Render');
  const [scenePrompt, setScenePrompt] = useState('');

  // Scroll ref
  const scenesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scenesEndRef.current) {
      scenesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scenes]);

  const handleCreateCharacter = async () => {
    if (!charName || !charDesc) return;
    setLoading('generating-character');
    setError(null);
    try {
      const image = await generateCharacterImage(charDesc, style);
      const newChar: Character = {
        id: crypto.randomUUID(),
        name: charName,
        description: charDesc,
        baseImage: image,
        createdAt: Date.now()
      };
      setCharacter(newChar);
    } catch (err: any) {
      setError(err.message || "Failed to generate character.");
    } finally {
      setLoading('idle');
    }
  };

  const handleCreateScene = async () => {
    if (!character || !scenePrompt) return;
    setLoading('generating-scene');
    setError(null);
    try {
      const image = await generateSceneImage(character.baseImage, character.description, scenePrompt, style);
      const newScene: Scene = {
        id: crypto.randomUUID(),
        characterId: character.id,
        description: scenePrompt,
        image: image,
        timestamp: Date.now()
      };
      setScenes(prev => [...prev, newScene]);
      setScenePrompt('');
    } catch (err: any) {
      setError(err.message || "Failed to generate scene.");
    } finally {
      setLoading('idle');
    }
  };

  const reset = () => {
    setCharacter(null);
    setScenes([]);
    setCharName('');
    setCharDesc('');
    setScenePrompt('');
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col md:flex-row">
      {/* Left Sidebar: Controls */}
      <div className="w-full md:w-[400px] border-r border-white/10 bg-dark-surface p-6 flex flex-col h-auto md:h-screen overflow-y-auto z-20 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">GEMPIX2 <span className="text-neon-purple">Studio</span></h2>
          <button onClick={onBack} className="text-xs text-gray-500 hover:text-white transition-colors">Exit</button>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg mb-4">
                {error}
            </div>
        )}

        {!character ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Identity Name</label>
              <input 
                type="text" 
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="e.g. Detective Orion"
                className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Visual Description</label>
              <textarea 
                value={charDesc}
                onChange={(e) => setCharDesc(e.target.value)}
                placeholder="e.g. A rugged cyberpunk warrior with a neon scar on left cheek, wearing matte black tactical gear. Silver hair, sharp eyes."
                className="w-full h-32 bg-dark-bg border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neon-blue transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Artistic Style</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neon-blue transition-colors appearance-none"
              >
                <option value="Cinematic 3D Render">Cinematic 3D Render (Pixar/Disney)</option>
                <option value="Cyberpunk Concept Art">Cyberpunk Concept Art</option>
                <option value="Photorealistic 8K">Photorealistic 8K</option>
                <option value="Anime Studio Ghibli">Anime (Studio Ghibli)</option>
                <option value="Dark Fantasy Oil Painting">Dark Fantasy Oil Painting</option>
              </select>
            </div>
            
            <button 
              onClick={handleCreateCharacter}
              disabled={loading !== 'idle' || !charName || !charDesc}
              className={`w-full py-4 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2
                ${loading !== 'idle' || !charName || !charDesc ? 'bg-gray-700 cursor-not-allowed' : 'bg-neon-green hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,157,0.4)]'}`}
            >
              {loading === 'generating-character' ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  Forging Identity...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Character
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Active Character Profile */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 pointer-events-none"></div>
                <img src={character.baseImage} alt={character.name} className="w-full aspect-square object-cover rounded-lg mb-3 shadow-lg" />
                <div className="relative z-20">
                    <h3 className="font-display text-xl font-bold">{character.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{character.description}</p>
                </div>
                <button onClick={reset} className="absolute top-2 right-2 z-30 p-2 bg-black/50 hover:bg-red-500/80 rounded-full backdrop-blur-md transition-colors">
                    <TrashIcon className="w-4 h-4 text-white" />
                </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">New Scene Scenario</label>
              <textarea 
                value={scenePrompt}
                onChange={(e) => setScenePrompt(e.target.value)}
                placeholder={`Describe where ${character.name} is or what they are doing... (e.g., sitting in a futuristic cafe drinking coffee, fighting a dragon)`}
                className="w-full h-32 bg-dark-bg border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neon-purple transition-colors resize-none"
              />
            </div>

            <button 
              onClick={handleCreateScene}
              disabled={loading !== 'idle' || !scenePrompt}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
                ${loading !== 'idle' || !scenePrompt ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-neon-purple to-neon-blue hover:shadow-[0_0_20px_rgba(176,38,255,0.4)]'}`}
            >
               {loading === 'generating-scene' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Rendering Scene...
                </>
              ) : (
                <>
                  <FilmIcon className="w-5 h-5" />
                  Generate Scene
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
                Nano Banana 2 maintains character identity tokens across all generated scenes.
            </p>
          </div>
        )}
      </div>

      {/* Right Content: Gallery/Canvas */}
      <div className="flex-1 bg-dark-bg relative overflow-y-auto h-screen p-6 md:p-12">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-dark-bg to-dark-bg opacity-50"></div>
        
        {scenes.length === 0 && !character ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-300">Workspace Empty</h3>
                <p className="text-gray-500 max-w-md mt-2">Create a character on the left to begin your storytelling journey.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto relative z-10 pb-20">
                 {/* Base Character Display if no scenes yet */}
                 {scenes.length === 0 && character && (
                     <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-700">
                        <p className="text-neon-green font-mono text-sm mb-4 tracking-widest uppercase">Identity Established</p>
                        <div className="relative group">
                             <div className="absolute -inset-1 bg-gradient-to-r from-neon-green to-neon-blue rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                             <img src={character.baseImage} alt="Base" className="relative w-[512px] h-[512px] object-cover rounded-xl shadow-2xl border border-white/10" />
                        </div>
                        <p className="mt-8 text-gray-400 text-center max-w-lg">
                            Now use the sidebar to place <strong className="text-white">{character.name}</strong> into new situations. The AI will preserve their features.
                        </p>
                     </div>
                 )}

                 {/* Timeline of Scenes */}
                 {scenes.map((scene, index) => (
                     <div key={scene.id} className="flex flex-col gap-4 animate-in slide-in-from-bottom-10 fade-in duration-700 fill-mode-backwards" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex items-center gap-4 text-gray-500 text-sm font-mono">
                            <span className="w-8 h-[1px] bg-gray-700"></span>
                            <span>Scene {index + 1}</span>
                            <span className="w-full h-[1px] bg-gray-700"></span>
                        </div>
                        <div className="bg-dark-card border border-white/5 rounded-2xl p-4 overflow-hidden shadow-2xl hover:border-white/20 transition-all">
                            <img src={scene.image} alt="Scene" className="w-full h-auto rounded-lg shadow-md" />
                            <div className="mt-4 px-2">
                                <p className="text-lg text-gray-200">{scene.description}</p>
                            </div>
                        </div>
                     </div>
                 ))}
                 
                 {/* Loading skeleton for scene */}
                 {loading === 'generating-scene' && (
                     <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center animate-pulse gap-4">
                        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-mono text-sm">Synthesizing Context & Identity...</p>
                     </div>
                 )}

                 <div ref={scenesEndRef} />
            </div>
        )}
      </div>
    </div>
  );
};

export default CharacterStudio;