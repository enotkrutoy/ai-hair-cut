import React from 'react';
import { ArrowRightIcon } from './ui/Icons';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden bg-dark-bg text-white font-sans">
      
      {/* Conceptual Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Main Background Image - Conceptual & Semi-transparent */}
          <div className="absolute inset-0 bg-[url('https://c.topshort.org/fluxpro/ai_haircut/benefits.webp')] bg-cover bg-center opacity-20 mix-blend-screen"></div>
          
          {/* Dark Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-dark-bg/80 to-dark-bg"></div>
          
          {/* Neon Glow Effects - Alive & Pulsing */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-neon-purple opacity-20 blur-[150px] animate-pulse-slow mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-blue opacity-20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="z-10 w-full max-w-7xl px-4 md:px-6 py-10 md:py-20 flex flex-col items-center text-center relative">
        
        {/* Header Section */}
        <div className="max-w-4xl mx-auto mb-12 md:mb-20">
          <div className="inline-block px-3 py-1 rounded-full border border-neon-purple/30 bg-black/40 backdrop-blur-sm text-neon-purple text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_-5px_rgba(217,70,239,0.3)]">
            Astoria AI Studio
          </div>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 tracking-tight leading-tight drop-shadow-2xl">
            ИИ-генератор <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neon-purple/50 to-white">причёсок</span>
          </h1>
          <p className="text-gray-300 text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-lg">
            Преобразите свой образ с помощью виртуального моделирования. Профессиональный симулятор стрижек, доступный каждому.
          </p>
          <button 
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-neon-purple text-white font-bold rounded-full text-base md:text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(217,70,239,0.8)] border border-white/20"
          >
            Начните своё путешествие
            <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Features Section */}
        <div className="w-full mb-16 md:mb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-left">
                {/* Feature 1 */}
                <div className="bg-dark-card/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 hover:border-neon-purple/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                         <div className="w-20 h-20 rounded-full bg-neon-purple blur-xl"></div>
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Виртуальная укладка</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Примерьте разные причёски виртуально перед реальными изменениями в салоне.</p>
                </div>

                 {/* Feature 2 */}
                 <div className="bg-dark-card/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 hover:border-neon-purple/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                         <div className="w-20 h-20 rounded-full bg-white blur-xl"></div>
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Множество стилей</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Выбирайте из сотен модных и классических причёсок под форму вашего лица.</p>
                </div>

                 {/* Feature 3 */}
                 <div className="bg-dark-card/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 hover:border-neon-purple/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                         <div className="w-20 h-20 rounded-full bg-neon-purple blur-xl"></div>
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Визуализация цвета</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Просматривайте разные цвета волос и мелирование для полного изменения стиля.</p>
                </div>

                 {/* Feature 4 */}
                 <div className="bg-dark-card/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 hover:border-neon-purple/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                         <div className="w-20 h-20 rounded-full bg-white blur-xl"></div>
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-bold text-white mb-2 md:mb-3">HD Качество</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Получайте реалистичные превью с точной цветопередачей и естественным видом.</p>
                </div>
            </div>
        </div>

        {/* Examples Section */}
        <div className="w-full max-w-7xl mb-16 md:mb-32">
            <div className="text-center mb-8 md:mb-16">
                 <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">Реальные результаты</h2>
                 <div className="w-20 h-1 bg-neon-purple mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 {/* Example 1 */}
                 <div className="rounded-3xl overflow-hidden border border-white/10 relative group h-[300px] md:h-[500px] shadow-2xl">
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                     <img src="https://c.topshort.org/fluxpro/ai_haircut/key_feature/4.webp" alt="AI Hairstyle Example 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                     <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/50 to-transparent z-20">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">Style Transfer</div>
                        <h3 className="text-white font-bold text-xl">Полное преображение</h3>
                     </div>
                 </div>
                 
                 {/* Example 2 */}
                 <div className="rounded-3xl overflow-hidden border border-white/10 relative group h-[300px] md:h-[500px] shadow-2xl">
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                     <img src="https://c.topshort.org/fluxpro/ai_haircut/scene/q.webp" alt="AI Hairstyle Example 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                     <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/50 to-transparent z-20">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">Color Match</div>
                         <h3 className="text-white font-bold text-xl">Живые сценарии</h3>
                     </div>
                 </div>
            </div>
        </div>

        {/* How It Works Steps */}
        <div className="w-full max-w-4xl pb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 md:mb-12">Как это работает</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                 <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                     <div className="text-4xl mb-4">📸</div>
                     <h3 className="font-bold text-white mb-2">Загрузите фото</h3>
                     <p className="text-gray-400 text-sm">Чёткое селфи с хорошим светом.</p>
                 </div>
                 <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                     <div className="text-4xl mb-4">🎨</div>
                     <h3 className="font-bold text-white mb-2">Выберите стиль</h3>
                     <p className="text-gray-400 text-sm">Цвет, длина, укладка.</p>
                 </div>
                 <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                     <div className="text-4xl mb-4">✨</div>
                     <h3 className="font-bold text-white mb-2">Готово</h3>
                     <p className="text-gray-400 text-sm">Сохраните и поделитесь.</p>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Hero;