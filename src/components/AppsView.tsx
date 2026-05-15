import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Grid, ShieldCheck, Target, Mail, Folder, LifeBuoy, Rocket, Globe, Plus, X, Trash2 } from 'lucide-react';
import { ConfigApp, SiteConfig } from '../types';
import { siteService } from '../services/siteService';

interface AppsViewProps {
  apps: ConfigApp[];
  isAdmin: boolean;
  onUpdate: (updatedApps: ConfigApp[]) => void;
}

const IconMap: { [key: string]: any } = {
  ShieldCheck,
  Target,
  Grid,
  Mail,
  Folder,
  LifeBuoy,
  Rocket,
  Globe
};

export function AppsView({ apps, isAdmin, onUpdate }: AppsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApp, setNewApp] = useState({ title: '', link: '', icon: 'Rocket' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddApp = async () => {
    if (!newApp.title || !newApp.link) return;
    setIsSubmitting(true);
    try {
      const updatedApps = [...apps, { id: Date.now().toString(), ...newApp }];
      await siteService.updateConfig({ apps: updatedApps } as Partial<SiteConfig>);
      onUpdate(updatedApps);
      setShowAddModal(false);
      setNewApp({ title: '', link: '', icon: 'Rocket' });
    } catch (error) {
      alert('Failed to deploy application link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveApp = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Erase this application link from the ecosystem?')) return;
    try {
      const updatedApps = apps.filter(app => app.id !== id);
      await siteService.updateConfig({ apps: updatedApps } as Partial<SiteConfig>);
      onUpdate(updatedApps);
    } catch (error) {
      alert('Failed to remove application link');
    }
  };

  return (
    <div className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
            <Grid className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Internal <br/> App Ecosystem</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-3">Verified Corporate Tools & Terminals</p>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Authorize New App
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {apps.map((app, index) => {
          const Icon = app.icon && IconMap[app.icon] ? IconMap[app.icon] : Rocket;
          return (
            <motion.a
              key={app.id}
              href={app.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group bg-[#0f0f0f] border border-white/5 hover:border-blue-500/30 rounded-3xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] relative"
            >
              {isAdmin && (
                <button 
                  onClick={(e) => handleRemoveApp(app.id, e)}
                  className="absolute top-4 right-4 p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] group-hover:bg-blue-500/10 flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-all border border-white/5 group-hover:border-blue-500/20">
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-[10px] font-black text-gray-300 group-hover:text-white uppercase tracking-widest mb-1 transition-colors">
                  {app.title}
                </h3>
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Connect</span>
                  <ExternalLink className="w-2 h-2 text-blue-500" />
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* Add App Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                id="close-modal"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">New Terminal</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Authorize internal application</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] text-blue-500 font-black uppercase tracking-widest pl-1">Application Title</label>
                  <input 
                    type="text"
                    value={newApp.title}
                    onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                    placeholder="e.g. HR Portal"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-blue-500 font-black uppercase tracking-widest pl-1">Terminal Link (URL)</label>
                  <input 
                    type="text"
                    value={newApp.link}
                    onChange={(e) => setNewApp({ ...newApp, link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono outline-none focus:border-blue-500 transition-all text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-blue-500 font-black uppercase tracking-widest pl-1">Icon Profile</label>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.keys(IconMap).map((iconKey) => {
                      const IconComp = IconMap[iconKey];
                      return (
                        <button
                          key={iconKey}
                          onClick={() => setNewApp({ ...newApp, icon: iconKey })}
                          className={`p-4 rounded-xl border flex items-center justify-center transition-all ${
                            newApp.icon === iconKey 
                              ? 'bg-blue-600 border-blue-500 text-white' 
                              : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleAddApp}
                  disabled={isSubmitting || !newApp.title || !newApp.link}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 mt-4"
                  id="submit-app"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Deploy Application
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
