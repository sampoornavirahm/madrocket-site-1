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
}

export interface Enquiry {
  name: string;
  email: string;
  plan: string;
  message: string;
  createdAt: any; // Firestore Timestamp
}
