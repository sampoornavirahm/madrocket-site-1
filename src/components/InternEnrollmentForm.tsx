import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Send, MapPin, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import { siteService } from '../services/siteService';
import { UserProfile } from '../types';

interface InternEnrollmentFormProps {
  userProfile: UserProfile;
  onComplete: () => void;
}

export function InternEnrollmentForm({ userProfile, onComplete }: InternEnrollmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userProfile.enrollment?.fullName || userProfile.email.split('@')[0],
    address: '',
    education: '',
    skills: '',
    startDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await siteService.submitEnrollment(userProfile.uid, {
        fullName: formData.fullName,
        address: formData.address,
        education: formData.education,
        skills: formData.skills,
        startDate: formData.startDate,
      } as any);
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Failed to submit enrollment form.');
    } finally {
      setLoading(false);
    }
  };

  const comment = userProfile.enrollment?.comment;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase italic">Internship Enrollment</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Prestigious MNC Opportunities</p>
        </div>
      </div>

      {comment && (
        <div className="mb-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1 items-center flex gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full" /> Invitation Note
          </p>
          <p className="text-gray-300 text-sm italic">"{comment}"</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                required
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Proposed Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                required
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Residential Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              required
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
              placeholder="123 Sector, Elite City"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Highest Educational Attainment</label>
          <div className="relative">
            <GraduationCap className="absolute left-4 top-4 w-4 h-4 text-gray-500" />
            <textarea
              required
              rows={2}
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all resize-none"
              placeholder="B.Tech in Computer Science, 2025"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Technical & Professional Skills</label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-4 w-4 h-4 text-gray-500" />
            <textarea
              required
              rows={3}
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all resize-none"
              placeholder="React, Firebase, Project Management, Sales Analytics..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 transition-all font-sans"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-3 h-3" /> Submit Critical Enrollment
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function User({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
