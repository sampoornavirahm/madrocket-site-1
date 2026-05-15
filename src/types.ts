export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
}

export interface SiteConfig {
  brand: string;
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  services: Service[];
  plans: Plan[];
  about: {
    title: string;
    content: string;
  };
  contact: {
    email: string;
    address: string;
  };
  clients?: string[];
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  marketing?: {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    metaPixelId?: string;
  };
  teams?: string[];
  batches?: string[];
}

export interface Enquiry {
  name: string;
  email: string;
  plan: string;
  message: string;
  createdAt: any; // Firestore Timestamp
}

export type UserRole = 'admin' | 'sales' | 'manager';

export interface InternEnrollment {
  fullName: string;
  address: string;
  education: string;
  skills: string;
  startDate: string;
  submittedAt: any;
  status: 'none' | 'pending' | 'approved' | 'declined';
  comment?: string;
  stipend?: {
    fixed: number;
    variable: {
      type: 'amount' | 'percentage';
      value: number;
      description: string;
    };
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'active' | 'denied';
  team?: string | null; // e.g. "School Website", "Real Estate"
  batch?: string | null; // e.g. "Batch May 2026"
  isEnrollmentActive?: boolean;
  enrollment?: InternEnrollment;
}

export type LeadStatus = 
  | 'New' 
  | 'Contacted' 
  | 'Qualified' 
  | 'Demo Scheduled' 
  | 'Negotiation' 
  | 'Closed Won' 
  | 'Closed Lost'
  | 'Deleted';

export interface LeadComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
  statusUpdate?: LeadStatus;
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: LeadStatus;
  team: string; // "School Website", "Real Estate", etc.
  batch: string; // The batch the sales person belongs to
  salesRepId: string; // UID of the user who owns the lead
  salesRepName: string;
  notes?: string;
  
  // School Specific Fields
  schoolName?: string;
  cityArea?: string;
  decisionMaker?: string; // Principal/Trustee/Other
  currentDigitalStatus?: string;
  contactNumber?: string;
  meetingDate?: string;
  potentialTier?: string; // 1/2/3
  leadCategory?: string; // Cold/Warm/Hot/Closed
  nextActionItem?: string;
  
  comments?: LeadComment[];
  updatedAt: any;
  createdAt: any;
}

export interface SystemLog {
  id?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: any;
}
