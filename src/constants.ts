import { SiteConfig } from './types';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brand: "MadRocket",
  hero: {
    title: "We Launch Your Ideas Into Orbit",
    subtitle: "High-performance marketing and premium web solutions designed to scale your business to the stratosphere.",
    cta: "Launch Your Project"
  },
  services: [
    {
      id: "marketing",
      title: "Performance Marketing",
      description: "ROI-driven campaigns across Meta, Google, and LinkedIn that convert clicks into customers.",
      icon: "Rocket"
    },
    {
      id: "web",
      title: "Web Development",
      description: "Fast, aesthetic, and high-converting e-commerce and custom web solutions for modern brands.",
      icon: "Code"
    },
    {
      id: "branding",
      title: "Branding & Identity",
      description: "Crafting unique visual identities and brand voices that resonate with your target audience.",
      icon: "Palette"
    },
    {
      id: "strategy",
      title: "Growth Strategy",
      description: "Data-backed roadmaps to help your business achieve long-term sustainable growth.",
      icon: "Zap"
    }
  ],
  plans: [
    {
      id: "foundation",
      name: "The Digital Foundation",
      price: "₹50,000",
      features: [
        "Strictly School Website Only",
        "₹20,000 Annual AMC (From Year 2)",
        "Minimum 7% Annual Increase (Year 3+)",
        "Professional Standard Website Layout",
        "100 Free Content Posts",
        "Standard Maintenance only",
        "Free Hosting (Yr 1); Actuals thereafter",
        "8-Hour Working Call Support",
        "Resolution within 72 Hours",
        "Standard Ticketing System Access"
      ]
    },
    {
      id: "adaptive",
      name: "The Adaptive Subscription",
      price: "₹50k - ₹4.5L",
      features: [
        "Evolving Digital Subscription model",
        "Premium Design & Brand Positioning",
        "Recurring Annual Subscription License",
        "Minimum 5% Annual Increase",
        "200 Free Content Posts",
        "Periodic Design & Feature Updates",
        "Cloud hosting included (Standard)",
        "24x7 Call Support",
        "Resolution within 48 Hours",
        "Social Media & Presence Management"
      ],
      highlight: true
    },
    {
      id: "virtual-campus",
      name: "The Virtual Campus (Elite)",
      price: "₹5,00,000+",
      features: [
        "All-Inclusive Custom Ecosystem",
        "Custom Quoted Annual Recurring",
        "Minimum 5% Annual Increase",
        "Best-in-Class Bespoke Visual Identity",
        "Unlimited Free Content Posts",
        "On-Demand Priority Design Updates",
        "Premium Cloud Hosting included",
        "Dedicated Support Engineer (24x7)",
        "Resolution within 24 Hours",
        "Custom Mini-Apps (Admission/Results)",
        "Full 3rd-Party Software Integration",
        "SEO, SMM & Brand Growth Management"
      ]
    }
  ],
  about: {
    title: "Built for Success",
    content: "At MadRocket, we don't just build websites; we build growth engines. Based in India, we work with ambitious entrepreneurs to turn their vision into market-leading digital realities."
  },
  contact: {
    email: "hello@madrocket.in",
    address: "Nagpur, India"
  },
  clients: [
    "Bhange Academy",
    "SGHP School",
    "Ranwara Farms",
    "Dash Corp OOH",
    "Black Fantasy Footwear",
    "SR Events Management",
    "Itsyumm Food Delivery",
    "Time The Race",
    "Rapha Health System",
    "Star Concept Service",
    "TigerMan Sports",
    "Miles N Milers",
    "CSD Mediatech"
  ],
  socialLinks: {
    instagram: "https://instagram.com/madrocket",
    linkedin: "https://linkedin.com/company/madrocket",
    twitter: "https://twitter.com/madrocket",
    facebook: "https://facebook.com/madrocket"
  },
  marketing: {
    googleAnalyticsId: "",
    googleTagManagerId: "",
    metaPixelId: ""
  }
};
