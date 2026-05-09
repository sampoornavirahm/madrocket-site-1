import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Mail, CheckCircle2 } from 'lucide-react';
import { siteService } from '../services/siteService';

interface ContactProps {
  email: string;
  address: string;
}

export const Contact: React.FC<ContactProps> = ({ email, address }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', plan: 'Starter', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await siteService.submitEnquiry(formData);
      setStatus('success');
      setFormData({ name: '', email: '', plan: 'Starter', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <section className="py-32 px-6 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div>
          <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Contact</h2>
          <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase mb-8">Ready to <br/> Launch?</h3>
          <p className="text-gray-400 mb-12 max-w-md">Drop us a line and let's discuss how we can help you achieve orbit with your next big project.</p>
          
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-blue-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Email Us</div>
                <div className="text-white font-medium">{email}</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-blue-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Our Base</div>
                <div className="text-white font-medium">{address}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <form onSubmit={handleSubmit} className="bg-[#0a0a0a] p-10 rounded-3xl border border-white/5 relative z-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Interested Plan</label>
                <select
                  required
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="Starter">Starter Plan</option>
                  <option value="Pro">Professional Plan</option>
                  <option value="Enterprise">Enterprise Plan</option>
                  <option value="Custom">Custom Orbit (Tailored)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Project Details</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                  placeholder="Tell us about your mission..."
                />
              </div>
              
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`w-full py-5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                  status === 'loading' ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {status === 'loading' ? (
                  <>Launching Mission...</>
                ) : (
                  <>
                    Send Message <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-blue-600 rounded-3xl flex flex-col items-center justify-center text-white p-10 text-center z-20"
                >
                  <CheckCircle2 className="w-16 h-16 mb-6" />
                  <h4 className="text-2xl font-bold mb-2">Message Received!</h4>
                  <p className="text-blue-100">Our mission control team will reach out to you within 24 hours.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </section>
  );
};
