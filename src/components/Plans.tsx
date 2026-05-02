import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Plan } from '../types';

interface PlansProps {
  plans: Plan[];
}

export const Plans: React.FC<PlansProps> = ({ plans }) => {
  return (
    <section className="py-32 px-6 bg-[#050505]">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Investment Strategy</h2>
        <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase">CHOOSE YOUR MISSION</h3>
        <p className="text-gray-400 mt-6 max-w-xl mx-auto">Scalable plans built for businesses at every stage of their digital journey.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className={`relative p-10 rounded-3xl border flex flex-col ${
              plan.highlight 
                ? 'bg-blue-600 border-blue-500 text-white' 
                : 'bg-[#0a0a0a] border-white/5 text-white'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                Most Popular
              </div>
            )}
            
            <div className="mb-10">
              <h4 className="text-xs uppercase tracking-[0.3em] font-black opacity-60 mb-2">{plan.name}</h4>
              <div className="text-5xl font-black tracking-tighter">
                {plan.price}
                {plan.price !== 'Custom' && <span className="text-sm font-medium opacity-50 ml-1">/ project</span>}
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-grow">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3 text-sm">
                  <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-blue-500'}`} />
                  <span className={plan.highlight ? 'text-blue-50 text-opacity-90' : 'text-gray-400'}>{feature}</span>
                </li>
              ))}
            </ul>

            <button className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
              plan.highlight 
                ? 'bg-white text-blue-600 hover:bg-blue-50' 
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}>
              Select Plan
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
