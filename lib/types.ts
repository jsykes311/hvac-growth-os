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
  averageRepairTicket?: number;
  averageReplacementTicket?: number;
  estimatedCloseRate?: number;
  estimatedLeadToEstimateRate?: number;
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
  monthlyBudgetEstimate?: number;
  priority: "High" | "Medium" | "Low";
  readinessScore?: number;
  readinessStatus?: "Ready" | "Needs Work" | "Not Recommended";
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
  intentLevel: "High" | "Medium" | "Low" | "Test";
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
  landingPageReadinessScore: number;
  recommendation: string;
  suggestedPageTitle: string;
  suggestedH1: string;
  suggestedCta: string;
  metaDescription: string;
};

export type RevenueCampaignReadiness = {
  campaignKey: string;
  campaignName: string;
  priorityScore: number;
  readinessStatus: "Ready" | "Needs Work" | "Not Recommended";
  reasoning: string;
  missingRequirements: string[];
  recommendedFirstAction: string;
};

export type RevenueLaunchPlanItem = {
  campaign: string;
  priorityScore: number;
  recommendedDailyBudget: number;
  monthlyBudgetEstimate: number;
  whyLaunchNow: string;
};

export type RevenueForecast = {
  monthlyAdBudget: number;
  averageRepairTicket: number;
  averageReplacementTicket: number;
  estimatedCloseRate: number;
  estimatedLeadToEstimateRate: number;
  estimatedClicks: number;
  estimatedLeads: number;
  estimatedCostPerLead: number;
  estimatedBookedJobs: number;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  simpleRoiLow: number;
  simpleRoiHigh: number;
  notes: string[];
};

export type RevenueChecklistItem = {
  category: string;
  item: string;
  status: "Ready" | "Needs Work";
  notes: string;
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
  campaignReadiness: RevenueCampaignReadiness[];
  recommendedLaunchPlan: RevenueLaunchPlanItem[];
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
  roiForecast: RevenueForecast;
  implementationChecklist: RevenueChecklistItem[];
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
