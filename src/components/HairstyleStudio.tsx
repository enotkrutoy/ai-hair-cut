import React, { useState, useRef, useEffect } from 'react';
import { GenerationResult, HairstyleConfig, LoadingState } from '../types';
import { generateHairstyle, enhanceImage } from '../services/geminiService';
import { ImageIcon, UploadIcon, SparklesIcon, DownloadIcon, XIcon } from './ui/Icons';

interface HairstyleStudioProps {
  onBack: () => void;
}

const HAIRSTYLES = [
  "Каскад", "Удлиненное каре", "Пляжные волны", "Боб-каре", "Пикси", "Классическое каре",
  "Волф-кат", "Шегги", "Фейд", "Андеркат", "Помпадур", "Квифф", "Buzz Cut"
];

const COLORS = [
  { name: "Чёрный", hex: "#1A1A1A" },
  { name: "Каштановый", hex: "#4A3728" },
  { name: "Блондин", hex: "#E6C288" },
  { name: "Платиновый", hex: "#F5F5F5" },
  { name: "Рыжий", hex: "#B85C38" },
  { name: "Розовый", hex: "#FFB6C1" },
  { name: "Пепельный", hex: "#808080" }
];

const HairstyleStudio: React.FC<HairstyleStudioProps> = ({ onBack }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [config, setConfig] = useState<HairstyleConfig>({
    gender: 'Не указано', style: HAIRSTYLES[0], color: COLORS[0].name,
    volume: 'medium', prompt: '', resolution: '1k'
  });
  
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState(false);
  const [mobileTab, setMobileTab] = useState<'studio' | 'gallery'>('studio');
  const [selectedResult, setSelectedResult] = useState<GenerationResult | null>(null);
  const [compareSlider, setCompareSlider] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      if (uploadedImage && loading === 'idle') {
        tg.MainButton.text = "СГЕНЕРИРОВАТЬ FLUX.1";
        tg.MainButton.show();
        tg.MainButton.onClick(handleGenerate);
      } else {
        tg.MainButton.hide();
      }
    }
    return () => tg?.MainButton.offClick(handleGenerate);
  }, [uploadedImage, loading, config]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setIsEnhanced(false);
        setError(null);
        setBillingError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleError = (err: any) => {
    if (err.message === "BILLING_REQUIRED") {
      setBillingError(true);
      setError("Для генерации изображений необходимо включить биллинг (привязать карту) в Google AI Studio.");
    } else {
      setError(err.message || "Произошла ошибка при работе с ИИ.");
    }
    tg?.HapticFeedback.notificationOccurred('error');
  };

  const handleManualEnhance = async () => {
    if (!uploadedImage) return;
    setLoading('enhancing');
    setError(null);
    setBillingError(false);
    try {
      const enhanced = await enhanceImage(uploadedImage);
      setUploadedImage(enhanced);
      setIsEnhanced(true);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading('idle');
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setLoading('generating');
    setError(null);
    setBillingError(false);
    try {
      const { generated, original } = await generateHairstyle(uploadedImage, config);
      const newRes: GenerationResult = {
        id: crypto.randomUUID(), originalImage: original,
        generatedImage: generated, config: { ...config }, timestamp: Date.now()
      };
      setHistory(prev => [newRes, ...prev]);
      setMobileTab('gallery');
      tg?.HapticFeedback.notificationOccurred('success');
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading('idle');
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-dark-bg">
      <div className={`w-full md:w-[380px] glass flex flex-col h-full z-10 ${mobileTab === 'studio' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <h2 className="font-display font-bold text-neon-purple tracking-widest text-sm">FLUX PRO STUDIO</h2>
          <button onClick={onBack} className="md:hidden text-gray-400"><XIcon className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs space-y-2">
              <p className="font-bold">Ошибка:</p>
              <p>{error}</p>
              {billingError && (
                <a 
                  href="https://aistudio.google.com/app/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-2 py-2 px-3 bg-red-500 text-white rounded-lg text-center font-bold"
                >
                  Перейти в настройки биллинга
                </a>
              )}
            </div>
          )}

          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="aspect-[4/5] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-neon-purple/50 transition-all relative overflow-hidden"
          >
            {uploadedImage ? (
              <>
                <img src={uploadedImage} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-xs font-bold bg-white text-black px-3 py-1 rounded-full shadow-lg">ИЗМЕНИТЬ</span>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <UploadIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">Нажмите для загрузки селфи</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

          {uploadedImage && !isEnhanced && !billingError && (
            <button 
              onClick={handleManualEnhance}
              className="w-full py-3 glass rounded-xl text-xs font-bold text-neon-blue flex items-center justify-center gap-2 border-neon-blue/20"
            >
              <SparklesIcon className="w-4 h-4" /> УЛУЧШИТЬ КАЧЕСТВО (FLUX.1 RESTORE)
            </button>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Стиль прически</label>
              <select 
                value={config.style}
                onChange={(e) => setConfig(prev => ({...prev, style: e.target.value}))}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-neon-purple outline-none"
              >
                {HAIRSTYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Цвет</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button 
                    key={c.name}
                    onClick={() => setConfig(prev => ({...prev, color: c.name}))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${config.color === c.name ? 'border-neon-purple scale-110 shadow-lg' : 'border-transparent'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!uploadedImage || loading !== 'idle'}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold text-sm shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading === 'generating' ? 'ГЕНЕРАЦИЯ...' : 'ЗАПУСТИТЬ FLUX.1'}
            </button>
          </div>
        </div>
      </div>

      <div className={`flex-1 relative flex flex-col ${mobileTab === 'gallery' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex gap-4">
            <h3 className="text-sm font-bold text-white border-b-2 border-neon-purple pb-1">Галерея</h3>
          </div>
          <button onClick={() => setMobileTab('studio')} className="md:hidden text-xs text-neon-purple font-bold">НОВОЕ ФОТО</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p className="text-sm font-display uppercase tracking-widest">Пусто</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {history.map(res => (
                <div 
                  key={res.id} 
                  onClick={() => setSelectedResult(res)}
                  className="aspect-[4/5] rounded-xl overflow-hidden glass hover:border-neon-purple transition-all group relative cursor-pointer"
                >
                  <img src={res.generatedImage} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold text-white">{res.config.style}</p>
                    <p className="text-[9px] text-gray-400">{res.config.color}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-300">
          <div className="p-4 flex items-center justify-between glass z-10">
            <button onClick={() => setSelectedResult(null)} className="text-white p-2"><XIcon className="w-6 h-6" /></button>
            <div className="text-center">
              <p className="text-xs font-bold text-neon-purple">{selectedResult.config.style}</p>
              <p className="text-[10px] text-gray-500 uppercase">{selectedResult.config.color}</p>
            </div>
            <button 
              onClick={() => {
                const l = document.createElement('a');
                l.href = selectedResult.generatedImage;
                l.download = 'astoria-ai-result.png';
                l.click();
              }}
              className="p-2 text-white"
            >
              <DownloadIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden select-none touch-none bg-black">
            <img src={selectedResult.generatedImage} className="absolute inset-0 w-full h-full object-contain" />
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              style={{ clipPath: `inset(0 ${100 - compareSlider}% 0 0)` }}
            >
              <img src={selectedResult.originalImage} className="absolute inset-0 w-full h-full object-contain" />
            </div>
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              style={{ left: `${compareSlider}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                <div className="w-0.5 h-4 bg-gray-300 mx-0.5"></div>
                <div className="w-0.5 h-4 bg-gray-300 mx-0.5"></div>
              </div>
            </div>
            <input 
              type="range" min="0" max="100" value={compareSlider} 
              onChange={(e) => setCompareSlider(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-30"
            />
          </div>

          <div className="p-6 glass grid grid-cols-2 gap-4">
            <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Свайпай ползунок для сравнения</div>
            <button 
              className="py-3 bg-neon-purple text-white rounded-xl text-xs font-bold"
              onClick={() => setSelectedResult(null)}
            >
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 glass flex items-center justify-around p-3 z-40 border-t border-white/5">
        <button 
          onClick={() => setMobileTab('studio')}
          className={`flex flex-col items-center gap-1 ${mobileTab === 'studio' ? 'text-neon-purple' : 'text-gray-500'}`}
        >
          <SparklesIcon className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Студия</span>
        </button>
        <button 
          onClick={() => setMobileTab('gallery')}
          className={`flex flex-col items-center gap-1 ${mobileTab === 'gallery' ? 'text-neon-purple' : 'text-gray-500'}`}
        >
          <ImageIcon className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Галерея</span>
        </button>
      </div>

      {loading !== 'idle' && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(217,70,239,0.5)]"></div>
          <h4 className="text-xl font-display font-bold text-white mb-2">FLUX.1 В ПРОЦЕССЕ</h4>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">Наш ИИ моделирует фото в HD качестве. Это займет всего несколько секунд...</p>
        </div>
      )}
    </div>
  );
};

export default HairstyleStudio;