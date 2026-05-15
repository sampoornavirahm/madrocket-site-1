import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, Landmark, GraduationCap, Heart, MapPin, Mail, Phone, Calendar, CreditCard, ChevronLeft } from 'lucide-react';
import { UserProfile } from '../types';

interface PersonnelProfileProps {
  profile: UserProfile;
  onBack?: () => void;
  isAdminView?: boolean;
}

export function PersonnelProfile({ profile, onBack, isAdminView = false }: PersonnelProfileProps) {
  const enrollment = profile.enrollment;

  if (!enrollment || enrollment.status === 'none') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-600">
          <User className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white uppercase italic">No Profile Data</h3>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Enrollment records have not been initialized for this identity.</p>
        {onBack && (
          <button onClick={onBack} className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
            Return to Command
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all mb-8 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Directory</span>
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -z-10" />
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] mx-auto mb-6 flex items-center justify-center border border-white/10">
              <User className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">{enrollment.fullName}</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2">{profile.role} | Batch {profile.batch || 'Pending'}</p>
            
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <Mail className="w-3 h-3 text-gray-600" />
                <span className="text-[11px] text-gray-300 font-medium truncate">{enrollment.personalEmail || profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-3 h-3 text-gray-600" />
                <span className="text-[11px] text-gray-300 font-medium">{enrollment.mobile || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-3 h-3 text-gray-600" />
                <span className="text-[11px] text-gray-300 font-medium">Joined: {enrollment.startDate || 'TBD'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 border-b border-white/5 pb-2">Technical Dossier</h4>
            <div className="space-y-6">
              <div>
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-2">Primary Skills</span>
                <div className="flex flex-wrap gap-2">
                  {enrollment.skills.split(',').map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-[9px] text-gray-400 font-bold uppercase tracking-wider border border-white/5">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex items-center gap-4 mb-10 pb-10 border-b border-white/5">
              <Shield className="w-6 h-6 text-orange-500" />
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Personal Intelligence & Compliance</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div>
                   <label className="profile-label">Date of Birth</label>
                   <p className="profile-value">{enrollment.dob || 'Unknown'}</p>
                 </div>
                 <div>
                   <label className="profile-label">Aadhaar Identity</label>
                   <p className="profile-value font-mono tracking-widest">{enrollment.aadhaarNumber || 'SECURED'}</p>
                 </div>
                 <div>
                   <label className="profile-label">Residential Hub</label>
                   <p className="profile-value italic text-gray-400">"{enrollment.address}"</p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                   <label className="profile-label">Gender</label>
                   <p className="profile-value">{enrollment.gender}</p>
                 </div>
                 <div>
                   <label className="profile-label">PAN Identifier</label>
                   <p className="profile-value font-mono tracking-widest uppercase">{enrollment.panNumber || 'SECURED'}</p>
                 </div>
                 <div>
                   <label className="profile-label">Permanent Residence</label>
                   <p className="profile-value italic text-gray-400">"{enrollment.permanentAddress || enrollment.address}"</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Landmark className="w-5 h-5 text-green-500" />
                <h4 className="text-xs font-black text-white uppercase italic">Payroll Repository</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="profile-label">Institution</span>
                  <p className="profile-value text-xs">{enrollment.banking?.bankName || 'Awaiting Data'}</p>
                </div>
                <div>
                  <span className="profile-label">IFSC Clear Code</span>
                  <p className="profile-value text-xs font-mono uppercase">{enrollment.banking?.ifsc || 'Awaiting Data'}</p>
                </div>
                <div>
                  <span className="profile-label">Account Vector</span>
                  <p className="profile-value text-xs font-mono truncate">{enrollment.banking?.accountNumber || 'Awaiting Data'}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-5 h-5 text-red-500" />
                <h4 className="text-xs font-black text-white uppercase italic">Emergency Node</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="profile-label">Primary Contact</span>
                  <p className="profile-value text-xs">{enrollment.emergencyContact?.name || 'Awaiting Data'}</p>
                </div>
                <div>
                  <span className="profile-label">Nexus Relation</span>
                  <p className="profile-value text-xs text-gray-400 italic">{enrollment.emergencyContact?.relationship || 'Awaiting Data'}</p>
                </div>
                <div>
                  <span className="profile-label">Emergency Line</span>
                  <p className="profile-value text-xs font-mono">{enrollment.emergencyContact?.phone || 'Awaiting Data'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-5 h-5 text-purple-500" />
                <h4 className="text-xs font-black text-white uppercase italic">Academic Attainment</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="profile-label">Highest Qualification</span>
                  <p className="profile-value text-sm text-purple-200">{enrollment.highestQualification}</p>
                </div>
                <div>
                  <span className="profile-label">Detailed Record</span>
                  <p className="profile-value text-xs text-gray-400 italic leading-relaxed">"{enrollment.education}"</p>
                </div>
              </div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-label {
          display: block;
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 900;
          color: #4b5563;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .profile-value {
          color: white;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
      `}</style>
    </div>
  );
}
