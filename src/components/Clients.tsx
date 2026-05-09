import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2 } from 'lucide-react';

interface ClientsProps {
  clients: string[];
  onJoinRoster: () => void;
}

export const Clients: React.FC<ClientsProps> = ({ clients, onJoinRoster }) => {
  return (
    <section className="py-24 px-6 min-h-[80vh] flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-[1px] w-12 bg-blue-500/50" />
            <Users className="w-5 h-5 text-blue-500" />
            <div className="h-[1px] w-12 bg-blue-500/50" />
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase mb-6">
            Trust <br /> <span className="text-blue-500">The Mission</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm uppercase tracking-widest font-medium">
            Powering ambition for leading entrepreneurs and established brands across India.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...clients].sort((a, b) => a.localeCompare(b)).map((client, i) => (
            <motion.div
              key={client}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] opacity-40">Client Partner</span>
                <span className="text-lg font-bold text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">
                  {client}
                </span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-500/20 group-hover:text-blue-500 transition-colors" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 pt-20 border-t border-white/5 flex flex-col items-center gap-6"
        >
          <div className="text-[10px] uppercase font-black tracking-[0.5em] text-gray-500">Ready to join the roster?</div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onJoinRoster}
            className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)]"
          >
             <Users className="w-6 h-6 text-white" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
