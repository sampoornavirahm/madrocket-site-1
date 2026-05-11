import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Code, Palette, Zap, CheckCircle } from 'lucide-react';
import { Service } from '../types';

interface ServicesProps {
  services: Service[];
}

const IconMap: Record<string, any> = {
  Rocket,
  Code,
  Palette,
  Zap
};

export const Services: React.FC<ServicesProps> = ({ services }) => {
  return (
    <section className="py-32 px-6 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Our Expertise</h2>
            <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">PREMIUM SOLUTIONS <br/> FOR DIGITAL GROWTH</h3>
          </div>
          <div className="text-gray-500 text-sm max-w-xs text-right hidden md:block">
            01 / SERVICES / EXPERTISE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
          {services.map((service, index) => {
            const Icon = IconMap[service.icon] || Zap;
            return (
              <motion.div
                key={service.id}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                className="bg-[#0a0a0a] p-10 flex flex-col items-start gap-8 group transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">{service.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 group-hover:text-gray-400 transition-colors">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-[10px] text-gray-600 uppercase font-bold">
                      <CheckCircle className="w-3 h-3 text-blue-500/50" /> Fully Managed
                    </li>
                    <li className="flex items-center gap-2 text-[10px] text-gray-600 uppercase font-bold">
                      <CheckCircle className="w-3 h-3 text-blue-500/50" /> ROI Focused
                    </li>
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
