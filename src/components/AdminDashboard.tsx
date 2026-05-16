import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { siteService } from '../services/siteService';
import { Enquiry, SiteConfig, Lead, UserProfile, LeadStatus, SystemLog } from '../types';
import { PersonnelProfile } from './PersonnelProfile';
import { Mail, User, Briefcase, Calendar, MessageSquare, Loader2, RefreshCcw, Database, Plus, Trash2, Users, Target, Save, BarChart3, TrendingUp, Shield, Orbit, Activity, MessageCircle, CheckCircle2, X, MoreVertical, ClipboardList } from 'lucide-react';
import { DEFAULT_SITE_CONFIG } from '../constants';

interface AdminDashboardProps {
  config: SiteConfig;
  userProfile: UserProfile;
  activeTab: 'enquiries' | 'clients' | 'marketing' | 'leads' | 'team' | 'logs';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ config: initialConfig, userProfile, activeTab }) => {
  const isAdminUser = userProfile.role === 'admin';
  const isManagerUser = userProfile.role === 'manager';

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(initialConfig);
  const [loading, setLoading] = useState(true);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const pendingUsers = users.filter(u => {
    const isPending = u.status === 'pending' || !u.status;
    if (!isPending) return false;
    if (isManagerUser) return u.role === 'sales';
    return true;
  });

  const activeUsers = users.filter(u => {
    const isActive = u.status === 'active' || u.status === 'denied';
    if (!isActive) return false;
    if (isManagerUser) return u.role === 'sales' && u.team === userProfile.team;
    return true;
  });

  const [planFilter, setPlanFilter] = useState('All Plans');
  const [teamFilter, setTeamFilter] = useState(isManagerUser ? (userProfile.team || 'All Teams') : 'All Teams');
  const [batchFilter, setBatchFilter] = useState('All Batches');
  const [userFilter, setUserFilter] = useState('All Users');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Change Modal State
  const [statusChangeLead, setStatusChangeLead] = useState<Lead | null>(null);
  const [viewingLeadLog, setViewingLeadLog] = useState<Lead | null>(null);
  const [historyComment, setHistoryComment] = useState('');
  const [isAddingHistoryComment, setIsAddingHistoryComment] = useState(false);
  const [tempStatus, setTempStatus] = useState<LeadStatus | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Activation Modal State
  const [activatingUser, setActivatingUser] = useState<UserProfile | null>(null);
  const [activationRole, setActivationRole] = useState<UserProfile['role']>('sales');
  const [activationTeam, setActivationTeam] = useState<string>('');
  const [activationBatch, setActivationBatch] = useState<string>('');

  const [newClient, setNewClient] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newBatch, setNewBatch] = useState('');

  const [marketingState, setMarketingState] = useState({
    googleAnalyticsId: '',
    googleTagManagerId: '',
    metaPixelId: ''
  });

  // Enrollment Modal State
  const [enrollmentActionUser, setEnrollmentActionUser] = useState<UserProfile | null>(null);
  const [enrollmentComment, setEnrollmentComment] = useState('');
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);
  
  // Review Modal State
  const [reviewingEnrollmentUser, setReviewingEnrollmentUser] = useState<UserProfile | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [stipendConfig, setStipendConfig] = useState({
    fixed: 0,
    variableType: 'amount' as 'amount' | 'percentage',
    variableValue: 0,
    variableDesc: ''
  });

  const fetchData = async (filter?: string) => {
    setLoading(true);
    try {
      // Determine filters based on role
      const leadFilters = {
        team: isAdminUser ? (teamFilter === 'All Teams' ? undefined : teamFilter) : userProfile.team,
        batch: batchFilter === 'All Batches' ? undefined : batchFilter,
        salesRepId: userFilter === 'All Users' ? undefined : userFilter
      };

      const userTeamFilter = isManagerUser ? userProfile.team : undefined;

      const [enquiriesData, configData, leadsData, usersData, logsData] = await Promise.all([
        isAdminUser ? siteService.getEnquiries(filter === 'All Plans' ? undefined : filter) : Promise.resolve([]),
        siteService.getConfig(),
        siteService.getLeads(leadFilters),
        (isAdminUser || isManagerUser) ? siteService.getAllUsers(userTeamFilter) : Promise.resolve([]),
        isAdminUser ? siteService.getLogs() : Promise.resolve([])
      ]);
      setEnquiries(enquiriesData);
      setLeads(leadsData);
      setUsers(usersData);
      setConfig(configData);
      setSystemLogs(logsData);
      if (configData?.marketing) {
        setMarketingState({
          googleAnalyticsId: configData.marketing.googleAnalyticsId || '',
          googleTagManagerId: configData.marketing.googleTagManagerId || '',
          metaPixelId: configData.marketing.metaPixelId || ''
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (action: string, details: string) => {
    try {
      await siteService.createLog({
        userId: userProfile.uid,
        userName: userProfile.email.split('@')[0],
        action,
        details
      });
      // Optionally refresh logs if in logs tab
      if (activeTab === 'logs') {
        const logs = await siteService.getLogs();
        setSystemLogs(logs);
      }
    } catch (e) {
      console.error('Failed to log action', e);
    }
  };

  const handleForceReload = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const teamFilter = isManagerUser ? userProfile.team : undefined;
      const allUsers = await siteService.getAllUsers(teamFilter);
      setUsers(allUsers);
      setSyncMessage('Personnel database reloaded');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err: any) {
      setFetchError(`Force Reload Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateEnrollment = async () => {
    if (!enrollmentActionUser || !enrollmentComment.trim()) return;
    setIsProcessingEnrollment(true);
    try {
      await siteService.activateEnrollment(enrollmentActionUser.uid, enrollmentComment.trim());
      await logAction('ACTIVATE_INTERN_ENROLLMENT', `Activated enrollment form for ${enrollmentActionUser.email}`);
      setUsers(prev => prev.map(u => u.uid === enrollmentActionUser.uid ? { ...u, isEnrollmentActive: true, enrollment: { ...u.enrollment, comment: enrollmentComment.trim(), status: 'none' } as any } : u));
      setEnrollmentActionUser(null);
      setEnrollmentComment('');
      setSyncMessage('Enrollment form activated for user.');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err) {
      alert('Failed to activate enrollment');
    } finally {
      setIsProcessingEnrollment(false);
    }
  };

  const handleReviewEnrollment = async (result: 'approved' | 'declined') => {
    if (!reviewingEnrollmentUser) return;
    setIsProcessingEnrollment(true);
    try {
      const stipend = result === 'approved' ? {
        fixed: stipendConfig.fixed,
        variable: {
          type: stipendConfig.variableType,
          value: stipendConfig.variableValue,
          description: stipendConfig.variableDesc
        }
      } : undefined;

      await siteService.reviewEnrollment(reviewingEnrollmentUser.uid, result, stipend);
      await logAction(`ENROLLMENT_${result.toUpperCase()}`, `${result.charAt(0).toUpperCase() + result.slice(1)} intern enrollment for ${reviewingEnrollmentUser.email}`);
      
      setUsers(prev => prev.map(u => {
        if (u.uid === reviewingEnrollmentUser.uid) {
          return {
            ...u,
            status: result === 'approved' ? u.status : 'denied',
            enrollment: { ...u.enrollment, status: result, stipend } as any
          };
        }
        return u;
      }));
      setReviewingEnrollmentUser(null);
      setSyncMessage(`Enrollment ${result} successfully.`);
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err) {
      alert('Failed to review enrollment');
    } finally {
      setIsProcessingEnrollment(false);
    }
  };

  const handleUpdateMarketing = async () => {
    if (!window.confirm('Update marketing credentials?')) return;
    try {
      setSyncing(true);
      await siteService.updateMarketing(marketingState);
      await logAction('UPDATE_MARKETING', `Updated SEO/Marketing credentials`);
      setSyncMessage('Marketing credentials updated!');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      alert('Failed to update marketing credentials');
    } finally {
      setSyncing(false);
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('Syncing...');
    try {
      await siteService.seedData(DEFAULT_SITE_CONFIG);
      await logAction('SYNC_DATABASE', 'Synced database configuration with code constants');
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
    if (!window.confirm(`Confirm adding client: ${newClient.trim()}`)) return;
    const updatedClients = [...(config.clients || []), newClient.trim()];
    try {
      await siteService.updateClients(updatedClients);
      await logAction('ADD_CLIENT', `Added client: ${newClient.trim()}`);
      setConfig({ ...config, clients: updatedClients });
      setNewClient('');
    } catch (error) {
      alert('Failed to add client');
    }
  };

  const handleDeleteClient = async (clientToDelete: string) => {
    if (!config || !window.confirm(`CONFIRM: Remove ${clientToDelete} from client roster?`)) return;
    const updatedClients = (config.clients || []).filter(c => c !== clientToDelete);
    try {
      await siteService.updateClients(updatedClients);
      await logAction('DELETE_CLIENT', `Removed client: ${clientToDelete}`);
      setConfig({ ...config, clients: updatedClients });
    } catch (error) {
      alert('Failed to delete client');
    }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<UserProfile>) => {
    const userToUpdate = users.find(u => u.uid === uid);
    if (!userToUpdate) return;

    if (!window.confirm(`Confirm profile update for ${userToUpdate.email}?`)) return;

    try {
      await siteService.updateUserProfile(uid, updates);
      await logAction('UPDATE_USER_PROFILE', `Updated profile for ${userToUpdate.email}: ${JSON.stringify(updates)}`);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
    } catch (error) {
      alert('Failed to update user profile');
    }
  };

  const handleActivateUser = (u: UserProfile) => {
    setActivatingUser(u);
    setActivationRole(u.role || 'sales');
    setActivationTeam(u.team || '');
    setActivationBatch(u.batch || '');
  };

  const [isActivating, setIsActivating] = useState(false);

  const confirmActivation = async () => {
    if (!activatingUser || isActivating) return;

    try {
      setIsActivating(true);
      setFetchError(null);

      // Validate mandatory fields
      if (activationRole === 'sales' && (!activationTeam || !activationBatch)) {
        alert('Sales activation requires both a team and batch assignment.');
        setIsActivating(false);
        return;
      }
      if (activationRole === 'manager' && !activationTeam) {
        alert('Manager activation requires a team assignment.');
        setIsActivating(false);
        return;
      }

      const updates = {
        role: activationRole,
        team: activationRole === 'admin' ? null : activationTeam,
        batch: activationRole === 'sales' ? activationBatch : null,
        status: 'active' as const
      };

      console.log('Synchronizing Identity Activation:', { uid: activatingUser.uid, updates });
      
      await siteService.updateUserProfile(activatingUser.uid, updates);
      await logAction('ACTIVATE_USER', `Activated ${activatingUser.email} as ${activationRole}`);
      
      setUsers(prev => prev.map(u => u.uid === activatingUser.uid ? { ...u, ...updates } : u));
      setActivatingUser(null);
      setSyncMessage(`Protocol Success: ${activatingUser.email} is now active.`);
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error: any) {
      console.error('Activation Protocol Failure:', error);
      setFetchError(`Activation Failed: ${error.message || String(error)}`);
      alert('Activation protocol failed. Check diagnostics.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleDenyUser = async (u: UserProfile) => {
    if (!window.confirm(`DENY ACCESS REQUEST: Are you absolutely sure you want to deny ${u.email}?`)) return;
    try {
      const updates = { status: 'denied' as const };
      await siteService.updateUserProfile(u.uid, updates);
      await logAction('DENY_USER', `Denied access for ${u.email}`);
      setUsers(prev => prev.map(user => user.uid === u.uid ? { ...user, status: 'denied' as const } : user));
    } catch (error) {
      alert('Failed to deny user');
    }
  };

  const handleAddTeam = async () => {
    if (!newTeam.trim() || !config) return;
    if (!window.confirm(`Confirm new team addition: ${newTeam.trim()}`)) return;
    const updatedTeams = [...(config.teams || []), newTeam.trim()];
    try {
      await siteService.updateOrganization({ teams: updatedTeams });
      await logAction('ADD_TEAM', `Created new team: ${newTeam.trim()}`);
      setConfig({ ...config, teams: updatedTeams });
      setNewTeam('');
    } catch (error) {
      alert('Failed to add team');
    }
  };

  const handleDeleteTeam = async (teamToDelete: string) => {
    if (!config || !window.confirm(`CONFIRM: Permanent removal of team "${teamToDelete}"?`)) return;
    const updatedTeams = (config.teams || []).filter(t => t !== teamToDelete);
    try {
      await siteService.updateOrganization({ teams: updatedTeams });
      await logAction('DELETE_TEAM', `Removed team: ${teamToDelete}`);
      setConfig({ ...config, teams: updatedTeams });
    } catch (error) {
      alert('Failed to delete team');
    }
  };

  const handleAddBatch = async () => {
    if (!newBatch.trim() || !config) return;
    if (!window.confirm(`Confirm new batch cycle definition: ${newBatch.trim()}`)) return;
    const updatedBatches = [...(config.batches || []), newBatch.trim()];
    try {
      await siteService.updateOrganization({ batches: updatedBatches });
      await logAction('ADD_BATCH', `Created new batch: ${newBatch.trim()}`);
      setConfig({ ...config, batches: updatedBatches });
      setNewBatch('');
    } catch (error) {
      alert('Failed to add batch');
    }
  };

  const handleDeleteBatch = async (batchToDelete: string) => {
    if (!config || !window.confirm(`CONFIRM: Permanent removal of batch cycle "${batchToDelete}"?`)) return;
    const updatedBatches = (config.batches || []).filter(b => b !== batchToDelete);
    try {
      await siteService.updateOrganization({ batches: updatedBatches });
      await logAction('DELETE_BATCH', `Removed batch: ${batchToDelete}`);
      setConfig({ ...config, batches: updatedBatches });
    } catch (error) {
      alert('Failed to delete batch');
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
      await logAction('LEAD_STATUS_CHANGE', `${statusChangeLead.name} status updated to ${tempStatus}`);
      
      const authorName = userProfile.email.split('@')[0];
      if (statusComment.trim()) {
        await siteService.addLeadComment(statusChangeLead.id!, {
          authorId: userProfile.uid,
          authorName: authorName,
          content: statusComment.trim(),
          statusUpdate: tempStatus
        });
      } else {
        await siteService.addLeadComment(statusChangeLead.id!, {
          authorId: userProfile.uid,
          authorName: authorName,
          content: `Status updated to ${tempStatus}`,
          statusUpdate: tempStatus
        });
      }

      setLeads(prev => prev.map(l => l.id === statusChangeLead.id ? { ...l, status: tempStatus } : l));
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
      await logAction('ADD_LEAD_COMMENT', `Comment added to lead: ${viewingLeadLog.name}`);
      
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
    if (!window.confirm(`PERMANENT ACTION: Delete lead "${lead?.name}"?`)) return;
    try {
      await siteService.deleteLead(leadId);
      await logAction('DELETE_LEAD', `Lead deleted: ${lead?.name} (${lead?.email})`);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (error) {
      alert('Failed to delete lead');
    }
  };

  useEffect(() => {
    // Lead real-time listener
    const leadFilters = {
      team: isAdminUser ? (teamFilter === 'All Teams' ? undefined : teamFilter) : userProfile.team,
      batch: batchFilter === 'All Batches' ? undefined : batchFilter,
      salesRepId: userFilter === 'All Users' ? undefined : userFilter
    };

    const unsubscribeLeads = siteService.subscribeLeads(leadFilters, (updatedLeads) => {
      // Hide deleted leads unless specifically searching or admin wants to see them (default hide)
      setLeads(updatedLeads.filter(l => l.status !== 'Deleted'));
      setLoading(false);
    });

    // Enquiries and Config fetch (these can remain static or we can add subscribers later)
    fetchData(planFilter);

    // Users real-time listener for admin/manager
    let unsubscribeUsers = () => {};
    if (isAdminUser || isManagerUser) {
      const userTeamFilter = isManagerUser ? userProfile.team : undefined;
      unsubscribeUsers = siteService.subscribeAllUsers(
        (updatedUsers) => {
          setUsers(updatedUsers);
          setFetchError(null);
        },
        userTeamFilter,
        (err) => {
          setFetchError(`Real-time Sync Failed: ${err.message || String(err)}`);
        }
      );
    }

    return () => {
      unsubscribeLeads();
      unsubscribeUsers();
    };
  }, [planFilter, teamFilter, batchFilter, userFilter, isAdminUser, isManagerUser]);

  const filteredEnquiries = enquiries.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = (config?.clients || []).filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.schoolName && l.schoolName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredActiveUsers = activeUsers.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.enrollment?.fullName && u.enrollment.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLogs = systemLogs.filter(log => 
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          
          <div className="flex-1 max-w-md mx-auto md:mx-0">
             <div className="relative">
               <input 
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search entries in current tab..."
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs outline-none focus:border-blue-500 transition-all"
               />
               <Activity className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {isAdminUser && (
              <>
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
              </>
            )}
            <button 
              onClick={() => fetchData(planFilter)}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <RefreshCcw className="w-3 h-3" /> Refresh Data
            </button>
          </div>
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
                {filteredEnquiries.map((enquiry, idx) => (
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
        ) : activeTab === 'clients' ? (
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
              {filteredClients.sort((a, b) => a.localeCompare(b)).map((client) => (
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
        ) : activeTab === 'marketing' ? (
          <div className="max-w-3xl space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-12 transition-all hover:border-blue-500/20">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white tracking-tight">Tracking & Analytics</h4>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mt-1">Deploy tracking scripts across your galaxy</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-500 pl-1">Google Analytics (G-XXXXXXXXXX)</label>
                  <input 
                    type="text"
                    value={marketingState.googleAnalyticsId}
                    onChange={(e) => setMarketingState({...marketingState, googleAnalyticsId: e.target.value})}
                    placeholder="G-XXXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all font-mono text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-500 pl-1">Google Tag Manager (GTM-XXXXXXX)</label>
                  <input 
                    type="text"
                    value={marketingState.googleTagManagerId}
                    onChange={(e) => setMarketingState({...marketingState, googleTagManagerId: e.target.value})}
                    placeholder="GTM-XXXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all font-mono text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-500 pl-1">Meta Pixel ID</label>
                  <input 
                    type="text"
                    value={marketingState.metaPixelId}
                    onChange={(e) => setMarketingState({...marketingState, metaPixelId: e.target.value})}
                    placeholder="1234567890"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all font-mono text-sm"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleUpdateMarketing}
                    disabled={syncing}
                    className="w-full py-5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-2xl text-white font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.3)] transition-all"
                  >
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lock Mission Credentials
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02]">
              <h5 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4">Pro Marketing Tip</h5>
              <p className="text-gray-400 text-sm leading-relaxed">
                After saving these credentials, tracking scripts will automatically be deployed to the frontend. Ensure your IDs are correct to prevent any data loss in orbit.
              </p>
            </div>
          </div>
        ) : activeTab === 'leads' ? (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 w-fit mb-8">
              <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Pipeline Filters:</span>
              </div>
              {isAdminUser && (
                <select 
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                >
                  {['All Teams', ...(config?.teams || [])].map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                </select>
              )}
              {isManagerUser && (
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 border-r border-white/10 pr-4">
                  Team: {userProfile.team}
                </div>
              )}
              <select 
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
              >
                {['All Batches', ...(config?.batches || [])].map(b => <option key={b} value={b} className="bg-black">{b}</option>)}
              </select>

              <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                <User className="w-4 h-4 text-blue-500" />
              </div>
              <select 
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
              >
                <option value="All Users" className="bg-black">All Users</option>
                {activeUsers.map(u => (
                  <option key={u.uid} value={u.uid} className="bg-black">{u.email.split('@')[0]}</option>
                ))}
              </select>
            </div>

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
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Lead / Target</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Sales Representative</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Status</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Team / Sector</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Batch Phase</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-6">
                        <div className="text-white font-bold text-sm tracking-tight">{lead.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{lead.schoolName || lead.company || lead.email}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-500">
                             {lead.salesRepName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-gray-300 text-xs font-medium">{lead.salesRepName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <select 
                          value={lead.status}
                          onChange={(e) => handleStatusChangeRequest(lead, e.target.value as LeadStatus)}
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md outline-none border-none cursor-pointer ${
                            lead.status === 'Deleted' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {[
                            'New', 
                            'Contacted', 
                            'Qualified', 
                            'Demo Scheduled', 
                            'Negotiation', 
                            'Closed Won', 
                            'Closed Lost',
                            'Deleted'
                          ].map(s => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-6 text-gray-500 text-[10px] font-bold uppercase tracking-widest">{lead.team}</td>
                      <td className="px-6 py-6 text-gray-500 text-xs">{lead.batch}</td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLead(lead.id!);
                            }}
                            className="p-3 -m-1 text-gray-600 hover:text-red-500 transition-colors relative z-20 cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4 pointer-events-none" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingLeadLog(lead);
                            }}
                            className="p-3 -m-1 text-gray-600 hover:text-white transition-colors relative z-20 cursor-pointer"
                            title="View History Log"
                          >
                            <MoreVertical className="w-4 h-4 pointer-events-none" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-500 uppercase tracking-widest text-xs">
                        No sales leads detected in orbit.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'team' ? (
          <div className="space-y-12">
            {/* User Activation Modal */}
            {activatingUser && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white tracking-tight">Identity Activation</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Configure profile for: {activatingUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 pl-1">Assign Role</label>
                      <div className="flex gap-2">
                        {(['sales', 'manager', 'admin'] as const)
                          .filter(role => !isManagerUser || role === 'sales')
                          .map(role => (
                          <button
                            key={role}
                            onClick={() => setActivationRole(role)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                              activationRole === role 
                                ? 'bg-blue-500 border-blue-500 text-white' 
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activationRole !== 'admin' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 pl-1">Assign Team {activationRole === 'manager' || activationRole === 'sales' ? <span className="text-red-500">*</span> : ''}</label>
                          <select 
                            value={activationTeam}
                            onChange={(e) => setActivationTeam(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-blue-500"
                          >
                            <option value="" className="bg-black">Select Team...</option>
                            {config?.teams?.map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                          </select>
                        </div>

                        {activationRole === 'sales' && (
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 pl-1">Assign Batch <span className="text-red-500">*</span></label>
                            <select 
                              value={activationBatch}
                              onChange={(e) => setActivationBatch(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-blue-500"
                            >
                              <option value="" className="bg-black">Select Batch...</option>
                              {config?.batches?.map(b => <option key={b} value={b} className="bg-black">{b}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 space-y-4">
                      {isActivating && (
                        <div className="flex items-center gap-2 text-blue-500 font-bold text-[8px] uppercase tracking-widest animate-pulse">
                          <Orbit className="w-3 h-3 animate-spin" />
                          Executing Activation Sequence...
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <button 
                          type="button"
                          onClick={() => {
                            console.log('Activation Aborted by User');
                            setActivatingUser(null);
                          }}
                          disabled={isActivating}
                          className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            console.log('Activation Triggered for:', activatingUser.email);
                            confirmActivation();
                          }}
                          disabled={isActivating}
                          className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          {isActivating ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Activate Access'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Pending Activations */}
            {pendingUsers.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white tracking-tight">Activation Requests</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Review identities requesting access ({pendingUsers.length} total)</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleForceReload}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    <RefreshCcw className="w-3 h-3" /> Force Reload Users
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingUsers.map(u => (
                    <motion.div 
                      layout
                      key={u.uid}
                      className="bg-[#0a0a0a] border border-orange-500/20 p-6 rounded-3xl flex items-center justify-between group shadow-[0_0_50px_-20px_rgba(249,115,22,0.1)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm tracking-tight">{u.email.split('@')[0]}</div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDenyUser(u)}
                          className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          Deny
                        </button>
                        <button 
                          onClick={() => handleActivateUser(u)}
                          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all"
                        >
                          Review & Activate
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 border border-white/5 rounded-3xl bg-white/[0.02] text-center">
                <Shield className="w-8 h-8 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 uppercase font-bold tracking-widest text-[10px] mb-6">No pending activation requests detected.</p>
                <button 
                  onClick={handleForceReload}
                  className="mx-auto flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <RefreshCcw className="w-3 h-3" /> Scan Collection Manually
                </button>
              </div>
            )}

            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">User / Profile</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Internship Status</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">System Status</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Assigned Role</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredActiveUsers.length > 0 ? (
                    filteredActiveUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              u.status === 'denied' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm tracking-tight">{u.email.split('@')[0]}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-mono text-[9px]">
                          {!u.isEnrollmentActive ? (
                            <span className="text-gray-600">Inactive</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                              u.enrollment?.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                              u.enrollment?.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                              u.enrollment?.status === 'declined' ? 'bg-red-500/10 text-red-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {u.enrollment?.status || 'Active'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-6">
                          <select 
                            value={u.status}
                            onChange={(e) => handleUpdateUser(u.uid, { status: e.target.value as any })}
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest outline-none border-none cursor-pointer ${
                              u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            <option value="active" className="bg-black">Active</option>
                            <option value="denied" className="bg-black">Denied</option>
                          </select>
                        </td>
                        <td className="px-6 py-6">
                          <select 
                            value={u.role}
                            disabled={isManagerUser}
                            onChange={(e) => handleUpdateUser(u.uid, { role: e.target.value as any })}
                            className={`bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-500 outline-none ${isManagerUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <option value="admin" className="bg-black">Admin</option>
                            <option value="sales" className="bg-black">Sales</option>
                            <option value="manager" className="bg-black">Manager</option>
                          </select>
                        </td>
                        <td className="px-6 py-6 border-transparent">
                          <div className="flex items-center gap-2 relative">
                             {!u.isEnrollmentActive && (u.status === 'active' || !u.status) && (
                               <button 
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setEnrollmentActionUser(u);
                                 }}
                                 className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 cursor-pointer relative z-[100] transition-all hover:-translate-y-0.5 active:scale-95 inline-flex items-center whitespace-nowrap"
                               >
                                 Activate Intern Form
                               </button>
                             )}
                             {u.enrollment?.status === 'pending' && (
                               <button 
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setReviewingEnrollmentUser(u);
                                 }}
                                 className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 cursor-pointer relative z-[100] transition-all hover:-translate-y-0.5 active:scale-95 inline-flex items-center whitespace-nowrap"
                               >
                                 Review Enrollment
                               </button>
                             )}
                              {(u.enrollment?.status === 'approved' || u.enrollment?.status === 'declined') && (
                               <button 
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setViewingProfileUser(u);
                                 }}
                                 className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 cursor-pointer relative z-[100] transition-all hover:-translate-y-0.5 active:scale-95 inline-flex items-center whitespace-nowrap"
                               >
                                 View Dossier
                               </button>
                             )}
                             {u.enrollment?.status === 'approved' && (
                               <div className="flex flex-col gap-1">
                                 <span className="text-[8px] text-green-500 font-black uppercase tracking-widest italic flex items-center gap-2">
                                   <CheckCircle2 className="w-3 h-3" /> Offer Dispatched
                                 </span>
                                 <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit ${
                                   u.enrollment?.onboarding?.onboardingStatus === 'completed' 
                                     ? 'bg-green-500/10 text-green-400 border border-green-500/10' 
                                     : 'bg-orange-500/10 text-orange-400 border border-orange-500/10'
                                 }`}>
                                   Onboarding: {u.enrollment?.onboarding?.onboardingStatus?.replace(/_/g, ' ') || 'Awaiting'}
                                 </span>
                               </div>
                             )}
                             {u.enrollment?.status === 'declined' && (
                               <span className="text-[8px] text-red-500 font-black uppercase tracking-widest italic flex items-center gap-2">
                                 <X className="w-3 h-3" /> Application Rejected
                               </span>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-700 uppercase font-black tracking-widest text-[10px]">No active personnel detected in orbit.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Org Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Teams */}
              <div className="space-y-6">
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
                  <h4 className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-500 mb-6 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Team Structure
                  </h4>
                  <div className="flex gap-4 mb-6">
                    <input 
                      type="text"
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      placeholder="New Team Name..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={handleAddTeam}
                      disabled={!newTeam.trim()}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-xl text-white font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {config?.teams?.map(team => (
                      <div key={team} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 group">
                        <span className="text-white text-xs font-bold uppercase tracking-tight">{team}</span>
                        <button 
                          onClick={() => handleDeleteTeam(team)}
                          className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Batches */}
              <div className="space-y-6">
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
                  <h4 className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-500 mb-6 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Batch Cycles
                  </h4>
                  <div className="flex gap-4 mb-6">
                    <input 
                      type="text"
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      placeholder="New Batch Name..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={handleAddBatch}
                      disabled={!newBatch.trim()}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-xl text-white font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {config?.batches?.map(batch => (
                      <div key={batch} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 group">
                        <span className="text-white text-xs font-bold uppercase tracking-tight">{batch}</span>
                        <button 
                          onClick={() => handleDeleteBatch(batch)}
                          className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white tracking-tight">System Audit logs</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Real-time surveillance of system actions</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  const logs = await siteService.getLogs();
                  setSystemLogs(logs);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <RefreshCcw className="w-3 h-3" /> Refresh Logs
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Time (UTC)</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Identity</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Action Protocol</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Payload / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Processing...'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-500 font-black uppercase tracking-widest text-[9px]">{log.userName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-white/5 rounded text-white text-[9px] font-black uppercase tracking-tighter">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs tracking-tight">{log.details}</td>
                    </tr>
                  ))}
                  {systemLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-gray-700 uppercase font-black tracking-widest text-[10px]">No system activity recorded in this quadrant.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) }

        {/* Diagnostic Overlay (Hidden by default) */}
        <div className="mt-20 pt-20 border-t border-white/5 opacity-20 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500">System Diagnostics</h5>
            <button 
              onClick={() => setShowDebug(!showDebug)} 
              className="text-[10px] font-bold text-blue-500 underline"
            >
              {showDebug ? 'Hide Matrix' : 'Reveal Core State'}
            </button>
          </div>
          
          {fetchError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Protocol Failure: {fetchError}</p>
            </div>
          )}

          {showDebug && (
            <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-[10px] overflow-auto max-h-96">
              <div className="mb-4 pb-4 border-b border-white/5">
                <span className="text-orange-500">Current Role:</span> {userProfile.role} | 
                <span className="text-orange-500"> Status:</span> {userProfile.status} |
                <span className="text-orange-500"> IsAdmin:</span> {isAdminUser ? 'TRUE' : 'FALSE'} |
                <span className="text-orange-500"> isActivating:</span> {isActivating ? 'TRUE' : 'FALSE'}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h6 className="text-blue-500">Registered Identities ({users.length}):</h6>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleForceReload()}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded border border-white/10 transition-all text-[8px] font-black uppercase"
                    >
                      Reload List
                    </button>
                    <button 
                      onClick={async () => {
                        const corrupted = users.filter(u => !u.status || !u.role);
                        if (corrupted.length === 0) {
                          alert("No corrupted identites detected.");
                          return;
                        }
                        if (window.confirm(`Repair ${corrupted.length} identities by injecting default 'pending' status?`)) {
                          setLoading(true);
                          try {
                            for (const u of corrupted) {
                              await siteService.updateUserProfile(u.uid, { 
                                status: u.status || 'pending',
                                role: u.role || 'sales'
                              });
                            }
                            await handleForceReload();
                            alert("Repair complete. Identities synchronized.");
                          } catch (err) {
                            alert("Repair protocol failed.");
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded border border-blue-500/20 transition-all text-[8px] font-black uppercase"
                    >
                      Run Identity Repair Protocol
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.uid} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5">
                      <span className="text-gray-400">{u.email} ({u.role || 'no-role'} | {u.status || 'no-status'})</span>
                      <button 
                        onClick={() => {
                          if (window.confirm(`FORCE ACTIVATE ${u.email} AS SALES?`)) {
                            handleActivateUser(u);
                          }
                        }}
                        className="px-2 py-0.5 bg-orange-500/20 text-orange-500 rounded text-[7px] font-bold uppercase"
                      >
                        Emergency Activate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Intern Enrollment Modals */}
        {enrollmentActionUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <ClipboardList className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Activate <br/> Intern Form</h4>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-2">{enrollmentActionUser.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 ml-1">HQ Instructions / Invitation Note</label>
                  <textarea 
                    value={enrollmentComment}
                    onChange={(e) => setEnrollmentComment(e.target.value)}
                    placeholder="Provide specific context for the intern..."
                    className="w-full h-32 bg-black border border-white/5 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all resize-none shadow-inner"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => { setEnrollmentActionUser(null); setEnrollmentComment(''); }}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-500 font-bold uppercase tracking-widest text-[9px] rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleActivateEnrollment}
                    disabled={isProcessingEnrollment || !enrollmentComment.trim()}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[9px] rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessingEnrollment ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Confirm Activation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {reviewingEnrollmentUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-10 max-w-2xl w-full shadow-[0_30px_100px_-15px_rgba(0,0,0,1)] my-8"
            >
              <div className="flex items-center justify-between mb-10 pb-10 border-b border-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                    <Orbit className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Review <br/> Enrollment</h4>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-2">Candidacy: {reviewingEnrollmentUser.enrollment?.fullName}</p>
                  </div>
                </div>
                <button onClick={() => setReviewingEnrollmentUser(null)} className="text-gray-500 hover:text-white p-3 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                {/* Section 1: Basic & Identity */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border-b border-white/10 pb-2">I. Identity Profile</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="info-label">Full Legal Name</span>
                        <p className="info-value">{reviewingEnrollmentUser.enrollment?.fullName}</p>
                      </div>
                      <div>
                        <span className="info-label">Date of Birth</span>
                        <p className="info-value">{reviewingEnrollmentUser.enrollment?.dob}</p>
                      </div>
                      <div>
                        <span className="info-label">Gender</span>
                        <p className="info-value">{reviewingEnrollmentUser.enrollment?.gender}</p>
                      </div>
                      <div>
                        <span className="info-label">Personal Email</span>
                        <p className="info-value lowercase">{reviewingEnrollmentUser.enrollment?.personalEmail}</p>
                      </div>
                      <div>
                        <span className="info-label">Mobile Number</span>
                        <p className="info-value font-mono">{reviewingEnrollmentUser.enrollment?.mobile}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 border-b border-white/10 pb-2">II. Government Clearance</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="info-label">Aadhaar Number</span>
                        <p className="info-value font-mono tracking-widest">{reviewingEnrollmentUser.enrollment?.aadhaarNumber}</p>
                      </div>
                      <div>
                        <span className="info-label">PAN Number</span>
                        <p className="info-value font-mono tracking-widest uppercase">{reviewingEnrollmentUser.enrollment?.panNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 border-b border-white/10 pb-2">III. Payroll & Banking</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <span className="info-label">Account Holder</span>
                        <p className="info-value">{reviewingEnrollmentUser.enrollment?.banking?.holderName || 'Pending'}</p>
                      </div>
                      <div>
                        <span className="info-label">Bank Name</span>
                        <p className="info-value">{reviewingEnrollmentUser.enrollment?.banking?.bankName || 'Pending'}</p>
                      </div>
                      <div>
                        <span className="info-label">IFSC Code</span>
                        <p className="info-value font-mono uppercase">{reviewingEnrollmentUser.enrollment?.banking?.ifsc || 'Pending'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="info-label">Account Number</span>
                        <p className="info-value font-mono">{reviewingEnrollmentUser.enrollment?.banking?.accountNumber || 'Pending'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Academic */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 border-b border-white/10 pb-2">IV. Locality & Emergency</h5>
                    <div className="space-y-4">
                      <div>
                        <span className="info-label">Current Address</span>
                        <p className="info-value italic text-[11px]">"{reviewingEnrollmentUser.enrollment?.address}"</p>
                      </div>
                      <div>
                        <span className="info-label">Permanent Address</span>
                        <p className="info-value italic text-[11px]">"{reviewingEnrollmentUser.enrollment?.permanentAddress}"</p>
                      </div>
                      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-2">Emergency Protocol Contact</p>
                        <div className="grid grid-cols-2 gap-2">
                          <p className="text-white text-xs font-bold">{reviewingEnrollmentUser.enrollment?.emergencyContact?.name || 'Pending'}</p>
                          <p className="text-gray-500 text-xs text-right italic">{reviewingEnrollmentUser.enrollment?.emergencyContact?.relationship || 'Pending'}</p>
                          <p className="text-white font-mono text-[11px] col-span-2 mt-1">{reviewingEnrollmentUser.enrollment?.emergencyContact?.phone || 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 border-b border-white/10 pb-2">V. Academic Background</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="info-label">Highest Qualification</span>
                        <p className="info-value text-purple-200">{reviewingEnrollmentUser.enrollment?.highestQualification}</p>
                      </div>
                      <div>
                        <span className="info-label">Detailed Education</span>
                        <p className="info-value text-gray-400 text-[11px]">{reviewingEnrollmentUser.enrollment?.education}</p>
                      </div>
                      <div>
                        <span className="info-label">Technical Competencies</span>
                        <p className="info-value text-sm leading-relaxed">{reviewingEnrollmentUser.enrollment?.skills}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/10 mb-8">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center justify-between">
                  <span>Stipend Configuration</span>
                  <span className="text-gray-500 italic">Mandatory for authorization</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase font-black text-gray-500 tracking-widest ml-1">Fixed Stipend (INR)</label>
                    <input 
                      type="number"
                      value={stipendConfig.fixed}
                      onChange={(e) => setStipendConfig({...stipendConfig, fixed: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase font-black text-gray-500 tracking-widest ml-1">Variable Type</label>
                    <div className="flex gap-2">
                      {['amount', 'percentage'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setStipendConfig({...stipendConfig, variableType: type as any})}
                          className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                            stipendConfig.variableType === type 
                              ? 'bg-orange-500 border-orange-500 text-white' 
                              : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase font-black text-gray-500 tracking-widest ml-1">Variable Value {stipendConfig.variableType === 'percentage' ? '(%)' : '(INR)'}</label>
                    <input 
                      type="number"
                      value={stipendConfig.variableValue}
                      onChange={(e) => setStipendConfig({...stipendConfig, variableValue: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase font-black text-gray-500 tracking-widest ml-1">Variable Description</label>
                    <input 
                      type="text"
                      value={stipendConfig.variableDesc}
                      onChange={(e) => setStipendConfig({...stipendConfig, variableDesc: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-500"
                      placeholder="e.g. Sales Commission"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => handleReviewEnrollment('declined')}
                  disabled={isProcessingEnrollment}
                  className="flex-1 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Decline & Deactivate Identity
                </button>
                <button 
                  onClick={() => handleReviewEnrollment('approved')}
                  disabled={isProcessingEnrollment}
                  className="flex-1 py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingEnrollment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve & Dispatch Offer Letter
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Personnel Profile Modal */}
        {viewingProfileUser && (
          <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl overflow-y-auto">
            <div className="min-h-screen py-20 relative">
               <button 
                onClick={() => setViewingProfileUser(null)}
                className="fixed top-8 right-8 z-[260] p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/10"
               >
                 <X className="w-8 h-8" />
               </button>
               <div className="max-w-7xl mx-auto px-6">
                 <div className="flex items-center gap-6 mb-12 ml-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Personnel <br/> Intelligence</h2>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-3">Accessing secure dossiers for: {viewingProfileUser.email}</p>
                    </div>
                 </div>
                 <div className="bg-[#050505] rounded-[3rem] border border-white/5">
                   <PersonnelProfile profile={viewingProfileUser} isAdminView={true} />
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Styles for review modal */}
        <style>{`
          .info-label {
            display: block;
            font-size: 8px;
            text-transform: uppercase;
            font-weight: 900;
            color: #4b5563;
            letter-spacing: 0.1em;
            margin-bottom: 2px;
          }
          .info-value {
            color: white;
            font-size: 13px;
            font-weight: 500;
          }
          .scrollbar-thin::-webkit-scrollbar {
            width: 4px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
        `}</style>
        </div>
      </div>
    </div>
  );
};
