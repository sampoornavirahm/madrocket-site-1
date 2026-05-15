import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { About } from './components/About';
import { Plans } from './components/Plans';
import { Clients } from './components/Clients';
import { Contact } from './components/Contact';
import { AdminDashboard } from './components/AdminDashboard';
import { SalesDashboard } from './components/SalesDashboard';
import { InternEnrollmentForm } from './components/InternEnrollmentForm';
import { siteService } from './services/siteService';
import { SiteConfig, UserProfile } from './types';
import { DEFAULT_SITE_CONFIG } from './constants';
import { Rocket, LogIn, LogOut, User, Instagram, Linkedin, Twitter, Facebook } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);
  const [config, setConfig] = useState<SiteConfig | null>(null);

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const ADMIN_EMAILS = [
    'piyush.resoluteai@gmail.com',
    'friendswatchgotforfree@gmail.com'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        let profile = await siteService.getUserProfile(u.uid);
        const normalizedEmail = (u.email || '').toLowerCase().trim();
        const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase().trim() === normalizedEmail);
        
        if (!profile) {
          profile = {
            uid: u.uid,
            email: u.email || '',
            role: isAdmin ? 'admin' : 'sales',
            status: isAdmin ? 'active' : 'pending',
            team: null,
            batch: null
          };
          await siteService.createUserProfile(profile);
          
          // Log registration protocol
          try {
            await siteService.createLog({
              userId: u.uid,
              userName: (u.email || 'unknown').split('@')[0],
              action: 'IDENTITY_REGISTERED',
              details: `External identity detected & registered: ${u.email}. State: pending`
            });
          } catch (logErr) {
            console.warn("Telemetry log failed during registration", logErr);
          }
        } else if (isAdmin && (profile.role !== 'admin' || profile.status !== 'active')) {
          // Fix admin profile if it's out of sync
          const updates = { role: 'admin' as const, status: 'active' as const };
          await siteService.updateUserProfile(u.uid, updates);
          profile = { ...profile, ...updates };
        }
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        let siteConfig = await siteService.getConfig();
        
        // If no config found in Firestore
        if (!siteConfig) {
          // IF the admin is logged in, seed the data
          const isAdmin = user?.email && ADMIN_EMAILS.some(e => e.toLowerCase().trim() === user.email?.toLowerCase().trim());
          if (isAdmin) {
            console.log("Admin detected, seeding default configuration...");
            await siteService.seedData(DEFAULT_SITE_CONFIG);
            siteConfig = DEFAULT_SITE_CONFIG;
          } else {
            // Guest user: just use defaults without seeding (avoids permission error)
            siteConfig = DEFAULT_SITE_CONFIG;
          }
        }
        setConfig(siteConfig);
      } catch (err) {
        // Only log if it's not a permission error or if we really care
        console.warn("Failed to load or seed config, using defaults", err);
        setConfig(DEFAULT_SITE_CONFIG);
      } finally {
        setLoading(false);
      }
    }
    
    // We wait for user state to be determined if we're at the very start
    // or just run it if we aren't loading auth state anymore.
    init();
  }, [user]);

  const handleLogin = async () => {
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Full Login Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('Login window closed. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setLoginError('Popup blocked! Please allow popups or open in a new tab.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError('This domain is not authorized in Firebase Auth. Add it to Authorized domains.');
      } else {
        setLoginError(`Login Error: ${error.message || 'Unknown error'}`);
      }
      setTimeout(() => setLoginError(null), 8000);
    }
  };

  const handleLogout = () => signOut(auth);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (config?.marketing) {
      const { googleAnalyticsId, googleTagManagerId, metaPixelId } = config.marketing;

      // Google Analytics 4
      if (googleAnalyticsId) {
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}');
        `;
        document.head.appendChild(script2);
      }

      // Google Tag Manager
      if (googleTagManagerId) {
        const script = document.createElement('script');
        script.innerHTML = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${googleTagManagerId}');
        `;
        document.head.appendChild(script);

        // GTM Noscript
        const noscript = document.createElement('noscript');
        noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.insertBefore(noscript, document.body.firstChild);
      }

      // Meta Pixel
      if (metaPixelId) {
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);

        const noscript = document.createElement('noscript');
        noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />`;
        document.body.appendChild(noscript);
      }
    }
  }, [config?.marketing]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-6">
        <motion.div
           animate={{ 
             y: [0, -20, 0],
             rotate: [0, 5, -5, 0]
           }}
           transition={{ duration: 2, repeat: Infinity }}
        >
          <Rocket className="w-12 h-12 text-blue-500" />
        </motion.div>
        <div className="text-white text-xs uppercase tracking-[0.5em] font-black animate-pulse">Launching Mission Control</div>
      </div>
    );
  }

  if (!config) return null;

  const role = userProfile?.role || 'sales';
  const status = userProfile?.status || 'pending';
  const isGuest = !userProfile;

  if (!isGuest && (role === 'admin' || role === 'sales' || role === 'manager')) {
    if (status === 'pending' && role !== 'admin') {
      return (
        <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-8 p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Rocket className="w-10 h-10 text-blue-500 animate-bounce" />
          </div>
          <div className="space-y-4 max-w-sm">
            <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">Waiting for Activation</h1>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-[0.2em] leading-loose">
              Your mission profile for <span className="text-blue-500">{user?.email}</span> is being reviewed by Mission Command. <br/> 
              You will be granted access once your identity is confirmed.
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
          >
            Switch Account / Logout
          </button>
        </div>
      );
    }

    if (status === 'denied') {
      return (
        <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-8 p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-4">
            <Rocket className="w-10 h-10 text-red-500 rotate-180" />
          </div>
          <div className="space-y-4 max-w-sm">
            <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">Access Denied</h1>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-[0.2em] leading-loose">
              Your request for access has been declined. <br/> 
              Contact the administrator if you believe this is an error.
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-full text-white text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
          >
            Switch Account / Logout
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#050505] font-sans selection:bg-blue-500 selection:text-white">
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-500" />
              <span className="text-xl font-bold tracking-tighter uppercase italic text-white leading-none">
                MadRocket <span className="text-blue-500 text-[10px] uppercase tracking-widest not-italic align-top ml-2">{role}</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="hidden md:flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-blue-500">
                <User className="w-3 h-3" /> {user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            {role === 'admin' || role === 'manager' ? (
              <AdminDashboard config={config} userProfile={userProfile!} />
            ) : userProfile.isEnrollmentActive && (!userProfile.enrollment || userProfile.enrollment.status === 'none') ? (
              <InternEnrollmentForm 
                userProfile={userProfile} 
                onComplete={() => siteService.getUserProfile(userProfile.uid).then(setUserProfile)} 
              />
            ) : (
              <SalesDashboard 
                userProfile={userProfile} 
                teams={config.teams || []} 
                batches={config.batches || []} 
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans selection:bg-blue-500 selection:text-white">
      <Navbar currentPage={currentPage} onPageChange={handlePageChange} />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero 
                title={config.hero.title} 
                subtitle={config.hero.subtitle} 
                cta={config.hero.cta}
                onCtaClick={() => handlePageChange('services')}
              />
            </motion.div>
          )}

          {currentPage === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Services services={config.services} />
            </motion.div>
          )}

          {currentPage === 'clients' && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
            >
              <Clients clients={config.clients || []} onJoinRoster={() => setCurrentPage('contact')} />
            </motion.div>
          )}

          {currentPage === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <About title={config.about.title} content={config.about.content} />
            </motion.div>
          )}

          {currentPage === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
            >
              <Plans plans={config.plans} onSelectPlan={handlePlanSelect} />
            </motion.div>
          )}

          {currentPage === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Contact 
                email={config.contact.email} 
                address={config.contact.address} 
                initialPlan={selectedPlan}
                onPlanSelected={() => setSelectedPlan(undefined)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 bg-[#050505] text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="flex items-center justify-center gap-2">
            <Rocket className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold tracking-tighter uppercase italic text-white">MadRocket</span>
          </div>

          {config.socialLinks && (
            <div className="flex items-center gap-6">
              {config.socialLinks.instagram && (
                <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {config.socialLinks.linkedin && (
                <a href={config.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {config.socialLinks.twitter && (
                <a href={config.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {config.socialLinks.facebook && (
                <a href={config.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
          
          <div className="flex flex-col items-center gap-4">
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded"
              >
                {loginError}
              </motion.div>
            )}
            {!user ? (
              <button 
                onClick={handleLogin}
                className="opacity-20 hover:opacity-100 transition-opacity flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
              >
                <LogIn className="w-3 h-3" /> Login
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 flex items-center gap-2">
                  <User className="w-3 h-3" /> {user.email} {ADMIN_EMAILS.some(e => e.toLowerCase().trim() === user.email?.toLowerCase().trim()) && '(Admin)'}
                </span>
                <button 
                  onClick={handleLogout}
                  className="opacity-20 hover:opacity-100 transition-opacity flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-[10px] uppercase tracking-widest leading-loose">
            &copy; {new Date().getFullYear()} MadRocket Tech & Media. All rights reserved. <br/>
            Engineered for growth in India.
          </p>
        </div>
      </footer>
    </div>
  );
}
