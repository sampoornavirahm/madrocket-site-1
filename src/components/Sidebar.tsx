import React from 'react';
import { LayoutDashboard, User, Grid, LogOut, ChevronRight, MessageSquare, Users, Target, Shield, BarChart3, Database } from 'lucide-react';

export type ViewId = 'main' | 'profile' | 'apps' | 'enquiries' | 'clients' | 'marketing' | 'leads' | 'team' | 'logs';

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  onLogout: () => void;
  userEmail: string;
  role: 'admin' | 'manager' | 'sales';
  pendingCount?: number;
}

export function Sidebar({ activeView, onViewChange, onLogout, userEmail, role, pendingCount = 0 }: SidebarProps) {
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';

  const userItems: { id: ViewId, label: string, icon: any }[] = [
    { id: 'main', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'apps', label: 'Apps', icon: Grid },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const adminItems: { id: ViewId, label: string, icon: any, adminOnly?: boolean }[] = [
    { id: 'enquiries', label: 'Enquiries', icon: MessageSquare, adminOnly: true },
    { id: 'clients', label: 'Clients', icon: Users, adminOnly: true },
    { id: 'leads', label: 'Pipeline', icon: Target },
    { id: 'team', label: 'Personnel', icon: Shield },
    { id: 'marketing', label: 'Marketing', icon: BarChart3, adminOnly: true },
    { id: 'logs', label: 'System Logs', icon: Database, adminOnly: true },
  ];

  const menuItems = [
    ...userItems,
    ...(isAdmin || isManager ? adminItems.filter(item => !item.adminOnly || isAdmin) : [])
  ];

  return (
    <div className="w-20 lg:w-64 h-full bg-[#080808] border-r border-white/5 flex flex-col pt-24 pb-8 transition-all duration-500">
      <div className="px-4 lg:px-6 mb-10 overflow-hidden">
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hidden lg:block">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Authenticated Identity</p>
          <p className="text-white text-[11px] font-bold truncate">{userEmail}</p>
        </div>
        <div className="lg:hidden flex justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <User className="w-5 h-5" />
            </div>
        </div>
      </div>

      <nav className="flex-1 px-3 lg:px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 lg:px-6 lg:py-4 rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all relative group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 lg:w-4 lg:h-4 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`} />
              <span className="hidden lg:block">{item.label}</span>
              {item.id === 'team' && pendingCount > 0 && (
                <span className="absolute right-8 hidden lg:flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full px-1">
                  {pendingCount}
                </span>
              )}
              {isActive && (
                <div className="absolute right-2 hidden lg:block">
                  <ChevronRight className="w-3 h-3 text-white/50" />
                </div>
              )}
              {/* Tooltip for mobile */}
              <div className="lg:hidden absolute left-full ml-4 px-3 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-xl">
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-3 lg:px-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 lg:px-6 lg:py-4 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all group"
        >
          <LogOut className="w-5 h-5 lg:w-4 lg:h-4 group-hover:text-red-500" />
          <span className="hidden lg:block">Logout</span>
          {/* Tooltip for mobile */}
          <div className="lg:hidden absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-xl">
            Logout
          </div>
        </button>
      </div>
    </div>
  );
}
