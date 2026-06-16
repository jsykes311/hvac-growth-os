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
  seoAnalysis: SeoAnalysis;
  aiSeoAnalysis: AiSeoAnalysis;
};

export type SeoPageRecommendation = {
  title: string;
  slug: string;
  searchIntent: string;
  priority: "High" | "Medium" | "Low";
  rationale: string;
};

export type SeoAnalysis = {
  score: number;
  titleTag: string;
  metaDescription: string;
  localSeoGaps: string[];
  technicalIssues: string[];
  contentOpportunities: string[];
  recommendedPages: SeoPageRecommendation[];
  recommendedFixes: FixRecommendation[];
};

export type AiSeoAnalysis = {
  score: number;
  answerEngineReadiness: string;
  citationOpportunities: string[];
  schemaRecommendations: string[];
  faqQuestions: string[];
  entityGaps: string[];
  recommendedFixes: FixRecommendation[];
};

export type FixRecommendation = {
  problem: string;
  fix: string;
  priority: "High" | "Medium" | "Low";
  impact: string;
  effort: "Quick" | "Moderate" | "Heavy";
};

export type CampaignOutput = {
  facebookAd: string;
  googleBusinessProfilePost: string;
  emailCampaign: string;
  seoPageRecommendation: string;
  aiSeoRecommendation: string;
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
