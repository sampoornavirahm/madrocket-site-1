import React from 'react';
import { motion } from 'framer-motion';

interface AboutProps {
  title: string;
  content: string;
}

export const About: React.FC<AboutProps> = ({ title, content }) => {
  return (
    <section className="py-32 px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative aspect-square md:aspect-video lg:aspect-square bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl overflow-hidden border border-white/10"
        >
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-32 h-32 bg-blue-500 rounded-full blur-[80px] animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white/5 uppercase select-none rotate-12">
            MadRocket
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 50 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
        >
          <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Who We Are</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-8 uppercase leading-tight">
            {title}
          </h3>
          <p className="text-xl text-gray-400 leading-relaxed font-light mb-12">
            {content}
          </p>
          
          <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
            <div>
              <div className="text-3xl font-black text-white mb-2">99%</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Client Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white mb-2">24/7</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Priority Orbit Support</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
