import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

interface HeroProps {
  title: string;
  subtitle: string;
  cta: string;
  onCtaClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ title, subtitle, cta, onCtaClick }) => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden bg-[#050505]">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.3em] font-bold text-blue-400 mb-8"
        >
          <Rocket className="w-3 h-3" />
          Mission Control Ready
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-[112px] font-bold leading-[0.9] tracking-tighter text-white mb-8 uppercase"
        >
          {title.split(' ').map((word, i) => (
            <span key={i} className="inline-block mr-4">
              {word === 'Orbit' || word === '🚀' ? (
                <span className="text-blue-500 italic drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">{word}</span>
              ) : word}
            </span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <button
            onClick={onCtaClick}
            className="group relative inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest overflow-hidden transition-all hover:pr-14"
          >
            <span className="relative z-10">{cta}</span>
            <span className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
              →
            </span>
          </button>
        </motion.div>
      </div>

      {/* Decorative vertical lines */}
      <div className="absolute bottom-0 left-10 w-px h-32 bg-gradient-to-t from-white/20 to-transparent" />
      <div className="absolute top-0 right-10 w-px h-32 bg-gradient-to-b from-white/20 to-transparent" />
    </section>
  );
};
