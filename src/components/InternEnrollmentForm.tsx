import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Send, MapPin, GraduationCap, Briefcase, Calendar, User, Mail, Phone, Home, CreditCard, ShieldCheck, Heart, Landmark, ChevronRight, ChevronLeft, Camera } from 'lucide-react';
import { siteService } from '../services/siteService';
import { UserProfile } from '../types';

interface InternEnrollmentFormProps {
  userProfile: UserProfile;
  onComplete: () => void;
}

export function InternEnrollmentForm({ userProfile, onComplete }: InternEnrollmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic
    fullName: userProfile.enrollment?.fullName || userProfile.email.split('@')[0],
    dob: '',
    gender: 'Male',
    mobile: '',
    personalEmail: userProfile.email,
    address: '',
    permanentAddress: '',
    photoUrl: '',

    // Govt
    aadhaarNumber: '',
    panNumber: '',

    // Emergency
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },

    // Banking
    banking: {
      holderName: '',
      bankName: '',
      accountNumber: '',
      ifsc: ''
    },

    // Edu
    highestQualification: '',
    degreeCertificateUrl: '',
    education: '', // Summary for legacy
    skills: '',
    startDate: '',
  });

  const totalSteps = 5;

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      nextStep();
      return;
    }

    setLoading(true);
    try {
      await siteService.submitEnrollment(userProfile.uid, {
        ...formData,
        education: `${formData.highestQualification} - ${formData.education}`
      });
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Failed to submit enrollment form.');
    } finally {
      setLoading(false);
    }
  };

  const comment = userProfile.enrollment?.comment;

  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Identity', icon: ShieldCheck },
    { id: 3, title: 'Emergency', icon: Heart },
    { id: 4, title: 'Payroll', icon: Landmark },
    { id: 5, title: 'Academic', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen pt-10 pb-20 px-4 flex items-start justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 md:p-14 max-w-3xl w-full shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.03] blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/[0.03] blur-[120px] -z-10" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-12 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <ClipboardList className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-3">Enrollment <br/> Terminal</h2>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded border border-blue-500/20">Secure Channel</span>
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">Verified MNC Internship Selection</p>
              </div>
            </div>
          </div>
          
          {/* Stepper Progress */}
          <div className="flex items-center gap-2">
            {steps.map((s) => (
              <div 
                key={s.id}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                  step === s.id 
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30' 
                    : step > s.id 
                      ? 'bg-green-500/20 border-green-500/20 text-green-500'
                      : 'bg-white/5 border-white/5 text-gray-600'
                }`}
              >
                <s.icon className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {comment && step === 1 && (
          <div className="mb-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Message from HQ</div>
            <p className="text-gray-300 text-sm italic leading-relaxed">"{comment}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-blue-500 border-l-4 border-blue-500 pl-4 py-1">Basic Personal Intelligence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="input-field pl-12" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input required type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="input-field pl-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                    <select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="input-field">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input required type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="input-field pl-12" placeholder="+91 00000 00000" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Personal Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input required type="email" value={formData.personalEmail} onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })} className="input-field pl-12" placeholder="personal@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Residence</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input required type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field pl-12" placeholder="Current address" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Permanent Residence</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input required type="text" value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} className="input-field pl-12" placeholder="Permanent address" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-orange-500 border-l-4 border-orange-500 pl-4 py-1">Identity & Taxation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Aadhaar Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input required type="text" value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} className="input-field pl-12" placeholder="0000 0000 0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">PAN Number</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input required type="text" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} className="input-field pl-12 uppercase" placeholder="ABCDE1234F" />
                    </div>
                  </div>
                </div>
                <div className="p-8 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02] flex flex-col items-center justify-center gap-4 group hover:border-blue-500/20 transition-all">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-all">
                    <Camera className="w-6 h-6 text-gray-500 group-hover:text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-300">Upload Passport Size Photo</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">HD Face clearly visible (Max 2MB)</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-red-500 border-l-4 border-red-500 pl-4 py-1">Emergency Protocol</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contact Full Name</label>
                    <input required type="text" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} className="input-field" placeholder="Emergency contact name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Relationship</label>
                    <input required type="text" value={formData.emergencyContact.relationship} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })} className="input-field" placeholder="e.g. Father, Mother" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input required type="tel" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} className="input-field" placeholder="+91 XXXX XXXX" />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-green-500 border-l-4 border-green-500 pl-4 py-1">Payroll & Banking Information</h3>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                  <input required type="text" value={formData.banking.holderName} onChange={(e) => setFormData({ ...formData, banking: { ...formData.banking, holderName: e.target.value } })} className="input-field" placeholder="As per passbook" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                    <input required type="text" value={formData.banking.bankName} onChange={(e) => setFormData({ ...formData, banking: { ...formData.banking, bankName: e.target.value } })} className="input-field" placeholder="e.g. HDFC, SBI" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                    <input required type="text" value={formData.banking.accountNumber} onChange={(e) => setFormData({ ...formData, banking: { ...formData.banking, accountNumber: e.target.value } })} className="input-field" placeholder="Bank account number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">IFSC Code</label>
                  <input required type="text" value={formData.banking.ifsc} onChange={(e) => setFormData({ ...formData, banking: { ...formData.banking, ifsc: e.target.value } })} className="input-field uppercase" placeholder="HDFC0001234" />
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-purple-500 border-l-4 border-purple-500 pl-4 py-1">Academic & Technical Intel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Highest Qualification</label>
                    <input required type="text" value={formData.highestQualification} onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })} className="input-field" placeholder="B.Tech, MBA" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Proposed Start Date</label>
                    <input required type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Brief Academic Background</label>
                  <textarea required rows={2} value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} className="input-field resize-none" placeholder="University, Major, CGPA..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Core Tech Skills</label>
                  <textarea required rows={3} value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="input-field resize-none" placeholder="React, Node.js, Project Management, Sales Analytics..." />
                </div>
                <div className="p-8 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02] flex flex-col items-center justify-center gap-4 group hover:border-purple-500/20 transition-all">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/10 transition-all">
                    <GraduationCap className="w-6 h-6 text-gray-500 group-hover:text-purple-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-300">Degree Certificate / Marksheet</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">PDF or Image (Max 5MB)</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-4 pt-6 border-t border-white/5">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5"
              >
                <ChevronLeft className="w-4 h-4" /> Go Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 ${step === totalSteps ? 'bg-green-600 hover:bg-green-500 shadow-green-600/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === totalSteps ? (
                <>
                  <Send className="w-3 h-3" /> Finalize Enrollment
                </>
              ) : (
                <>
                  Next Module <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <style>{`
          .input-field {
            width: 100%;
            background: #080808;
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 1.25rem;
            padding: 1rem;
            color: white;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
          }
          .input-field:focus {
            border-color: rgba(59, 130, 246, 0.4);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.05), inset 0 2px 4px rgba(0,0,0,0.5);
          }
          .input-field::placeholder {
            color: rgba(255,255,255,0.2);
            font-style: italic;
          }
        `}</style>
      </motion.div>
    </div>
  );
}

