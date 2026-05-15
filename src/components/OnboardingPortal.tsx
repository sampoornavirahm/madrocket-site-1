import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Upload, CheckCircle, Download, Shield, Landmark, Loader2, Send } from 'lucide-react';
import { siteService } from '../services/siteService';
import { UserProfile } from '../types';

interface OnboardingPortalProps {
  userProfile: UserProfile;
  onComplete: () => void;
}

export function OnboardingPortal({ userProfile, onComplete }: OnboardingPortalProps) {
  const [loading, setLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [files, setFiles] = useState({
    offerLetter: null as File | null,
    nda: null as File | null,
  });

  const onboarding = userProfile.enrollment?.onboarding;

  if (onboarding?.onboardingStatus === 'completed') {
    return (
      <div className="min-h-screen pt-20 px-4 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0f0f0f] border border-green-500/20 rounded-[2.5rem] p-12 max-w-xl w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500 border border-green-500/20">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-4">Onboarding Initialized</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Your documents have been verified and accepted. Our HR team will reach out shortly for the final induction session. Welcome to the elite roster.
          </p>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</p>
                <p className="text-green-500 text-xs font-bold uppercase">Verified</p>
             </div>
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Batch</p>
                <p className="text-blue-500 text-xs font-bold uppercase">{userProfile.batch || 'N/A'}</p>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.offerLetter || !files.nda || !acceptedPolicies) {
      alert('Please upload all required documents and accept the policies.');
      return;
    }

    setLoading(true);
    try {
      // Mocking file uploads by providing dummy URLs
      await siteService.submitOnboardingDocs(userProfile.uid, {
        signedOfferLetterUrl: 'https://example.com/uploads/signed_offer.pdf',
        signedNdaUrl: 'https://example.com/uploads/signed_nda.pdf'
      });
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Failed to finalize onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-10 pb-20 px-4 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-10 md:p-14 max-w-3xl w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.03] blur-[100px] -z-10" />

        <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12 pb-12 border-b border-white/5">
          <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-3">Onboarding <br/> Portal</h2>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded shadow-sm shadow-orange-500/20">Final Phase</span>
              <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">Compliance & Document Authorization</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Document 1: Offer Letter */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Offer Letter Authorization
            </h3>
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
              <p className="text-xs text-gray-400">Download the official offer letter from HQ, sign it, and upload the scanned copy below.</p>
              <a 
                href={onboarding?.offerLetterUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest bg-blue-600/20 hover:bg-blue-600/30 py-3 px-4 rounded-xl transition-all border border-blue-600/20"
              >
                <Download className="w-3 h-3" /> Download Template
              </a>
              <DocumentUpload 
                label="Signed Offer Letter" 
                onFileSelect={(file) => setFiles(prev => ({ ...prev, offerLetter: file }))} 
                isSelected={!!files.offerLetter}
              />
            </div>
          </div>

          {/* Document 2: NDA */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 flex items-center gap-2">
              <Landmark className="w-3 h-3" /> NDA & Confidentiality
            </h3>
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
              <p className="text-xs text-gray-400">Security is paramount. Download the confidentiality agreement, sign it, and upload.</p>
              <a 
                href="https://example.com/assets/generic_nda.pdf" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest bg-orange-600/20 hover:bg-orange-600/30 py-3 px-4 rounded-xl transition-all border border-orange-600/20"
              >
                <Download className="w-3 h-3" /> Download NDA Template
              </a>
              <DocumentUpload 
                label="Signed NDA / Confidentiality" 
                onFileSelect={(file) => setFiles(prev => ({ ...prev, nda: file }))} 
                isSelected={!!files.nda}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 bg-white/[0.02] border border-white/5 rounded-3xl p-8 mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Corporate Compliance</h3>
          <div className="flex items-start gap-4">
            <button 
              type="button"
              onClick={() => setAcceptedPolicies(!acceptedPolicies)}
              className={`w-6 h-6 rounded-lg border flex-shrink-0 transition-all flex items-center justify-center ${
                acceptedPolicies ? 'bg-blue-600 border-blue-600' : 'bg-black border-white/10'
              }`}
            >
              {acceptedPolicies && <CheckCircle className="w-4 h-4 text-white" />}
            </button>
            <div className="space-y-2">
              <p className="text-sm font-bold text-white">Acceptance of Company Policies</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                I hereby declare that I have read and understood the company code of conduct, security protocols, and operational guidelines. I agree to comply with all internal policies during my internship tenure.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !acceptedPolicies || !files.offerLetter || !files.nda}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/20 transition-all border border-blue-500/30"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" /> Finalize Induction & Transmit
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

function DocumentUpload({ label, onFileSelect, isSelected }: { label: string, onFileSelect: (file: File) => void, isSelected: boolean }) {
  return (
    <label className={`block w-full cursor-pointer transition-all ${isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
      <input 
        type="file" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
        }}
      />
      <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-between transition-all ${
        isSelected ? 'bg-green-500/10 border-green-500/30' : 'bg-black border-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <Upload className={`w-4 h-4 ${isSelected ? 'text-green-500' : 'text-gray-500'}`} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-green-500' : 'text-gray-400'}`}>
            {isSelected ? 'File Loaded' : label}
          </span>
        </div>
        {isSelected && <CheckCircle className="w-4 h-4 text-green-500" />}
      </div>
    </label>
  );
}
