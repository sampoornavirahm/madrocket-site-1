import React from 'react';
import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const links = ['home', 'services', 'clients', 'about', 'plans', 'contact'];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-white">
        <motion.div 
          onClick={() => onPageChange('home')}
          className="flex items-center gap-2 cursor-pointer group"
          whileHover={{ scale: 1.05 }}
        >
          <Rocket className="w-6 h-6 text-blue-500 group-hover:rotate-12 transition-transform" />
          <span className="text-xl font-bold tracking-tighter uppercase italic">Madrocket Tech & Media</span>
        </motion.div>
        
        <div className="hidden md:flex gap-8">
          {links.map((link) => (
            <button
              key={link}
              id={`nav-${link}`}
              onClick={() => onPageChange(link)}
              className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors hover:text-blue-500 ${
                currentPage === link ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              {link}
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange('contact')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hidden sm:block"
        >
          Get Started
        </motion.button>
      </div>
    </nav>
  );
};
