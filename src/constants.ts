import { SiteConfig } from './types';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brand: "Mad Rocket",
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
      id: "ignition",
      name: "Ignition",
      price: "₹15,000",
      features: [
        "High-Converting Landing Page",
        "Essential SEO Setup",
        "Google Business Profile",
        "Basic Analytics Integration"
      ]
    },
    {
      id: "orbital",
      name: "Orbital",
      price: "₹45,000",
      features: [
        "5-Page Premium Website",
        "Advanced SEO Strategy",
        "Performance Ads Strategy",
        "CMS Integration",
        "Priority Support"
      ],
      highlight: true
    },
    {
      id: "interstellar",
      name: "Interstellar",
      price: "Custom",
      features: [
        "Full E-commerce Ecosystem",
        "Omni-channel Marketing",
        "Brand Identity Workshop",
        "Dedicated Growth Manager",
        "Custom Feature Development"
      ]
    }
  ],
  about: {
    title: "Built for Success",
    content: "At Mad Rocket, we don't just build websites; we build growth engines. Based in India, we work with ambitious entrepreneurs to turn their vision into market-leading digital realities."
  },
  contact: {
    email: "hello@madrocket.in",
    address: "Nagpur, India"
  }
};
