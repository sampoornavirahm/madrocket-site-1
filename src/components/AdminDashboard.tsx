import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { siteService } from '../services/siteService';
import { Enquiry } from '../types';
import { Mail, User, Briefcase, Calendar, MessageSquare, Loader2, RefreshCcw, Database } from 'lucide-react';
import { DEFAULT_SITE_CONFIG } from '../constants';

export const AdminDashboard: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const fetchEnquiries = async () => {
    setLoading(true);
    const data = await siteService.getEnquiries();
    setEnquiries(data);
    setLoading(false);
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('Syncing...');
    try {
      await siteService.seedData(DEFAULT_SITE_CONFIG);
      setSyncMessage('Database synced successfully! Refreshing page...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error(error);
      setSyncMessage('Failed to sync. Check console for errors.');
    } finally {
      setSyncing(false);
      setShowConfirm(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500">Mission Control Initializing...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Admin Dashboard</h2>
            <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase">Incoming <br/> Enquiries</h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {syncMessage && (
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 mr-4 animate-pulse">
                {syncMessage}
              </span>
            )}
            <button 
              onClick={() => showConfirm ? handleSync() : setShowConfirm(true)}
              disabled={syncing}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-white text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                showConfirm ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              {showConfirm ? 'Click to Confirm Sync' : 'Merge Config with Code'}
            </button>
            {showConfirm && !syncing && (
              <button 
                onClick={() => setShowConfirm(false)}
                className="text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-white"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={fetchEnquiries}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <RefreshCcw className="w-3 h-3" /> Refresh Data
            </button>
          </div>
        </div>

        {/* Client Roster Status */}
        <div className="mb-12 bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-500">Active Client Roster</h4>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
              Live Database
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
             {DEFAULT_SITE_CONFIG.clients?.map((client) => (
               <div key={client} className="px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-white text-xs font-medium uppercase tracking-tight">
                 {client}
               </div>
             ))}
          </div>
          <p className="mt-6 text-[10px] text-gray-500 uppercase tracking-widest font-medium">To edit this list, update constants.ts and use "Merge Config with Code"</p>
        </div>

        {enquiries.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-20 text-center">
            <p className="text-gray-500 uppercase tracking-widest text-sm">No enquiries found in the galaxy yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {enquiries.map((enquiry, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={idx}
                className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-all group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</div>
                        <div className="text-white font-medium">{enquiry.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Email</div>
                        <div className="text-white font-medium break-all">{enquiry.email}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Plan</div>
                        <div className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase tracking-widest">
                          {enquiry.plan}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Received</div>
                        <div className="text-white font-medium">
                          {enquiry.createdAt?.toDate ? enquiry.createdAt.toDate().toLocaleString() : 'Just now'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mt-1 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Message</div>
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mt-1">
                          {enquiry.message}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
