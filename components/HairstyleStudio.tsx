import React, { useState, useRef, useEffect } from 'react';
import { GenerationResult, HairstyleConfig, LoadingState, Gender, Resolution } from '../types';
import { generateHairstyle, enhanceImage } from '../services/geminiService';
import { ImageIcon, UploadIcon, SparklesIcon, TrashIcon, DownloadIcon, ZoomInIcon, XIcon, HeartIcon, ShareIcon, RefreshIcon } from './ui/Icons';

interface HairstyleStudioProps {
  onBack: () => void;
}

const MAX_FAVORITES = 10; 

// Flux AI Style List
const HAIRSTYLES = [
  // Популярное
  "Каскад", "Удлиненное каре (лоб)", "Пляжные волны", "Боб-каре", "Пикси",
  // Женские / Унисекс
  "Прямая стрижка", "Длинные прямые волосы", "Каре", "Французское каре",
  "Гарсон", "Шегги", "Волф-кат", "Асимметрия", "Свободные локоны", 
  "Плотные кудри", "Кудрявое каре", "Химическая завивка", "Голливудские волны",
  "Коса-ободок", "Коса 'Колосок'", "Афрокосички (Box Braids)", "Косы (Cornrows)",
  "Низкий пучок", "Гладкий пучок", "Небрежный пучок", "Два пучка (Space Buns)",
  "Половина наверху-половина внизу", "Высокий хвост", "Челка-занавеска", "Челка набок",
  // Мужские / Короткие
  "Афро", "Кудрявое афро", "Дреды", "Дреды (Короткие)", "Базз-кат", "Налысо",
  "Фейд", "Тейпер фейд", "Андеркат", "Высокий и короткий", "Цезарь", 
  "Французский кроп", "Текстурированный кроп", "Квифф", "Помпадур", 
  "Зачёс назад", "Зачёс набок", "Боковой пробор", "Бро Флоу", "Маллет",
  "Ирокез", "Фальшивый ирокез", "Канадка", "Айви Лига", "Мужской пучок"
];

const COLORS = [
  { name: "Чёрный", hex: "#1A1A1A" },
  { name: "Темно-каштановый", hex: "#3B2F2F" },
  { name: "Каштановый", hex: "#4A3728" },
  { name: "Светло-каштановый", hex: "#8B7355" },
  { name: "Рыжевато-каштановый", hex: "#6D3524" },
  { name: "Рыжий", hex: "#B85C38" },
  { name: "Блондин", hex: "#E6C288" },
  { name: "Платиновый блонд", hex: "#F5F5F5" },
  { name: "Пепельно-серый", hex: "#808080" },
  { name: "Серебристый", hex: "#C0C0C0" },
  { name: "Пастельно-розовый", hex: "#FFB6C1" },
  { name: "Синий", hex: "#191970" },
  { name: "Зелёный", hex: "#006400" },
];

type MobileTab = 'studio' | 'gallery';

interface OptimizationSettings {
    maxDimension: number;
    quality: number;
    isMobile: boolean;
    recommendedResolution: Resolution;
}

const HairstyleStudio: React.FC<HairstyleStudioProps> = ({ onBack }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false); // Track if image is restored
  
  // Settings
  const [optSettings, setOptSettings] = useState<OptimizationSettings>({ 
      maxDimension: 1536, quality: 0.95, isMobile: true, recommendedResolution: '1k' 
  });

  const [config, setConfig] = useState<HairstyleConfig>({
    gender: 'Не указано', 
    style: HAIRSTYLES[0], 
    color: COLORS[0].name,
    volume: 'medium', 
    prompt: '', 
    resolution: '1k' 
  });
  
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [favorites, setFavorites] = useState<GenerationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<string>('');
  
  // Mobile View State
  const [mobileTab, setMobileTab] = useState<MobileTab>('studio');

  // Modal & Compare
  const [selectedResult, setSelectedResult] = useState<GenerationResult | null>(null);
  const [compareSlider, setCompareSlider] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-detect best settings for device
  useEffect(() => {
    const width = window.innerWidth;
    const isMobileDevice = width < 768;
    const isHighEnd = width > 1400; // Large desktops
    
    // Limits synced with geminiService to prevent 500 errors
    const settings = {
        maxDimension: isMobileDevice ? 768 : (isHighEnd ? 1536 : 1024),
        quality: isMobileDevice ? 0.90 : 0.95,
        isMobile: isMobileDevice,
        recommendedResolution: (isMobileDevice ? '1k' : '2k') as Resolution
    };
    
    setOptSettings(settings);
    
    setConfig(prev => ({
        ...prev,
        resolution: settings.recommendedResolution
    }));
  }, []);

  useEffect(() => {
    // Key updated to 'astoria_favorites' to reflect branding
    const savedFavs = localStorage.getItem('astoria_favorites');
    if (savedFavs) {
        try { 
            const parsed = JSON.parse(savedFavs);
            if (Array.isArray(parsed)) setFavorites(parsed);
        } catch (e) { console.error("Failed to parse favorites", e); }
    }
  }, []);

  const saveFavoritesToStorage = (newFavorites: GenerationResult[]) => {
      try {
          localStorage.setItem('astoria_favorites', JSON.stringify(newFavorites));
          setError(null);
          return true;
      } catch (e) {
          console.error("Storage quota exceeded", e);
          setError("Ошибка сохранения: недостаточно места. Удалите старые избранные.");
          return false;
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          setUploadedImage(reader.result as string);
          setIsEnhanced(false); // Reset enhance state on new upload
          setMobileTab('studio');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualEnhance = async () => {
      if (!uploadedImage) return;
      const originalBeforeEnhance = uploadedImage; // Keep reference to "noisy" original
      
      setLoading('enhancing');
      setProgressStep('Реставрация и очистка...');
      setError(null);
      
      try {
          const enhanced = await enhanceImage(uploadedImage, optSettings.maxDimension);
          setUploadedImage(enhanced);
          setIsEnhanced(true);

          // Add Enhancement Result to History immediately
          const enhanceResult: GenerationResult = {
              id: crypto.randomUUID(),
              originalImage: originalBeforeEnhance,
              generatedImage: enhanced,
              config: { 
                  ...config, 
                  style: "HD Реставрация", 
                  prompt: "Удаление артефактов и улучшение качества" 
              },
              timestamp: Date.now()
          };
          setHistory(prev => [enhanceResult, ...prev.slice(0, 9)]);
          
      } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Ошибка улучшения";
          setError(message);
      } finally {
          setLoading('idle');
          setProgressStep('');
      }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setError(null);
    setActiveTab('history');
    
    try {
        setLoading('generating');
        const steps = ["Анализ геометрии...", "Генерация текстур...", "Финальный рендер..."];
        let stepIdx = 0;
        const interval = setInterval(() => {
            if (stepIdx < steps.length) { setProgressStep(steps[stepIdx]); stepIdx++; }
        }, 1500);
        
        const { generated, original } = await generateHairstyle(uploadedImage, config, optSettings.maxDimension, optSettings.quality);
        clearInterval(interval);
        
        const newResult: GenerationResult = {
            id: crypto.randomUUID(),
            originalImage: original,
            generatedImage: generated,
            config: { ...config },
            timestamp: Date.now()
        };
        
        setHistory(prev => [newResult, ...prev.slice(0, 9)]);
        setMobileTab('gallery');

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Неизвестная ошибка генерации";
        setError(message);
        setMobileTab('studio');
    } finally {
        setLoading('idle');
        setProgressStep('');
    }
  };

  const toggleFavorite = (result: GenerationResult, e: React.MouseEvent) => {
      e.stopPropagation();
      const exists = favorites.find(f => f.id === result.id);
      let newFavs: GenerationResult[];
      if (exists) {
          newFavs = favorites.filter(f => f.id !== result.id);
      } else {
          if (favorites.length >= MAX_FAVORITES) {
              alert(`Достигнут лимит избранного (${MAX_FAVORITES}).`);
              return;
          }
          newFavs = [result, ...favorites];
      }
      if (saveFavoritesToStorage(newFavs)) setFavorites(newFavs);
  };

  const handleDownload = (base64: string, name: string) => {
      const link = document.createElement('a');
      link.href = base64;
      link.download = `astoria-ai-studio-${name}-${Date.now()}.png`;
      link.click();
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percentage = Math.max(0, Math.min(((clientX - rect.left) / rect.width) * 100, 100));
    setCompareSlider(percentage);
  };

  const displayedResults = activeTab === 'history' ? history : favorites;

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row font-sans overflow-hidden bg-dark-bg text-white">
      
      {/* Sidebar / Studio Tab */}
      <div className={`w-full md:w-[380px] bg-dark-surface border-r border-white/10 flex-col h-full z-20 shadow-2xl flex-shrink-0 ${mobileTab === 'studio' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 bg-dark-card border-b border-white/10 flex items-center justify-between flex-shrink-0">
           <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-neon-purple border-2 border-dark-card flex items-center justify-center text-[10px] font-bold text-white">AA</div>
               <span className="text-sm font-display font-bold tracking-widest text-white">ASTORIA AI STUDIO</span>
           </div>
           <button onClick={onBack} className="text-gray-400 hover:text-white p-2">
               <XIcon className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24 md:pb-4 scrollbar-thin scrollbar-thumb-gray-700">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-lg flex flex-col gap-1">
                    <p>{error}</p>
                </div>
            )}

            {/* Compact Upload Area Logic */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            
            {uploadedImage ? (
                <div className="flex flex-col gap-2">
                    <div className="bg-dark-input rounded-xl border border-white/10 p-3 flex items-center gap-3 shadow-md relative overflow-hidden">
                        {isEnhanced && (
                            <div className="absolute top-0 right-0 bg-neon-green text-black text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10">HD</div>
                        )}
                        <img src={uploadedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <p className="text-xs text-gray-400 truncate">Фото загружено</p>
                            <div className="flex gap-3">
                                <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-gray-300 hover:text-white underline">
                                    Заменить
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Explicit Enhance Button */}
                    {!isEnhanced && (
                        <button 
                            onClick={handleManualEnhance}
                            disabled={loading !== 'idle'}
                            className={`w-full py-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all
                                ${loading !== 'idle' ? 'bg-white/5 text-gray-500 border-transparent cursor-not-allowed' 
                                : 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20'}`}
                        >
                            {loading === 'enhancing' ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                    Улучшение...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-4 h-4" />
                                    Улучшить качество фото
                                </>
                            )}
                        </button>
                    )}
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-white/10 bg-dark-input hover:border-white/30 rounded-xl p-8 text-center cursor-pointer transition-all">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><UploadIcon className="text-gray-400 w-6 h-6" /></div>
                        <p className="text-sm font-medium text-gray-300">Загрузить селфи</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="space-y-4">
                {/* Resolution - Hidden on Mobile unless manually forced in code, here we respect isMobile */}
                {!optSettings.isMobile && (
                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Разрешение</label>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-dark-input p-1 rounded-lg border border-white/5">
                            {(['1k', '2k', '4k'] as Resolution[]).map(res => (
                                <button
                                    key={res}
                                    onClick={() => setConfig(prev => ({ ...prev, resolution: res }))}
                                    className={`py-1.5 text-xs font-bold rounded-md transition-all ${config.resolution === res ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {res.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Пол</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Женский', 'Мужской', 'Не указано'] as Gender[]).map((g) => (
                            <button 
                                key={g}
                                onClick={() => setConfig(prev => ({...prev, gender: g}))}
                                className={`py-2 px-1 text-xs rounded-lg border font-medium transition-all
                                    ${config.gender === g ? 'bg-neon-purple/10 border-neon-purple text-neon-purple' : 'bg-dark-input border-white/5 text-gray-400 hover:border-white/20'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Стиль прически</label>
                    <div className="relative">
                        <select 
                            value={config.style}
                            onChange={(e) => setConfig(prev => ({...prev, style: e.target.value}))}
                            className="w-full bg-dark-input border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neon-purple appearance-none"
                        >
                            {HAIRSTYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Цвет волос</label>
                    <div className="relative">
                        <select 
                            value={config.color}
                            onChange={(e) => setConfig(prev => ({...prev, color: e.target.value}))}
                            className="w-full bg-dark-input border border-white/10 rounded-lg p-3 pl-10 text-sm text-white focus:outline-none focus:border-neon-purple appearance-none"
                        >
                            {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <div 
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: COLORS.find(c => c.name === config.color)?.hex }}
                        ></div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={!uploadedImage || loading !== 'idle'}
                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg
                        ${!uploadedImage || loading !== 'idle' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:scale-[1.02] hover:shadow-neon-purple/25'}`}
                >
                    {loading === 'generating' ? 'ГЕНЕРАЦИЯ...' : 'СГЕНЕРИРОВАТЬ'}
                </button>
            </div>
        </div>
        
        {/* Progress Bar (Visible in Studio Tab) */}
        {loading !== 'idle' && (
            <div className="absolute bottom-0 left-0 right-0 bg-dark-surface border-t border-white/10 p-4 z-30">
                <div className="flex justify-between text-xs font-bold text-gray-300 mb-2">
                    <span>{progressStep || 'Обработка...'}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-purple animate-pulse w-full"></div>
                </div>
            </div>
        )}
      </div>

      {/* Main Content / Gallery Tab */}
      <div className={`flex-1 relative h-full flex flex-col ${mobileTab === 'gallery' ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Tabs for History/Favorites */}
        <div className="flex-shrink-0 border-b border-white/5 bg-dark-bg p-4 flex items-center justify-between z-20">
             <div className="flex gap-6">
                 <button 
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-neon-purple text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                 >
                    История
                 </button>
                 <button 
                    onClick={() => setActiveTab('favorites')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'favorites' ? 'border-neon-purple text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                 >
                    Избранное
                 </button>
             </div>
             
             {/* Mobile Back to Studio Button */}
             <button onClick={() => setMobileTab('studio')} className="md:hidden text-xs font-bold text-neon-purple border border-neon-purple/30 px-3 py-1.5 rounded-full">
                 + Новая
             </button>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-dark-bg">
             {displayedResults.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-50">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><ImageIcon className="w-8 h-8" /></div>
                     <p>Здесь будут ваши результаты</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {displayedResults.map((result) => (
                         <div 
                            key={result.id} 
                            onClick={() => setSelectedResult(result)}
                            className="bg-dark-card rounded-xl overflow-hidden border border-white/5 hover:border-neon-purple/50 transition-all cursor-pointer group relative aspect-[4/5]"
                         >
                             <img src={result.generatedImage} alt="Result" className="w-full h-full object-cover" />
                             
                             {/* Overlay Info */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                 <p className="text-white font-bold text-sm">{result.config.style}</p>
                                 <p className="text-gray-400 text-xs">{result.config.color}</p>
                                 <div className="flex gap-2 mt-2">
                                     <button 
                                        onClick={(e) => toggleFavorite(result, e)}
                                        className="p-1.5 bg-white/10 rounded-full hover:bg-neon-purple hover:text-white text-gray-300 transition-colors"
                                     >
                                         <HeartIcon className="w-4 h-4" filled={favorites.some(f => f.id === result.id)} />
                                     </button>
                                 </div>
                             </div>
                             
                             {/* HD Badge if restored */}
                             {result.config.style === "HD Реставрация" && (
                                 <div className="absolute top-2 right-2 bg-neon-green text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">HD</div>
                             )}
                         </div>
                     ))}
                     <div ref={resultsEndRef} />
                 </div>
             )}
        </div>
      </div>

      {/* Comparison Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[85vh] bg-dark-surface rounded-2xl overflow-hidden flex flex-col md:flex-row relative border border-white/10 shadow-2xl">
                
                <button onClick={() => setSelectedResult(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>

                {/* Image Area - Compare Slider */}
                <div 
                    className="flex-1 relative bg-black select-none touch-none overflow-hidden"
                    onTouchMove={handleSliderMove}
                    onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
                    onClick={handleSliderMove}
                    ref={sliderRef}
                >
                    {/* After Image (Background - Fixed) */}
                    <img 
                        src={selectedResult.generatedImage} 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                        draggable="false" 
                    />
                    
                    {/* Before Image (Foreground - Clipped, NOT resized) */}
                    {/* clip-path inset(top right bottom left) */}
                    <div 
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ 
                            clipPath: `inset(0 ${100 - compareSlider}% 0 0)`
                        }}
                    >
                         <img 
                            src={selectedResult.originalImage} 
                            className="absolute inset-0 w-full h-full object-contain" 
                            draggable="false" 
                        />
                    </div>

                    {/* Slider Handle & Line */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20"
                        style={{ left: `${compareSlider}%` }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/></svg>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs font-bold pointer-events-none z-10">ДО</div>
                    <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-xs font-bold pointer-events-none z-10">ПОСЛЕ</div>
                </div>

                {/* Sidebar Info in Modal */}
                <div className="w-full md:w-80 bg-dark-card border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 className="text-xl font-display font-bold text-white mb-1">{selectedResult.config.style}</h3>
                        <p className="text-sm text-gray-400">{selectedResult.config.color}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => handleDownload(selectedResult.generatedImage, 'result')}
                            className="w-full py-3 bg-neon-purple text-white font-bold rounded-xl hover:bg-neon-purple/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <DownloadIcon className="w-5 h-5" /> Скачать результат
                        </button>
                        <button 
                            onClick={() => handleDownload(selectedResult.originalImage, 'original')}
                            className="w-full py-3 bg-dark-input border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <DownloadIcon className="w-5 h-5" /> Скачать оригинал
                        </button>
                        <button 
                            onClick={(e) => toggleFavorite(selectedResult, e)}
                            className={`w-full py-3 border font-bold rounded-xl transition-colors flex items-center justify-center gap-2
                                ${favorites.some(f => f.id === selectedResult.id) ? 'bg-white text-black border-white' : 'border-white/20 text-white hover:border-white'}`}
                        >
                            <HeartIcon className="w-5 h-5" filled={favorites.some(f => f.id === selectedResult.id)} />
                            {favorites.some(f => f.id === selectedResult.id) ? 'В избранном' : 'В избранное'}
                        </button>
                    </div>

                    <div className="mt-auto text-xs text-gray-500 border-t border-white/10 pt-4">
                        <p>ID: {selectedResult.id.slice(0, 8)}</p>
                        <p>{new Date(selectedResult.timestamp).toLocaleString()}</p>
                        <p>Разрешение: {selectedResult.config.resolution.toUpperCase()}</p>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-white/10 flex z-40 pb-safe">
           <button 
              onClick={() => setMobileTab('studio')}
              className={`flex-1 py-3 flex flex-col items-center gap-1 ${mobileTab === 'studio' ? 'text-neon-purple' : 'text-gray-500'}`}
           >
              <SparklesIcon className="w-6 h-6" />
              <span className="text-[10px] font-bold">Студия</span>
           </button>
           <button 
              onClick={() => setMobileTab('gallery')}
              className={`flex-1 py-3 flex flex-col items-center gap-1 ${mobileTab === 'gallery' ? 'text-neon-purple' : 'text-gray-500'}`}
           >
              <ImageIcon className="w-6 h-6" />
              <span className="text-[10px] font-bold">Галерея</span>
           </button>
      </div>

    </div>
  );
};

export default HairstyleStudio;