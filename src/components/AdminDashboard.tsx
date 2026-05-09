import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { siteService } from '../services/siteService';
import { Enquiry, SiteConfig } from '../types';
import { Mail, User, Briefcase, Calendar, MessageSquare, Loader2, RefreshCcw, Database, Plus, Trash2, Users } from 'lucide-react';
import { DEFAULT_SITE_CONFIG } from '../constants';

export const AdminDashboard: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'enquiries' | 'clients'>('enquiries');

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const [planFilter, setPlanFilter] = useState('All Plans');
  const [newClient, setNewClient] = useState('');

  const fetchData = async (filter?: string) => {
    setLoading(true);
    try {
      const [enquiriesData, configData] = await Promise.all([
        siteService.getEnquiries(filter === 'All Plans' ? undefined : filter),
        siteService.getConfig()
      ]);
      setEnquiries(enquiriesData);
      setConfig(configData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const handleAddClient = async () => {
    if (!newClient.trim() || !config) return;
    const updatedClients = [...(config.clients || []), newClient.trim()];
    try {
      await siteService.updateClients(updatedClients);
      setConfig({ ...config, clients: updatedClients });
      setNewClient('');
    } catch (error) {
      alert('Failed to add client');
    }
  };

  const handleDeleteClient = async (clientToDelete: string) => {
    if (!config || !window.confirm(`Remove ${clientToDelete}?`)) return;
    const updatedClients = (config.clients || []).filter(c => c !== clientToDelete);
    try {
      await siteService.updateClients(updatedClients);
      setConfig({ ...config, clients: updatedClients });
    } catch (error) {
      alert('Failed to delete client');
    }
  };

  useEffect(() => {
    fetchData(planFilter);
  }, [planFilter]);

  const plans = [
    'All Plans',
    'The Digital Foundation',
    'The Adaptive Subscription',
    'The Virtual Campus (Elite)',
    'Custom Consultation'
  ];

  if (loading && !config) {
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Command Center</h2>
            <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase">Admin <br/> Dashboard</h3>
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
              onClick={() => fetchData(planFilter)}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <RefreshCcw className="w-3 h-3" /> Refresh Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-12 bg-white/5 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('enquiries')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'enquiries' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            Enquiries
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'clients' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            Client Roster
          </button>
        </div>

        {activeTab === 'enquiries' ? (
          <div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 w-fit mb-8">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Filter Mission:</span>
              <select 
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-bold uppercase tracking-widest outline-none border-none cursor-pointer"
              >
                {plans.map(plan => (
                  <option key={plan} value={plan} className="bg-[#0a0a0a]">{plan}</option>
                ))}
              </select>
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
        ) : (
          <div className="space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
              <h4 className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-500 mb-6">Engage New Client</h4>
              <div className="flex gap-4">
                <input 
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Enter Client Name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all"
                />
                <button 
                  onClick={handleAddClient}
                  disabled={!newClient.trim()}
                  className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add to Roster
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...(config?.clients || [])].sort((a, b) => a.localeCompare(b)).map((client) => (
                <motion.div 
                  layout
                  key={client} 
                  className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-white font-bold uppercase tracking-tight text-sm">{client}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteClient(client)}
                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
