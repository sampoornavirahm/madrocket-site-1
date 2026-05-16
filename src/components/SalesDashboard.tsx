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
  Activity,
  AlertCircle,
  Gem,
  Award
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
  const [searchQuery, setSearchQuery] = useState('');
  
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
    notes: '',
    // School Specific fields
    schoolName: '',
    cityArea: '',
    decisionMaker: 'Principal' as 'Principal' | 'Trustee' | 'Other',
    currentDigitalStatus: '',
    contactNumber: '',
    meetingDate: '',
    potentialTier: '1' as '1' | '2' | '3',
    leadCategory: 'Cold' as 'Cold' | 'Warm' | 'Hot' | 'Closed',
    nextActionItem: '',
    // RE Specific fields
    propertyType: 'Apartment',
    budget: '',
    locationPreference: '',
    bedrooms: '1',
    isInvestor: false,
    readyOrOffPlan: 'Ready'
  });

  const isRESalesTeam = userProfile.team?.toLowerCase().includes('dubai re');

  const statuses: LeadStatus[] = [
    'New', 
    'Contacted', 
    'Qualified', 
    'Demo Scheduled', 
    'Negotiation', 
    'Closed Won', 
    'Closed Lost'
  ];

  useEffect(() => {
    // Lead real-time listener for current sales rep
    const unsubscribe = siteService.subscribeLeads(
      { salesRepId: userProfile.uid },
      (updatedLeads) => {
        setLeads(updatedLeads.filter(l => l.status !== 'Deleted'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile.uid]);

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
      setNewLead({ 
        name: '', 
        email: '', 
        phone: '', 
        company: '', 
        status: 'New', 
        notes: '',
        schoolName: '',
        cityArea: '',
        decisionMaker: 'Principal',
        currentDigitalStatus: '',
        contactNumber: '',
        meetingDate: '',
        potentialTier: '1',
        leadCategory: 'Cold',
        nextActionItem: '',
        propertyType: 'Apartment',
        budget: '',
        locationPreference: '',
        bedrooms: '1',
        isInvestor: false,
        readyOrOffPlan: 'Ready'
      });
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

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.schoolName && l.schoolName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <div className="flex-1">
          <h2 className="text-sm uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Sales Operations</h2>
          <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase">Lead <br/> Tracker</h3>
          <p className="mt-4 text-gray-500 text-sm font-medium uppercase tracking-widest">
            {userProfile.team} &bull; {userProfile.batch}
          </p>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads name, email, phone..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs outline-none focus:border-blue-500 transition-all"
            />
            <Activity className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
        </div>

        {userProfile.enrollment?.status === 'pending' && (
          <div className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-6 py-4 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-orange-500 text-[10px] uppercase font-black tracking-widest">Enrollment Pending</div>
              <p className="text-gray-400 text-[9px] leading-relaxed mt-1 font-bold">Reviewing your credentials for the MNC internship program. Stay on standby.</p>
            </div>
          </div>
        )}

        {userProfile.enrollment?.status === 'approved' && (
          <div className="flex items-center gap-6 bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4 max-w-md">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-green-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                Internship Active <Gem className="w-3 h-3 text-blue-400" />
              </div>
              <div className="mt-2 flex gap-4">
                <div>
                  <span className="text-[8px] uppercase font-black text-gray-600 block">Fixed Stipend</span>
                  <p className="text-white text-xs font-bold font-mono">₹{userProfile.enrollment.stipend?.fixed.toLocaleString()}</p>
                </div>
                {userProfile.enrollment.stipend?.variable && (
                  <div>
                    <span className="text-[8px] uppercase font-black text-gray-600 block">Variable ({userProfile.enrollment.stipend.variable.description})</span>
                    <p className="text-white text-xs font-bold font-mono">
                      {userProfile.enrollment.stipend.variable.type === 'percentage' ? `${userProfile.enrollment.stipend.variable.value}%` : `₹${userProfile.enrollment.stipend.variable.value.toLocaleString()}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

            {/* School Specific Section */}
            {!isRESalesTeam ? (
              <div className="md:col-span-3 pt-4 border-t border-white/5 mt-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Institutional Details</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">School Name</label>
                    <input 
                      type="text" 
                      value={newLead.schoolName}
                      onChange={e => setNewLead({...newLead, schoolName: e.target.value})}
                      placeholder="Global International School"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">City/Area</label>
                    <input 
                      type="text" 
                      value={newLead.cityArea}
                      onChange={e => setNewLead({...newLead, cityArea: e.target.value})}
                      placeholder="Mumbai West"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Decision Maker</label>
                    <select 
                      value={newLead.decisionMaker}
                      onChange={e => setNewLead({...newLead, decisionMaker: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Principal">Principal</option>
                      <option value="Trustee">Trustee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1 text-blue-400">Status (C/W/H)</label>
                    <select 
                      value={newLead.leadCategory}
                      onChange={e => setNewLead({...newLead, leadCategory: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Cold">Cold</option>
                      <option value="Warm">Warm</option>
                      <option value="Hot">Hot</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Potential Tier</label>
                    <select 
                      value={newLead.potentialTier}
                      onChange={e => setNewLead({...newLead, potentialTier: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                      <option value="3">Tier 3</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Meeting Date</label>
                    <input 
                      type="date" 
                      value={newLead.meetingDate}
                      onChange={e => setNewLead({...newLead, meetingDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Direct Contact Number</label>
                    <input 
                      type="tel" 
                      value={newLead.contactNumber}
                      onChange={e => setNewLead({...newLead, contactNumber: e.target.value})}
                      placeholder="+91..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Current Digital Status</label>
                    <textarea 
                      value={newLead.currentDigitalStatus}
                      onChange={e => setNewLead({...newLead, currentDigitalStatus: e.target.value})}
                      placeholder="Mention current website, ERP, or social media presence..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 h-[46px] resize-none"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Next Action Item</label>
                    <textarea 
                      value={newLead.nextActionItem}
                      onChange={e => setNewLead({...newLead, nextActionItem: e.target.value})}
                      placeholder="Describe the immediate next step..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 h-24 resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-3 pt-4 border-t border-white/5 mt-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Real Estate Assets & Prefs</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Property Type</label>
                    <select 
                      value={newLead.propertyType}
                      onChange={e => setNewLead({...newLead, propertyType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      {['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Plot', 'Commercial'].map(t => (
                        <option key={t} value={t} className="bg-black">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Budget (AED)</label>
                    <input 
                      type="text" 
                      value={newLead.budget}
                      onChange={e => setNewLead({...newLead, budget: e.target.value})}
                      placeholder="e.g. 2M - 5M"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Location Preference</label>
                    <input 
                      type="text" 
                      value={newLead.locationPreference}
                      onChange={e => setNewLead({...newLead, locationPreference: e.target.value})}
                      placeholder="e.g. Dubai Marina, Business Bay"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Bedrooms</label>
                    <select 
                      value={newLead.bedrooms}
                      onChange={e => setNewLead({...newLead, bedrooms: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      {['Studio', '1', '2', '3', '4', '5+'].map(b => (
                        <option key={b} value={b} className="bg-black">{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Investor status</label>
                    <select 
                      value={newLead.isInvestor ? 'Yes' : 'No'}
                      onChange={e => setNewLead({...newLead, isInvestor: e.target.value === 'Yes'})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      <option value="No" className="bg-black">End User</option>
                      <option value="Yes" className="bg-black">Investor</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Ready / Off-Plan</label>
                    <select 
                      value={newLead.readyOrOffPlan}
                      onChange={e => setNewLead({...newLead, readyOrOffPlan: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Ready" className="bg-black">Ready</option>
                      <option value="Off-Plan" className="bg-black">Off-Plan</option>
                      <option value="Both" className="bg-black">Both</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 ml-1">Next Action Item</label>
                    <textarea 
                      value={newLead.nextActionItem}
                      onChange={e => setNewLead({...newLead, nextActionItem: e.target.value})}
                      placeholder="Describe the immediate next step (e.g. Schedule viewing at Marina)..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 h-24 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

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

            {/* Lead Details Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              {viewingLeadLog.team?.toLowerCase().includes('dubai re') ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Property Type</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.propertyType || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Budget</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.budget || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Location Pref</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.locationPreference || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Bedrooms</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.bedrooms || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Investor</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.isInvestor ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Ready/Off-Plan</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.readyOrOffPlan || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">School Name</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.schoolName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">City/Area</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.cityArea || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Decision Maker</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.decisionMaker || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Tier</span>
                    <p className="text-xs text-white font-bold">Tier {viewingLeadLog.potentialTier || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Category</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.leadCategory || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Meeting Date</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.meetingDate || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">D. Contact</span>
                    <p className="text-xs text-white font-bold">{viewingLeadLog.contactNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Current Tech</span>
                    <p className="text-xs text-white font-bold truncate" title={viewingLeadLog.currentDigitalStatus}>{viewingLeadLog.currentDigitalStatus || 'N/A'}</p>
                  </div>
                </>
              )}
              <div className="col-span-2 md:col-span-4 space-y-1 pt-2 border-t border-white/5">
                <span className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em]">Next Action Item</span>
                <p className="text-xs text-blue-400 font-medium italic">{viewingLeadLog.nextActionItem || 'No action item defined.'}</p>
              </div>
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
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                onClick={() => setViewingLeadLog(lead)}
                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
              >
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-bold tracking-tight">{lead.name}</div>
                      <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest leading-tight">
                        {lead.schoolName ? (
                          <span className="text-blue-500/80">{lead.schoolName}</span>
                        ) : (
                          lead.company || 'No Institution'
                        )}
                      </div>
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
                    onClick={(e) => e.stopPropagation()}
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
                <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        console.log('Delete button triggered for lead:', lead.id);
                        if (lead.id) handleDeleteLead(lead.id); 
                        else alert('Error: Lead ID missing');
                      }}
                      className="group/btn p-2 -m-2 text-gray-600 hover:text-red-500 transition-colors relative z-30 cursor-pointer"
                      title="Delete Lead"
                    >
                      <Trash2 className="w-4 h-4 pointer-events-none group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setViewingLeadLog(lead); 
                      }}
                      className="group/btn p-2 -m-2 text-gray-600 hover:text-white transition-colors relative z-30 cursor-pointer"
                      title="View Details"
                    >
                      <MoreVertical className="w-4 h-4 pointer-events-none group-hover/btn:scale-110 transition-transform" />
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
