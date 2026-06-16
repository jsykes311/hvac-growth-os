export type BusinessProfile = {
  companyName: string;
  phone: string;
  email: string;
  services: string[];
  serviceAreas: string[];
  financingMentioned: boolean;
  emergencyServiceMentioned: boolean;
  maintenancePlanMentioned: boolean;
  brandTone: string;
  differentiators: string[];
  growthScore: number;
  topGrowthOpportunities: string[];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  heroImageUrl: string;
  brandStyle: string;
};

export type CampaignOutput = {
  facebookAd: string;
  googleBusinessProfilePost: string;
  emailCampaign: string;
  seoPageRecommendation: string;
  landingPageHero: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    supportingBullets: string[];
  };
};

export type CampaignImage = {
  dataUrl: string;
  fileName: string;
  format: "svg";
  width: number;
  height: number;
};

export type ScrapedPage = {
  label: "Homepage" | "About" | "Services" | "Contact" | "Financing";
  url: string;
  title: string;
  markdown: string;
  html: string;
};

export type AnalyzedPage = Pick<ScrapedPage, "label" | "title" | "url">;
