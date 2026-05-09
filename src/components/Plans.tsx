import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Plan } from '../types';

interface PlansProps {
  plans: Plan[];
  onSelectPlan: (planName: string) => void;
}

export const Plans: React.FC<PlansProps> = ({ plans, onSelectPlan }) => {
  return (
    <section className="py-32 px-6 bg-[#050505]">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Investment Strategy</h2>
        <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase">CHOOSE YOUR MISSION</h3>
        <p className="text-gray-400 mt-6 max-w-xl mx-auto">Scalable plans built for businesses at every stage of their digital journey.</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className={`relative p-8 md:p-10 rounded-[2.5rem] border flex flex-col group transition-all duration-500 ${
              plan.highlight 
                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_50px_-12px_rgba(37,99,235,0.5)]' 
                : 'bg-[#0a0a0a] border-white/5 text-white hover:border-white/20'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-xl z-10">
                Most Popular
              </div>
            )}
            
            <div className="mb-10 min-h-[160px] flex flex-col justify-end">
              <h4 className={`text-[10px] uppercase tracking-[0.5em] font-black mb-4 ${plan.highlight ? 'text-white/60' : 'text-blue-500'}`}>{plan.name}</h4>
              <div className="text-3xl md:text-5xl font-black tracking-tighter mb-2">
                {plan.price}
              </div>
              <div className={`text-[10px] uppercase tracking-widest font-bold opacity-40`}>
                Investment Tier
              </div>
            </div>
 
            <div className={`space-y-4 mb-12 flex-grow border-t pt-10 ${plan.highlight ? 'border-white/20' : 'border-white/5'}`}>
              {plan.features.map((feature, j) => (
                <div key={j} className="grid grid-cols-[16px_1fr] gap-4 items-start text-[12px] leading-tight group/item">
                  <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 transition-transform group-hover/item:scale-125 ${plan.highlight ? 'text-white' : 'text-blue-500'}`} />
                  <span className={plan.highlight ? 'text-blue-50/90' : 'text-gray-400 group-hover:text-gray-300 transition-colors'}>{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onSelectPlan(plan.name)}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                plan.highlight 
                  ? 'bg-white text-blue-600 hover:bg-blue-50' 
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Select Plan
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
