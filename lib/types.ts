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
  keywordUpdates: KeywordUpdate[];
  recommendedPages: SeoPageRecommendation[];
  recommendedFixes: FixRecommendation[];
};

export type KeywordUpdate = {
  currentText: string;
  suggestedText: string;
  page: string;
  reason: string;
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

export type PpcManualOverrides = {
  businessName?: string;
  phoneNumber?: string;
  serviceCities?: string[];
  monthlyBudget?: number;
  servicesToPrioritize?: string[];
  emergencyService?: boolean;
  financing?: boolean;
  freeEstimates?: boolean;
  licensedAndInsured?: boolean;
  broadMatchEnabled?: boolean;
};

export type PpcCampaign = {
  campaign: string;
  campaignType: "Search";
  dailyBudget: number;
  priority: "High" | "Medium" | "Low";
  whyRecommended: string;
};

export type PpcAdGroup = {
  campaign: string;
  adGroup: string;
};

export type PpcKeyword = {
  campaign: string;
  adGroup: string;
  keyword: string;
  matchType: "Exact" | "Phrase" | "Broad";
  intentLevel: "High" | "Medium" | "Test";
  notes: string;
};

export type PpcResponsiveSearchAdAsset = {
  campaign: string;
  adGroup: string;
  assetType: "Headline" | "Description";
  text: string;
  length: number;
  notes: string;
};

export type PpcLandingPageRecommendation = {
  campaign: string;
  adGroup: string;
  bestExistingLandingPage: string;
  recommendation: string;
  suggestedPageTitle: string;
  suggestedH1: string;
  suggestedCta: string;
  metaDescription: string;
};

export type PpcCsvExport = {
  fileName: string;
  label: string;
  dataUrl: string;
};

export type PpcPlan = {
  detected: {
    businessName: string;
    phoneNumber: string;
    services: string[];
    serviceCities: string[];
    financing: boolean;
    emergencyService: boolean;
    maintenancePlans: boolean;
    waterHeaters: boolean;
    heatPumps: boolean;
    indoorAirQuality: boolean;
    trustSignals: string[];
    ctas: string[];
    existingLandingPages: Array<{ label: string; title: string; url: string }>;
  };
  campaignStrategy: PpcCampaign[];
  campaigns: PpcCampaign[];
  adGroups: PpcAdGroup[];
  keywords: PpcKeyword[];
  negativeKeywords: Array<{ negativeKeyword: string; matchType: "Phrase" }>;
  responsiveSearchAds: PpcResponsiveSearchAdAsset[];
  assets: {
    callouts: Array<{ campaign: string; callout: string }>;
    sitelinks: Array<{
      campaign: string;
      sitelinkText: string;
      description1: string;
      description2: string;
      finalUrl: string;
    }>;
    structuredSnippets: Array<{ campaign: string; header: string; values: string }>;
    displayPaths: Array<{ campaign: string; adGroup: string; path1: string; path2: string }>;
  };
  landingPageRecommendations: PpcLandingPageRecommendation[];
  report: {
    recommendedLaunchCampaigns: string[];
    budgetRecommendation: string;
    servicesPrioritized: string[];
    searchIntentAnalysis: string[];
    missingLandingPages: string[];
    trackingRecommendations: string[];
    nextSteps: string[];
  };
  csvExports: PpcCsvExport[];
};

export type ScrapedPage = {
  label: "Homepage" | "About" | "Services" | "Contact" | "Financing";
  url: string;
  title: string;
  markdown: string;
  html: string;
};

export type AnalyzedPage = Pick<ScrapedPage, "label" | "title" | "url">;
