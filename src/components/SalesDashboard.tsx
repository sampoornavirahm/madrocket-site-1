import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { siteService } from '../services/siteService';
import { Lead, LeadStatus, UserProfile } from '../types';
import { 
  Plus, 
  X, 
  MoreVertical,
  Loader2,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Activity
} from 'lucide-react';

interface SalesDashboardProps {
  userProfile: UserProfile;
  teams: string[];
  batches: string[];
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ userProfile, teams: configTeams, batches: configBatches }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Status Change Modal State
  const [statusChangeLead, setStatusChangeLead] = useState<Lead | null>(null);
  const [viewingLeadLog, setViewingLeadLog] = useState<Lead | null>(null);
  const [historyComment, setHistoryComment] = useState('');
  const [isAddingHistoryComment, setIsAddingHistoryComment] = useState(false);
  const [tempStatus, setTempStatus] = useState<LeadStatus | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'New' as LeadStatus,
    notes: ''
  });

  const statuses: LeadStatus[] = [
    'New', 
    'Contacted', 
    'Qualified', 
    'Demo Scheduled', 
    'Negotiation', 
    'Closed Won', 
    'Closed Lost'
  ];

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await siteService.getLeads({ 
        salesRepId: userProfile.uid,
      });
      // Filter out deleted leads for sales persons
      setLeads(data.filter(l => l.status !== 'Deleted'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Confirm logging new lead: ${newLead.name}?`)) return;
    try {
      await siteService.addLead({
        ...newLead,
        team: userProfile.team || 'General',
        batch: userProfile.batch || 'General',
        salesRepId: userProfile.uid,
        salesRepName: userProfile.email.split('@')[0],
      });
      await siteService.createLog({
        userId: userProfile.uid,
        userName: userProfile.email.split('@')[0],
        action: 'ADD_LEAD',
        details: `Added new lead: ${newLead.name} (${newLead.email})`
      });
      setIsAdding(false);
      setNewLead({ name: '', email: '', phone: '', company: '', status: 'New', notes: '' });
      fetchLeads();
    } catch (error) {
      alert('Failed to add lead');
    }
  };

  const handleStatusChangeRequest = (lead: Lead, newStatus: LeadStatus) => {
    setStatusChangeLead(lead);
    setTempStatus(newStatus);
    setStatusComment('');
  };

  const confirmStatusChange = async () => {
    if (!statusChangeLead || !tempStatus) return;
    setIsSubmittingStatus(true);
    try {
      await siteService.updateLead(statusChangeLead.id!, { status: tempStatus });
      await siteService.createLog({
        userId: userProfile.uid,
        userName: userProfile.email.split('@')[0],
        action: 'LEAD_STATUS_CHANGE',
        details: `Updated ${statusChangeLead.name} status to ${tempStatus}`
      });
      
      const authorName = userProfile.email.split('@')[0];
      if (statusComment.trim()) {
        await siteService.addLeadComment(statusChangeLead.id!, {
          authorId: userProfile.uid,
          authorName: authorName,
          content: statusComment.trim(),
          statusUpdate: tempStatus
        });
      } else {
        // Even if no comment, log status change
        await siteService.addLeadComment(statusChangeLead.id!, {
          authorId: userProfile.uid,
          authorName: authorName,
          content: `Status updated to ${tempStatus}`,
          statusUpdate: tempStatus
        });
      }

      if (tempStatus === 'Deleted') {
        setLeads(prev => prev.filter(l => l.id !== statusChangeLead.id));
      } else {
        setLeads(prev => prev.map(l => l.id === statusChangeLead.id ? { ...l, status: tempStatus } : l));
      }
      setStatusChangeLead(null);
      setTempStatus(null);
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleAddHistoryComment = async () => {
    if (!viewingLeadLog || !historyComment.trim()) return;
    setIsAddingHistoryComment(true);
    try {
      const authorName = userProfile.email.split('@')[0];
      const newComment = {
        authorId: userProfile.uid,
        authorName: authorName,
        content: historyComment.trim()
      };
      await siteService.addLeadComment(viewingLeadLog.id!, newComment);
      await siteService.createLog({
        userId: userProfile.uid,
        userName: userProfile.email.split('@')[0],
        action: 'ADD_LEAD_COMMENT',
        details: `Comment added to lead: ${viewingLeadLog.name}`
      });
      
      // Update local state for the modal
      setViewingLeadLog(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), { ...newComment, id: Math.random().toString(), createdAt: new Date() }]
      } : null);
      
      setHistoryComment('');
    } catch (error) {
      alert('Failed to add comment');
    } finally {
      setIsAddingHistoryComment(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!window.confirm(`PERMANENT ACTION: Delete lead "${lead?.name}"? This action is recorded.`)) return;
    try {
      await siteService.deleteLead(leadId);
      await siteService.createLog({
        userId: userProfile.uid,
        userName: userProfile.email.split('@')[0],
        action: 'DELETE_LEAD',
        details: `Lead deleted: ${lead?.name} (${lead?.email})`
      });
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (error) {
      alert('Failed to delete lead');
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'Closed Won': return 'bg-green-500/20 text-green-400';
      case 'Closed Lost': return 'bg-red-500/20 text-red-400';
      case 'Negotiation': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Synchronizing Leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Sales Operations</h2>
          <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase">Lead <br/> Tracker</h3>
          <p className="mt-4 text-gray-500 text-sm font-medium uppercase tracking-widest">
            {userProfile.team} &bull; {userProfile.batch}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsAdding(true)}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-[0_20px_40px_-5px_rgba(37,99,235,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Add Lead Modal/Form */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-blue-500/30 rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-bold text-white uppercase tracking-tighter">Enter New Target</h4>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddLead} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Full Name</label>
              <input 
                required
                type="text" 
                value={newLead.name}
                onChange={e => setNewLead({...newLead, name: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Email Address</label>
              <input 
                required
                type="email" 
                value={newLead.email}
                onChange={e => setNewLead({...newLead, email: e.target.value})}
                placeholder="john@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Phone Number</label>
              <input 
                required
                type="tel" 
                value={newLead.phone}
                onChange={e => setNewLead({...newLead, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit"
                className="w-full py-4 bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-xs rounded-xl"
              >
                Log Lead into System
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Status Change Modal */}
      {statusChangeLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">Confirm Status Change</h4>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">
                  Updating {statusChangeLead.name} to {tempStatus}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 pl-1 flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" /> Add Internal Comment (Optional)
                </label>
                <textarea 
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="e.g. Spoke to client, they are ready for demo..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setStatusChangeLead(null); setTempStatus(null); }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmStatusChange}
                  disabled={isSubmittingStatus}
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] transition-all"
                >
                  {isSubmittingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Confirm Update
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lead History Log Modal */}
      {viewingLeadLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white tracking-tight">{viewingLeadLog.name}</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Lead History & Discussion</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingLeadLog(null)}
                className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar mb-6">
              {(viewingLeadLog.comments || []).length === 0 ? (
                <div className="py-12 text-center">
                  <MessageCircle className="w-8 h-8 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 uppercase font-bold tracking-widest text-[10px]">No history recorded yet.</p>
                </div>
              ) : (
                [...(viewingLeadLog.comments || [])]
                  .sort((a, b) => {
                    const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
                    const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
                    return dateB - dateA;
                  })
                  .map((comment, idx) => (
                  <div key={comment.id || idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{comment.authorName}</span>
                        {comment.statusUpdate && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase">
                            <Activity className="w-2.5 h-2.5" /> {comment.statusUpdate}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">
                        {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="relative">
                <textarea 
                  value={historyComment}
                  onChange={(e) => setHistoryComment(e.target.value)}
                  placeholder="Add a comment or note..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-blue-500 transition-all resize-none h-24"
                />
                <button 
                  onClick={handleAddHistoryComment}
                  disabled={isAddingHistoryComment || !historyComment.trim()}
                  className="absolute bottom-4 right-4 p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-white transition-all shadow-lg"
                >
                  {isAddingHistoryComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
              <button 
                onClick={() => setViewingLeadLog(null)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
              >
                Close History
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 min-w-[200px]">Client Name</th>
              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 min-w-[200px]">Contact Info</th>
              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 min-w-[180px]">Lead Status</th>
              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 min-w-[150px]">Team Track</th>
              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 min-w-[150px]">Batch Orbit</th>
              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-bold tracking-tight">{lead.name}</div>
                      <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{lead.company || 'No Company'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="space-y-1">
                    <div className="text-gray-300 text-xs flex items-center gap-2">
                       <span className="text-blue-500/50">E:</span> {lead.email}
                    </div>
                    <div className="text-gray-300 text-xs flex items-center gap-2">
                       <span className="text-blue-500/50">P:</span> {lead.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 font-mono">
                  <select 
                    value={lead.status}
                    onChange={(e) => handleStatusChangeRequest(lead, e.target.value as LeadStatus)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full outline-none border-none cursor-pointer ${getStatusColor(lead.status)}`}
                  >
                    {statuses.map(s => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
                  </select>
                </td>
                <td className="px-6 py-6">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {lead.team}
                  </span>
                </td>
                <td className="px-6 py-6 text-gray-500 text-xs">
                  {lead.batch}
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteLead(lead.id!)}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      title="Delete Lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewingLeadLog(lead)}
                      className="p-2 text-gray-600 hover:text-white transition-colors"
                      title="View History Log"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-500 uppercase tracking-widest text-xs">
                  No data detected in this sector.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
