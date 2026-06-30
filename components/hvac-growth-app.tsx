"use client";

import {
  ArrowLeft,
  Bot,
  Brain,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardList,
  CloudSun,
  Download,
  FileText,
  FileSearch,
  Gauge,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Megaphone,
  Palette,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import type { AuthSession } from "@/lib/auth";
import type {
  AnalyzedPage,
  BusinessProfile,
  CampaignImage,
  CampaignOutput,
  PpcManualOverrides,
  PpcPlan,
} from "@/lib/types";
import { Button, Eyebrow, FieldLabel, Panel } from "@/components/ui";

type View = "home" | "results";
type PlatformSection =
  | "dashboard"
  | "website-audit"
  | "seo"
  | "ai-visibility"
  | "connected-apps"
  | "conversion-tracking"
  | "ai-cmo"
  | "revenue-engine"
  | "marketing-intelligence"
  | "market-intelligence"
  | "deploy-center"
  | "client-workspace"
  | "reports"
  | "settings";
type ApiError = { error?: string };
type ReadinessItem = {
  complete: boolean;
  detail: string;
  label: string;
};
type IntelligenceSnapshot = {
  id: string;
  date: string;
  seoScore: number;
  aiVisibilityScore: number;
  growthScore: number;
  revenueScore: number;
  googleAdsScore: number;
  gbpScore: number;
  highLevelScore: number;
  demandIndex: number;
  topService: string;
  topCity: string;
  weather: string;
  forecast: string;
  recommendations: string[];
  actionsTaken: string[];
  notes: string;
};
type DecisionStatus = "Pending" | "Approved" | "In Progress" | "Completed" | "Ignored" | "Archived";
type DecisionRecommendation = {
  id: string;
  category: "Revenue" | "SEO" | "Google Ads" | "Google Business Profile" | "Website" | "CRM" | "Social Media" | "Email" | "Brand" | "Competitor";
  recommendedAction: string;
  priority: "High" | "Medium" | "Low";
  expectedImpact: string;
  estimatedRevenueOpportunity: string;
  confidenceScore: number;
  difficulty: "Easy" | "Moderate" | "Hard";
  estimatedTime: string;
  dependencies: string[];
  reasoning: string;
};
type DeploymentApprovalStatus = "Pending" | "Approved" | "Dismissed" | "Remind Later";
type DeploymentRuntimeStatus = "Waiting" | "Success" | "Failed";
type ChannelStatus = "Ready" | "Needs Setup" | "Pending Review" | "Deployed" | "Failed";
type DeploymentTarget =
  | "Google Ads"
  | "Google Business Profile"
  | "Social Media"
  | "Website / Landing Pages"
  | "SEO"
  | "HighLevel / CRM"
  | "Reports";
type DeploymentCandidate = {
  id: string;
  target: DeploymentTarget;
  title: string;
  recommendation: string;
  preview: string[];
  dependencies: Array<{ label: string; exists: boolean; detail: string }>;
  deployMode: string;
  intelligenceMemoryNote: string;
};
type DeploymentRecord = {
  id: string;
  deploymentId: string;
  target: DeploymentTarget;
  title: string;
  approvalStatus: DeploymentApprovalStatus;
  runtimeStatus: DeploymentRuntimeStatus;
  log: string[];
  history: Array<{ date: string; actor: string; event: string }>;
  deployedAt?: string;
  deployedBy?: string;
};
type PermissionMode = "Read Only" | "Draft Mode" | "Agency Mode" | "Owner Mode";
type ConnectedAppStatus = {
  googleAds: {
    activeCustomerId: string;
    connected: boolean;
    configured: boolean;
    credentialStorage: string;
    customerIds: string[];
    lastSyncAt: string;
    permissionMode: PermissionMode;
    setup: {
      items: Array<{ configured: boolean; detail: string; envVar: string; label: string }>;
      missingItems: string[];
      ready: boolean;
    };
    tokenStored: boolean;
  };
  highLevel: {
    activeLocationId: string;
    callsTracked: number;
    closedWon: number;
    closedWonValue: number;
    connected: boolean;
    connectedLocation: string;
    connectionSource: string;
    credentialStorage: string;
    configured: boolean;
    formsSubmitted: number;
    lastSyncAt: string;
    leadSources: Array<{ source: string; count: number; value: number }>;
    missedCalls: number;
    openOpportunities: number;
    openPipelineValue: number;
    permissionMode: PermissionMode;
    pipelineValue: number;
    setup: {
      items: Array<{ configured: boolean; detail: string; envVar: string; label: string }>;
      missingItems: string[];
      ready: boolean;
    };
    tokenStored: boolean;
    totalContacts: number;
    totalConversations: number;
    totalOpportunities: number;
  };
};
type GoogleAdsMetricRow = {
  id: string;
  name: string;
  campaign?: string;
  adGroup?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgCpc: number;
  cost: number;
  conversions: number;
};
type GoogleAdsDataPayload = {
  activeCustomerId: string;
  lastSyncAt: string;
  campaigns: GoogleAdsMetricRow[];
  adGroups: GoogleAdsMetricRow[];
  keywords: GoogleAdsMetricRow[];
  searchTerms: GoogleAdsMetricRow[];
  ads: GoogleAdsMetricRow[];
  assets: GoogleAdsMetricRow[];
  budgets: Array<{ id: string; name: string; amount: number; status: string }>;
  conversions: GoogleAdsMetricRow[];
};
type HighLevelRecord = {
  id: string;
  name: string;
  status?: string;
  source?: string;
  stage?: string;
  type?: string;
  value?: number;
  createdAt?: string;
};
type RevenueFunnelPayload = {
  googleAdsClicks: number;
  googleAdsSpend: number;
  crmLeads: number;
  phoneCalls: number;
  missedCalls: number;
  formsSubmitted: number;
  totalConversations: number;
  totalOpportunities: number;
  leads: number;
  estimates: number;
  wonOpportunities: number;
  wonJobs: number;
  openPipelineValue: number;
  closedWonValue: number;
  pipelineValue: number;
  revenue: number;
  estimatedRevenue: number;
  roi: number;
  leadSources: Array<{ source: string; count: number; value: number }>;
  opportunityStages: Array<{ stage: string; count: number; value: number }>;
  campaignAttribution: Array<{ campaign: string; leads: number; value: number }>;
};
type HighLevelSnapshot = {
  closedWon: number;
  contacts: number;
  estimatedRevenue: number;
  formsSubmitted: number;
  missedCalls: number;
  openOpportunities: number;
  phoneCalls: number;
  pipelineValue: number;
  syncedAt: string;
  wonJobs: number;
};
type HighLevelDataPayload = {
  activeLocationId: string;
  connectedLocation: string;
  lastSyncAt: string;
  syncRange: {
    endDate: string;
    startDate: string;
  };
  locations: HighLevelRecord[];
  contacts: HighLevelRecord[];
  opportunities: HighLevelRecord[];
  opportunityStages: HighLevelRecord[];
  pipelines: HighLevelRecord[];
  conversations: HighLevelRecord[];
  calls: HighLevelRecord[];
  calendars: HighLevelRecord[];
  forms: HighLevelRecord[];
  formSubmissions: HighLevelRecord[];
  tags: HighLevelRecord[];
  workflows: HighLevelRecord[];
  customFields: HighLevelRecord[];
  revenueFunnel: RevenueFunnelPayload;
  snapshots: HighLevelSnapshot[];
  syncAlerts: string[];
};
type TrackingIssueStatus = "Ready" | "Needs Work" | "Missing";
type TrackingRecommendation = {
  title: string;
  category: "Primary" | "Secondary" | "Diagnostic";
  status: TrackingIssueStatus;
  reason: string;
  importGuidance: string;
  confidence: number;
};
type ImplementationChannel = {
  target: DeploymentTarget;
  status: ChannelStatus;
  pendingDeployments: number;
  topRecommendedDeployment: string;
  requiredIntegrations: string[];
  blockingIssues: string[];
  lastDeployedItem: string;
  candidate?: DeploymentCandidate;
};

const CAMPAIGN_GOALS = [
  "Book more service calls",
  "Promote replacement installs",
  "Sell maintenance plans",
  "Grow emergency repair leads",
  "Launch financing offer",
];

const PLATFORM_NAV: Array<{ id: PlatformSection; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "website-audit", label: "Website Audit" },
  { id: "seo", label: "SEO" },
  { id: "ai-visibility", label: "AI Visibility" },
  { id: "connected-apps", label: "Connected Apps" },
  { id: "conversion-tracking", label: "Conversion Tracking" },
  { id: "ai-cmo", label: "AI CMO" },
  { id: "revenue-engine", label: "Revenue Engine" },
  { id: "marketing-intelligence", label: "Marketing Intelligence" },
  { id: "market-intelligence", label: "Market Intelligence" },
  { id: "deploy-center", label: "Deploy Center" },
  { id: "client-workspace", label: "Client Workspace" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

export function HvacGrowthApp({ currentUser }: { currentUser: AuthSession }) {
  const [contractorUrl, setContractorUrl] = useState("");
  const [view, setView] = useState<View>("home");
  const [activeSection, setActiveSection] = useState<PlatformSection>("dashboard");
  const [analysis, setAnalysis] = useState<BusinessProfile | null>(null);
  const [scrapedPages, setScrapedPages] = useState<AnalyzedPage[]>([]);
  const [campaign, setCampaign] = useState<CampaignOutput | null>(null);
  const [campaignImage, setCampaignImage] = useState<CampaignImage | null>(null);
  const [ppcPlan, setPpcPlan] = useState<PpcPlan | null>(null);
  const [ppcOverrides, setPpcOverrides] = useState<PpcManualOverrides>({
    monthlyBudget: 3000,
    averageRepairTicket: 750,
    averageReplacementTicket: 9500,
    estimatedCloseRate: 35,
    estimatedLeadToEstimateRate: 65,
    serviceCities: [],
    servicesToPrioritize: [],
  });
  const [goal, setGoal] = useState(CAMPAIGN_GOALS[0]);
  const [offer, setOffer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isCreatingPpcPlan, setIsCreatingPpcPlan] = useState(false);
  const [error, setError] = useState("");

  const isReady = contractorUrl.trim().length > 3;

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady || isAnalyzing) return;

    setIsAnalyzing(true);
    setError("");
    setScrapedPages([]);
    setCampaign(null);
    setCampaignImage(null);
    setPpcPlan(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: contractorUrl }),
      });
      const payload = (await response.json()) as { profile?: BusinessProfile; scrapedPages?: AnalyzedPage[] } & ApiError;

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Unable to analyze this website.");
      }

      setAnalysis(payload.profile);
      setScrapedPages(payload.scrapedPages ?? []);
      setPpcOverrides({
        businessName: payload.profile.companyName,
        phoneNumber: payload.profile.phone,
        serviceCities: payload.profile.serviceAreas,
        monthlyBudget: 3000,
        averageRepairTicket: 750,
        averageReplacementTicket: 9500,
        estimatedCloseRate: 35,
        estimatedLeadToEstimateRate: 65,
        servicesToPrioritize: [],
        emergencyService: payload.profile.emergencyServiceMentioned,
        financing: payload.profile.financingMentioned,
      });
      setActiveSection("dashboard");
      setView("results");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to analyze this website.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!analysis || !offer.trim() || isCreatingCampaign) return;

    setIsCreatingCampaign(true);
    setError("");

    try {
      const response = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: analysis, goal, offer }),
      });
      const payload = (await response.json()) as {
        campaign?: CampaignOutput;
        campaignImage?: CampaignImage;
      } & ApiError;

      if (!response.ok || !payload.campaign) {
        throw new Error(payload.error || "Unable to create a campaign.");
      }

      setCampaign(payload.campaign);
      setCampaignImage(payload.campaignImage ?? null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create a campaign.");
    } finally {
      setIsCreatingCampaign(false);
    }
  }

  async function handleCreatePpcPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!analysis || isCreatingPpcPlan) return;

    setIsCreatingPpcPlan(true);
    setError("");

    try {
      const response = await fetch("/api/ppc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: analysis,
          scrapedPages,
          url: contractorUrl,
          overrides: ppcOverrides,
        }),
      });
      const payload = (await response.json()) as { plan?: PpcPlan } & ApiError;

      if (!response.ok || !payload.plan) {
        throw new Error(payload.error || "Unable to create a PPC plan.");
      }

      setPpcPlan(payload.plan);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create a PPC plan.");
    } finally {
      setIsCreatingPpcPlan(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <div className="background-effects" aria-hidden="true" />
      <div className="glow glow-one" aria-hidden="true" />
      <div className="glow glow-two" aria-hidden="true" />
      <div className="wave wave-one" aria-hidden="true" />
      <div className="wave wave-two" aria-hidden="true" />
      <div className="wave wave-three" aria-hidden="true" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <Header currentUser={currentUser} />

        {view === "home" ? (
          <HomeView
            contractorUrl={contractorUrl}
            error={error}
            isAnalyzing={isAnalyzing}
            isReady={isReady}
            onSubmit={handleAnalyze}
            setContractorUrl={setContractorUrl}
          />
        ) : (
          analysis && (
            <ResultsView
              analysis={analysis}
              campaign={campaign}
              campaignImage={campaignImage}
              contractorUrl={contractorUrl}
              error={error}
              goal={goal}
              isCreatingCampaign={isCreatingCampaign}
              isCreatingPpcPlan={isCreatingPpcPlan}
              offer={offer}
              ppcOverrides={ppcOverrides}
              ppcPlan={ppcPlan}
              scrapedPages={scrapedPages}
              activeSection={activeSection}
              onBack={() => {
                setView("home");
                setError("");
              }}
              onCreateCampaign={handleCreateCampaign}
              onCreatePpcPlan={handleCreatePpcPlan}
              setActiveSection={setActiveSection}
              onUpdateAnalysis={(nextAnalysis) => {
                setAnalysis(nextAnalysis);
                setCampaign(null);
                setCampaignImage(null);
                setPpcPlan(null);
              }}
              setGoal={setGoal}
              setOffer={setOffer}
              setPpcOverrides={setPpcOverrides}
            />
          )
        )}
      </div>
    </main>
  );
}

function Header({ currentUser }: { currentUser: AuthSession }) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <header className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-ink to-flame text-white shadow-[0_18px_42px_rgba(25,184,181,0.22)]">
          <ChartNoAxesCombined className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-black leading-tight text-ink">HVAC Growth OS</p>
          <p className="text-xs font-medium text-graphite/70">Contractor growth intelligence</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-sm font-bold text-graphite/75 shadow-[0_10px_28px_rgba(6,57,68,0.04)]">
          <span className="text-ink">{currentUser.name}</span>
          <span className="mx-2 text-graphite/35">/</span>
          <span>{currentUser.role}</span>
        </div>
        <button
          className="rounded-full border border-ink/10 bg-white/85 px-4 py-2 text-sm font-black text-ink transition hover:border-flame/40 hover:bg-white"
          onClick={handleLogout}
          type="button"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function HomeView({
  contractorUrl,
  error,
  isAnalyzing,
  isReady,
  onSubmit,
  setContractorUrl,
}: {
  contractorUrl: string;
  error: string;
  isAnalyzing: boolean;
  isReady: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setContractorUrl: (value: string) => void;
}) {
  return (
    <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <section>
        <Eyebrow>Implementation platform</Eyebrow>
        <h1 className="max-w-3xl text-5xl font-black leading-[1.02] text-ink sm:text-6xl">
          Turn an HVAC website into a deployed growth system.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite">
          Enter a contractor URL. HVAC Growth OS builds the workspace, audits the site, creates the Revenue Engine, and organizes the assets needed to launch.
        </p>
        <OnboardingPreview />
        <OperatingChannels />
      </section>

      <Panel className="w-full">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <FieldLabel>Contractor website URL</FieldLabel>
            <input
            className="h-14 w-full rounded-lg border border-ink/15 bg-white px-4 text-base text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
              onChange={(event) => setContractorUrl(event.target.value)}
              onInput={(event) => setContractorUrl(event.currentTarget.value)}
              placeholder="https://examplehvac.com"
              value={contractorUrl}
            />
          </div>
          <Button disabled={!isReady || isAnalyzing} type="submit">
            {isAnalyzing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
          {error && <ErrorMessage message={error} />}
        </form>
      </Panel>
    </div>
  );
}

function ResultsView({
  analysis,
  campaign,
  campaignImage,
  contractorUrl,
  error,
  goal,
  isCreatingCampaign,
  isCreatingPpcPlan,
  offer,
  ppcOverrides,
  ppcPlan,
  scrapedPages,
  activeSection,
  onBack,
  onCreateCampaign,
  onCreatePpcPlan,
  onUpdateAnalysis,
  setActiveSection,
  setGoal,
  setOffer,
  setPpcOverrides,
}: {
  analysis: BusinessProfile;
  campaign: CampaignOutput | null;
  campaignImage: CampaignImage | null;
  contractorUrl: string;
  error: string;
  goal: string;
  isCreatingCampaign: boolean;
  isCreatingPpcPlan: boolean;
  offer: string;
  ppcOverrides: PpcManualOverrides;
  ppcPlan: PpcPlan | null;
  scrapedPages: AnalyzedPage[];
  activeSection: PlatformSection;
  onBack: () => void;
  onCreateCampaign: (event: FormEvent<HTMLFormElement>) => void;
  onCreatePpcPlan: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateAnalysis: (analysis: BusinessProfile) => void;
  setActiveSection: (section: PlatformSection) => void;
  setGoal: (value: string) => void;
  setOffer: (value: string) => void;
  setPpcOverrides: (value: PpcManualOverrides) => void;
}) {
  function updateBrandColor(field: "primaryColor" | "secondaryColor" | "accentColor", value: string) {
    onUpdateAnalysis({ ...analysis, [field]: value });
  }

  function updateProfileField<K extends keyof BusinessProfile>(field: K, value: BusinessProfile[K]) {
    onUpdateAnalysis({ ...analysis, [field]: value });
  }

  function updateProfileList(field: "services" | "serviceAreas" | "differentiators" | "topGrowthOpportunities", value: string) {
    updateProfileField(field, linesToList(value));
  }

  const readinessItems = buildReadinessItems(analysis);
  const readinessScore = Math.round((readinessItems.filter((item) => item.complete).length / readinessItems.length) * 100);
  const clientHealth = buildClientHealth(analysis, ppcPlan);

  return (
    <div className="py-9">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <button
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-graphite transition hover:text-flame"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            New analysis
          </button>
          <Eyebrow>Business Profile</Eyebrow>
          <h1 className="text-4xl font-black text-ink">{analysis.companyName || "Unknown HVAC Company"}</h1>
          <p className="mt-2 break-all text-sm font-medium text-graphite/70">{contractorUrl}</p>
        </div>
      </div>

      <PlatformNav activeSection={activeSection} onChange={setActiveSection} />

      {activeSection === "dashboard" && (
        <DashboardSection
          analysis={analysis}
          clientHealth={clientHealth}
          contractorUrl={contractorUrl}
          ppcPlan={ppcPlan}
          setActiveSection={setActiveSection}
        />
      )}

      {activeSection === "website-audit" && (
        <WebsiteAuditSection
          analysis={analysis}
          readinessItems={readinessItems}
          readinessScore={readinessScore}
          scrapedPages={scrapedPages}
          updateBrandColor={updateBrandColor}
        />
      )}

      {activeSection === "seo" && <SeoAnalysisPanel analysis={analysis} />}
      {activeSection === "ai-visibility" && <AiSeoAnalysisPanel analysis={analysis} />}
      {activeSection === "connected-apps" && <ConnectedAppsSection />}
      {activeSection === "conversion-tracking" && <ConversionTrackingCenter analysis={analysis} />}

      {activeSection === "ai-cmo" && (
        <AiCmoSection analysis={analysis} contractorUrl={contractorUrl} ppcPlan={ppcPlan} />
      )}

      {activeSection === "revenue-engine" && (
        <PpcPlannerPanel
          analysis={analysis}
          isCreatingPpcPlan={isCreatingPpcPlan}
          onCreatePpcPlan={onCreatePpcPlan}
          overrides={ppcOverrides}
          ppcPlan={ppcPlan}
          setOverrides={setPpcOverrides}
        />
      )}

      {activeSection === "marketing-intelligence" && (
        <MarketingIntelligenceSection analysis={analysis} ppcPlan={ppcPlan} />
      )}

      {activeSection === "market-intelligence" && (
        <MarketIntelligenceSection analysis={analysis} contractorUrl={contractorUrl} ppcPlan={ppcPlan} />
      )}

      {activeSection === "deploy-center" && (
        <DeployCenter
          analysis={analysis}
          campaign={campaign}
          contractorUrl={contractorUrl}
          ppcPlan={ppcPlan}
          setActiveSection={setActiveSection}
        />
      )}

      {activeSection === "client-workspace" && (
        <ClientWorkspace
          analysis={analysis}
          clientHealth={clientHealth}
          contractorUrl={contractorUrl}
          ppcOverrides={ppcOverrides}
          ppcPlan={ppcPlan}
          scrapedPages={scrapedPages}
        />
      )}

      {activeSection === "reports" && (
        <ReportsSection
          analysis={analysis}
          campaign={campaign}
          campaignImage={campaignImage}
          error={error}
          goal={goal}
          isCreatingCampaign={isCreatingCampaign}
          offer={offer}
          onCreateCampaign={onCreateCampaign}
          ppcPlan={ppcPlan}
          setGoal={setGoal}
          setOffer={setOffer}
        />
      )}

      {activeSection === "settings" && (
        <SettingsSection
          analysis={analysis}
          onListChange={updateProfileList}
          onUpdate={updateProfileField}
        />
      )}

      <DecisionEngine
        activeSection={activeSection}
        analysis={analysis}
        contractorUrl={contractorUrl}
        ppcPlan={ppcPlan}
      />
    </div>
  );
}

function CampaignForm({
  error,
  goal,
  isCreatingCampaign,
  offer,
  onCreateCampaign,
  setGoal,
  setOffer,
}: {
  error: string;
  goal: string;
  isCreatingCampaign: boolean;
  offer: string;
  onCreateCampaign: (event: FormEvent<HTMLFormElement>) => void;
  setGoal: (value: string) => void;
  setOffer: (value: string) => void;
}) {
  return (
    <Panel className="mt-5">
      <form className="grid gap-4 lg:grid-cols-[0.8fr_1fr_auto]" onSubmit={onCreateCampaign}>
        <div className="space-y-2">
          <FieldLabel>Goal</FieldLabel>
          <select
            className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-flame focus:ring-4 focus:ring-flame/15"
            onChange={(event) => setGoal(event.target.value)}
            value={goal}
          >
            {CAMPAIGN_GOALS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <FieldLabel>Offer</FieldLabel>
          <input
            className="h-12 w-full rounded-md border border-ink/15 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
            onChange={(event) => setOffer(event.target.value)}
            onInput={(event) => setOffer(event.currentTarget.value)}
            placeholder="$79 tune-up, free estimate, 0% financing..."
            value={offer}
          />
        </div>
        <div className="flex items-end">
          <Button disabled={!offer.trim() || isCreatingCampaign} type="submit">
            {isCreatingCampaign ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Megaphone className="size-4" aria-hidden="true" />}
            {isCreatingCampaign ? "Creating..." : "Create Campaign"}
          </Button>
        </div>
      </form>
      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}
    </Panel>
  );
}

function PlatformNav({
  activeSection,
  onChange,
}: {
  activeSection: PlatformSection;
  onChange: (section: PlatformSection) => void;
}) {
  return (
    <nav className="mb-5 overflow-x-auto rounded-[18px] border border-ink/10 bg-white/85 p-2 shadow-soft backdrop-blur-md">
      <div className="flex min-w-max gap-2">
        {PLATFORM_NAV.map((item) => (
          <button
            className={`h-10 rounded-lg px-3 text-sm font-black transition ${
              activeSection === item.id ? "bg-gradient-to-br from-ink to-flame text-white shadow-[0_12px_28px_rgba(25,184,181,0.2)]" : "text-graphite hover:bg-white hover:text-ink"
            }`}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function DecisionEngine({
  activeSection,
  analysis,
  contractorUrl,
  ppcPlan,
}: {
  activeSection: PlatformSection;
  analysis: BusinessProfile;
  contractorUrl: string;
  ppcPlan: PpcPlan | null;
}) {
  const decisions = buildDecisionRecommendations(activeSection, analysis, ppcPlan);
  const storageKey = decisionMemoryKey(analysis, contractorUrl);
  const [statuses, setStatuses] = useState<Record<string, DecisionStatus>>({});
  const [outcomes, setOutcomes] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = loadDecisionMemory(storageKey);
    setStatuses(stored.statuses);
    setOutcomes(stored.outcomes);
  }, [storageKey]);

  function updateDecision(decision: DecisionRecommendation, status: DecisionStatus, outcome?: string) {
    const nextStatuses = { ...statuses, [decision.id]: status };
    const outcomeNote = outcome ?? outcomes[decision.id] ?? "";
    const nextOutcomes = { ...outcomes, [decision.id]: outcomeNote };
    saveDecisionMemory(storageKey, {
      statuses: nextStatuses,
      outcomes: nextOutcomes,
      history: [
        {
          decision: decision.recommendedAction,
          date: new Date().toISOString(),
          status,
          outcome: outcomeNote,
          performance: status === "Completed" ? "Awaiting performance comparison in next memory snapshot." : "Decision state updated.",
        },
        ...loadDecisionMemory(storageKey).history,
      ].slice(0, 80),
    });
    setStatuses(nextStatuses);
    setOutcomes(nextOutcomes);
  }

  const topDecision = decisions[0];

  return (
    <Panel className="mt-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Eyebrow>Decision Engine</Eyebrow>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-ink">
            <Target className="size-6" aria-hidden="true" />
            Recommended Next Action
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
            If you only have one hour and one marketing dollar today, start here: {topDecision.recommendedAction}
          </p>
        </div>
        <ScoreBadge label="Decision" score={topDecision.confidenceScore} />
      </div>

      <div className="mt-5 grid gap-4">
        {decisions.map((decision) => {
          const status = statuses[decision.id] ?? "Pending";
          return (
            <article className="rounded-[18px] border border-ink/10 bg-white/82 p-4 shadow-[0_20px_52px_rgba(6,57,68,0.07)] backdrop-blur-sm" key={decision.id}>
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-black ${priorityClass(decision.priority)}`}>{decision.priority}</span>
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-copper ring-1 ring-ink/10">{decision.category}</span>
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-graphite ring-1 ring-ink/10">{status}</span>
                  </div>
                  <h3 className="mt-3 text-base font-black text-ink">{decision.recommendedAction}</h3>
                  <p className="mt-2 text-sm leading-6 text-graphite/70">{decision.reasoning}</p>
                </div>
                <ConfidenceBadge score={decision.confidenceScore} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <DecisionMeta label="Impact" value={decision.expectedImpact} />
                <DecisionMeta label="Revenue" value={decision.estimatedRevenueOpportunity} />
                <DecisionMeta label="Difficulty" value={decision.difficulty} />
                <DecisionMeta label="Time" value={decision.estimatedTime} />
              </div>

              <div className="mt-4 rounded-lg border border-ink/10 bg-white px-3 py-2">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite/60">Dependencies</p>
                <p className="mt-1 text-sm leading-5 text-graphite">{decision.dependencies.join(", ") || "None"}</p>
              </div>

              <textarea
                className="mt-3 min-h-20 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-flame focus:ring-4 focus:ring-flame/15"
                onChange={(event) => setOutcomes({ ...outcomes, [decision.id]: event.target.value })}
                placeholder="Outcome or performance note, ex: CTR increased 18%, organic traffic increased 24%, no improvement..."
                value={outcomes[decision.id] ?? ""}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <DecisionButton label="Approve" onClick={() => updateDecision(decision, "Approved")} />
                <DecisionButton label="Dismiss" onClick={() => updateDecision(decision, "Ignored")} />
                <DecisionButton label="Remind Later" onClick={() => updateDecision(decision, "Pending", "Remind later")} />
                <DecisionButton label="Already Completed" onClick={() => updateDecision(decision, "Completed")} />
                <DecisionButton label="Convert To Task" onClick={() => updateDecision(decision, "In Progress", "Converted to task")} />
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function DecisionMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite/60">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function DecisionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="h-9 rounded-full border border-ink/15 bg-white/90 px-3 text-xs font-black text-ink transition hover:border-flame/40 hover:bg-white"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function DashboardSection({
  analysis,
  clientHealth,
  contractorUrl,
  ppcPlan,
  setActiveSection,
}: {
  analysis: BusinessProfile;
  clientHealth: ReturnType<typeof buildClientHealth>;
  contractorUrl: string;
  ppcPlan: PpcPlan | null;
  setActiveSection: (section: PlatformSection) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Panel>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <Eyebrow>Client Workspace</Eyebrow>
              <h2 className="text-3xl font-black text-ink">{analysis.companyName || "New HVAC Client"}</h2>
              <p className="mt-2 break-all text-sm font-semibold text-graphite/70">{contractorUrl}</p>
            </div>
            <HealthBadge color={clientHealth.color} score={clientHealth.score} />
          </div>
          <ScoreGrid analysis={analysis} ppcPlan={ppcPlan} />
          <div className="mt-6 rounded-xl border border-ink/10 bg-[#fbfbfa] p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Next Recommended Action</h3>
            <p className="mt-2 text-sm leading-6 text-graphite">{nextRecommendedAction(analysis, ppcPlan)}</p>
          </div>
        </Panel>
        <TaskCenter analysis={analysis} ppcPlan={ppcPlan} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ClientTimeline ppcPlan={ppcPlan} />
        <Panel>
          <h2 className="flex items-center gap-2 text-lg font-black text-ink">
            <Rocket className="size-5" aria-hidden="true" />
            Implementation Path
          </h2>
          <div className="mt-4 grid gap-3">
            <ActionRow label="Review Website Audit" onClick={() => setActiveSection("website-audit")} />
            <ActionRow label="Read AI CMO Daily Brief" onClick={() => setActiveSection("ai-cmo")} />
            <ActionRow label="Build Revenue Engine" onClick={() => setActiveSection("revenue-engine")} />
            <ActionRow label="Check Today's Marketing Signals" onClick={() => setActiveSection("marketing-intelligence")} />
            <ActionRow label="Analyze Local Market" onClick={() => setActiveSection("market-intelligence")} />
            <ActionRow label="Deploy Campaign Assets" onClick={() => setActiveSection("deploy-center")} />
            <ActionRow label="Generate Launch Report" onClick={() => setActiveSection("reports")} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function WebsiteAuditSection({
  analysis,
  readinessItems,
  readinessScore,
  scrapedPages,
  updateBrandColor,
}: {
  analysis: BusinessProfile;
  readinessItems: ReadinessItem[];
  readinessScore: number;
  scrapedPages: AnalyzedPage[];
  updateBrandColor: (field: "primaryColor" | "secondaryColor" | "accentColor", value: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-graphite/70">Growth Score</p>
              <p className="mt-2 text-6xl font-black text-ink">{Math.round(analysis.growthScore)}</p>
              <p className="text-sm font-semibold text-graphite/70">out of 100</p>
            </div>
            {analysis.logoUrl && (
              <div className="flex size-24 items-center justify-center rounded-lg border border-ink/10 bg-white p-3">
                <img className="max-h-full max-w-full object-contain" src={analysis.logoUrl} alt={`${analysis.companyName} logo`} />
              </div>
            )}
          </div>
          <dl className="mt-7 grid gap-4 text-sm">
            <InfoRow label="Phone" value={analysis.phone || "Not found"} />
            <InfoRow label="Email" value={analysis.email || "Not found"} />
            <InfoRow label="Financing Mentioned" value={yesNo(analysis.financingMentioned)} />
            <InfoRow label="Emergency Service Mentioned" value={yesNo(analysis.emergencyServiceMentioned)} />
            <InfoRow label="Maintenance Plan Mentioned" value={yesNo(analysis.maintenancePlanMentioned)} />
            <InfoRow label="Brand Tone" value={analysis.brandTone || "Not found"} />
          </dl>
        </Panel>

        <Panel>
          <div className="grid gap-6 md:grid-cols-2">
            <ChipList icon={<ClipboardList className="size-4" />} label="Services Found" values={analysis.services} />
            <ChipList label="Service Areas Found" values={analysis.serviceAreas} />
          </div>
          <div className="mt-7 border-t border-ink/10 pt-6">
            <h2 className="flex items-center gap-2 text-lg font-black text-ink">
              <Palette className="size-5" aria-hidden="true" />
              Brand Analysis
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ColorPicker label="Primary" onChange={(value) => updateBrandColor("primaryColor", value)} value={analysis.primaryColor} />
              <ColorPicker label="Secondary" onChange={(value) => updateBrandColor("secondaryColor", value)} value={analysis.secondaryColor} />
              <ColorPicker label="Accent" onChange={(value) => updateBrandColor("accentColor", value)} value={analysis.accentColor} />
            </div>
            <p className="mt-4 text-sm leading-6 text-graphite">{analysis.brandStyle || "No brand style found."}</p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-black text-ink">Differentiators</h2>
          <BulletList values={analysis.differentiators} emptyText="No differentiators found." />
        </Panel>
        <Panel>
          <h2 className="text-lg font-black text-ink">Top 5 Growth Opportunities</h2>
          <ol className="mt-4 space-y-3">
            {analysis.topGrowthOpportunities.map((item, index) => (
              <li className="flex gap-3 text-sm leading-6 text-graphite" key={item}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-black text-white">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <AnalysisQualityPanel readinessItems={readinessItems} readinessScore={readinessScore} scrapedPages={scrapedPages} />
    </div>
  );
}

function ClientWorkspace({
  analysis,
  clientHealth,
  contractorUrl,
  ppcOverrides,
  ppcPlan,
  scrapedPages,
}: {
  analysis: BusinessProfile;
  clientHealth: ReturnType<typeof buildClientHealth>;
  contractorUrl: string;
  ppcOverrides: PpcManualOverrides;
  ppcPlan: PpcPlan | null;
  scrapedPages: AnalyzedPage[];
}) {
  const workspaceRows = [
    ["Business Name", analysis.companyName || "Not found"],
    ["Website", contractorUrl],
    ["Overall Growth Score", String(Math.round(analysis.growthScore))],
    ["Revenue Score", String(ppcPlan ? Math.round(avg(ppcPlan.campaignReadiness.map((item) => item.priorityScore))) : 0)],
    ["AI Visibility Score", String(analysis.aiSeoAnalysis.score)],
    ["SEO Score", String(analysis.seoAnalysis.score)],
    ["Google Ads Score", String(ppcPlan ? Math.round(avg(ppcPlan.recommendedLaunchPlan.map((item) => item.priorityScore))) : 0)],
    ["Google Business Profile Score", analysis.aiSeoAnalysis.citationOpportunities.length ? "70" : "45"],
    ["HighLevel Score", "Needs connection"],
    ["Current Monthly Budget", `$${(ppcOverrides.monthlyBudget ?? 0).toLocaleString()}`],
    ["Current Campaign Status", ppcPlan ? "Revenue Engine complete" : "Not generated"],
    ["Last Audit Date", new Date().toLocaleDateString()],
    ["Next Recommended Action", nextRecommendedAction(analysis, ppcPlan)],
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-ink">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
            Client Workspace
          </h2>
          <HealthBadge color={clientHealth.color} score={clientHealth.score} />
        </div>
        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
          {workspaceRows.map(([label, value]) => (
            <InfoRow key={label} label={label} value={value} />
          ))}
        </dl>
      </Panel>
      <div className="grid gap-5">
        <ClientTimeline ppcPlan={ppcPlan} />
        <Panel>
          <h2 className="text-lg font-black text-ink">Workspace Architecture</h2>
          <BulletList
            emptyText=""
            values={[
              "Client workspace object is separated from audit, Revenue Engine, deployment, task, and report data.",
              "Current UI supports one active client; the structure can expand into persisted multi-client workspaces.",
              `${scrapedPages.length} scraped pages are attached to this client session.`,
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

function DeployCenter({
  analysis,
  campaign,
  contractorUrl,
  ppcPlan,
  setActiveSection,
}: {
  analysis: BusinessProfile;
  campaign: CampaignOutput | null;
  contractorUrl: string;
  ppcPlan: PpcPlan | null;
  setActiveSection: (section: PlatformSection) => void;
}) {
  const storageKey = deploymentMemoryKey(analysis, contractorUrl);
  const candidates = buildDeploymentCandidates(analysis, ppcPlan, campaign);
  const [records, setRecords] = useState<Record<string, DeploymentRecord>>({});

  useEffect(() => {
    setRecords(loadDeploymentMemory(storageKey));
  }, [storageKey]);

  function persist(nextRecords: Record<string, DeploymentRecord>) {
    setRecords(nextRecords);
    saveDeploymentMemory(storageKey, nextRecords);
  }

  function updateDeployment(candidate: DeploymentCandidate, approvalStatus: DeploymentApprovalStatus) {
    const nextRecord = updateDeploymentRecord(records[candidate.id], candidate, {
      approvalStatus,
      runtimeStatus: approvalStatus === "Approved" ? "Waiting" : records[candidate.id]?.runtimeStatus ?? "Waiting",
      event:
        approvalStatus === "Approved"
          ? "Approved by user. Waiting for deploy action."
          : `${approvalStatus} by user.`,
      log:
        approvalStatus === "Approved"
          ? "Approval captured. External systems will only receive paused or draft assets."
          : `Recommendation marked ${approvalStatus.toLowerCase()}.`,
    });
    persist({ ...records, [candidate.id]: nextRecord });
  }

  function deployCandidate(candidate: DeploymentCandidate) {
    const validation = validateDeployment(candidate);
    const approved = records[candidate.id]?.approvalStatus === "Approved";
    const success = approved && validation.ready;
    const nextRecord = updateDeploymentRecord(records[candidate.id], candidate, {
      approvalStatus: records[candidate.id]?.approvalStatus ?? "Pending",
      runtimeStatus: success ? "Success" : "Failed",
      event: success
        ? `${candidate.deployMode} generated. No live activation was performed.`
        : approved
          ? "Deployment blocked by missing dependencies."
          : "Deployment blocked because human approval is required.",
      log: success
        ? `${candidate.target} deployment created in a safe paused/draft state and written to Intelligence Memory.`
        : approved
          ? `Validation failed: ${validation.missing.join(", ")}.`
          : "Deploy button was pressed before approval. No asset was created.",
      deployedAt: success ? new Date().toISOString() : records[candidate.id]?.deployedAt,
      deployedBy: success ? currentActor() : records[candidate.id]?.deployedBy,
    });
    persist({ ...records, [candidate.id]: nextRecord });
  }

  function previewCandidate(candidate: DeploymentCandidate) {
    const nextRecord = updateDeploymentRecord(records[candidate.id], candidate, {
      approvalStatus: records[candidate.id]?.approvalStatus ?? "Pending",
      runtimeStatus: records[candidate.id]?.runtimeStatus ?? "Waiting",
      event: "Preview reviewed by user.",
      log: "Preview opened. Exact draft output is ready for approval review.",
    });
    persist({ ...records, [candidate.id]: nextRecord });
  }

  function exportChannel(channel: ImplementationChannel) {
    if (!channel.candidate) return;
    const record = records[channel.candidate.id];
    const payload = {
      channel: channel.target,
      status: channel.status,
      pendingDeployments: channel.pendingDeployments,
      topRecommendedDeployment: channel.topRecommendedDeployment,
      requiredIntegrations: channel.requiredIntegrations,
      blockingIssues: channel.blockingIssues,
      lastDeployedItem: channel.lastDeployedItem,
      preview: channel.candidate.preview,
      deploymentRecord: record ?? null,
    };
    downloadJson(`${slugify(channel.target)}-deployment-packet.json`, payload);
    const nextRecord = updateDeploymentRecord(record, channel.candidate, {
      approvalStatus: record?.approvalStatus ?? "Pending",
      runtimeStatus: record?.runtimeStatus ?? "Waiting",
      event: "Deployment packet exported.",
      log: "Export created for client review or implementation handoff.",
    });
    persist({ ...records, [channel.candidate.id]: nextRecord });
  }

  const deploymentHistory = Object.values(records)
    .flatMap((record) => record.history.map((item) => ({ ...item, title: record.title, status: record.runtimeStatus })))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 8);
  const implementationChannels = buildImplementationChannels(candidates, records);

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-ink">
              <Rocket className="size-5" aria-hidden="true" />
              Deploy Center
            </h2>
            <p className="mt-2 text-sm leading-6 text-graphite/70">
              Deploy Center now works as a human-approved deployment pipeline. Every recommendation is previewed, validated, approved, then created as a paused or draft asset before anything can go live.
            </p>
          </div>
          <Button onClick={() => setActiveSection("revenue-engine")} variant="secondary">Open Revenue Engine</Button>
        </div>
      </Panel>
      <Panel className="bg-ink text-white">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Waiting" value={String(Object.values(records).filter((record) => record.runtimeStatus === "Waiting").length || candidates.length)} />
          <MetricCard label="Approved" value={String(Object.values(records).filter((record) => record.approvalStatus === "Approved").length)} />
          <MetricCard label="Successful Drafts" value={String(Object.values(records).filter((record) => record.runtimeStatus === "Success").length)} />
          <MetricCard label="History Events" value={String(deploymentHistory.length)} />
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        {implementationChannels.map((channel) => (
          <ImplementationChannelCard
            channel={channel}
            key={channel.target}
            onApprove={() => channel.candidate && updateDeployment(channel.candidate, "Approved")}
            onDeploy={() => channel.candidate && deployCandidate(channel.candidate)}
            onExport={() => exportChannel(channel)}
            onPreview={() => channel.candidate && previewCandidate(channel.candidate)}
          />
        ))}
      </div>
      <div className="grid gap-5">
        {candidates.map((candidate) => (
          <DeploymentWorkflowCard
            candidate={candidate}
            key={candidate.id}
            onDeploy={deployCandidate}
            onUpdate={updateDeployment}
            record={records[candidate.id]}
          />
        ))}
      </div>
      <Panel>
        <h3 className="text-lg font-black text-ink">Deployment History</h3>
        <p className="mt-2 text-sm leading-6 text-graphite/70">
          Every approval and deployment event is stored in client memory with who acted, when it happened, and what happened afterward.
        </p>
        <div className="mt-4 grid gap-3">
          {deploymentHistory.length ? deploymentHistory.map((item) => (
            <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-3" key={`${item.title}-${item.date}-${item.event}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-ink">{item.title}</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-graphite/70">{item.status}</span>
              </div>
              <p className="mt-1 text-sm text-graphite/70">{item.event}</p>
              <p className="mt-1 text-xs font-bold text-graphite/50">{new Date(item.date).toLocaleString()} by {item.actor}</p>
            </div>
          )) : (
            <p className="rounded-xl border border-dashed border-ink/15 bg-[#fbfbfa] p-4 text-sm text-graphite/70">
              No deployments yet. Approve a recommendation, then create a paused or draft deployment.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}

function ConnectedAppsSection() {
  const [status, setStatus] = useState<ConnectedAppStatus | null>(null);
  const [googleAdsData, setGoogleAdsData] = useState<GoogleAdsDataPayload | null>(null);
  const [highLevelData, setHighLevelData] = useState<HighLevelDataPayload | null>(null);
  const [highLevelEndDate, setHighLevelEndDate] = useState(todayInputValue());
  const [highLevelStartDate, setHighLevelStartDate] = useState(daysAgoInputValue(30));
  const [activeTable, setActiveTable] = useState<keyof Pick<GoogleAdsDataPayload, "campaigns" | "adGroups" | "keywords" | "searchTerms" | "ads" | "assets" | "conversions">>("campaigns");
  const [activeHighLevelTable, setActiveHighLevelTable] = useState<keyof Pick<HighLevelDataPayload, "contacts" | "opportunities" | "opportunityStages" | "pipelines" | "conversations" | "calls" | "calendars" | "forms" | "formSubmissions" | "tags" | "workflows" | "customFields">>("contacts");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingHighLevel, setIsSyncingHighLevel] = useState(false);
  const [message, setMessage] = useState("");

  const loadGoogleAdsData = useCallback(async () => {
    const response = await fetch("/api/google-ads/data", { cache: "no-store" });
    const payload = (await response.json()) as { data?: GoogleAdsDataPayload } & ApiError;
    if (!response.ok) throw new Error(payload.error || "Unable to load Google Ads data.");
    setGoogleAdsData(payload.data ?? null);
  }, []);

  const loadHighLevelData = useCallback(async () => {
    const response = await fetch("/api/highlevel/data", { cache: "no-store" });
    const payload = (await response.json()) as { data?: HighLevelDataPayload } & ApiError;
    if (!response.ok) throw new Error(payload.error || "Unable to load HighLevel data.");
    if (payload.data?.syncRange) {
      setHighLevelEndDate(payload.data.syncRange.endDate);
      setHighLevelStartDate(payload.data.syncRange.startDate);
    }
    setHighLevelData(payload.data ?? null);
  }, []);

  const refreshConnectedApps = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const [googleResponse, highLevelResponse] = await Promise.all([
        fetch("/api/google-ads/status", { cache: "no-store" }),
        fetch("/api/highlevel/status", { cache: "no-store" }),
      ]);
      const googlePayload = (await googleResponse.json()) as Pick<ConnectedAppStatus, "googleAds"> & ApiError;
      const highLevelPayload = (await highLevelResponse.json()) as Pick<ConnectedAppStatus, "highLevel"> & ApiError;
      if (!googleResponse.ok || !highLevelResponse.ok) throw new Error("Connected Apps setup could not be loaded. Please refresh the page.");
      setStatus({ googleAds: googlePayload.googleAds, highLevel: highLevelPayload.highLevel });
      await Promise.all([
        googlePayload.googleAds.connected ? loadGoogleAdsData().catch(() => setGoogleAdsData(null)) : Promise.resolve(),
        highLevelPayload.highLevel.connected ? loadHighLevelData().catch(() => setHighLevelData(null)) : Promise.resolve(),
      ]);
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "Connected Apps setup could not be loaded. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, [loadGoogleAdsData, loadHighLevelData]);

  useEffect(() => {
    void refreshConnectedApps();
  }, [refreshConnectedApps]);

  async function syncGoogleAds() {
    setIsSyncing(true);
    setMessage("");
    try {
      const response = await fetch("/api/google-ads/sync", { method: "POST" });
      const payload = (await response.json()) as { data?: GoogleAdsDataPayload } & ApiError;
      if (!response.ok) throw new Error("Google Ads is not ready to sync yet. Review the setup checklist below, then try again.");
      setGoogleAdsData(payload.data ?? null);
      await refreshConnectedApps();
      setMessage("Google Ads data refreshed in read-only mode.");
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "Google Ads is not ready to sync yet. Review the setup checklist below, then try again.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function syncHighLevel() {
    setIsSyncingHighLevel(true);
    setMessage("");
    try {
      const response = await fetch("/api/highlevel/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate: highLevelEndDate, startDate: highLevelStartDate }),
      });
      const payload = (await response.json()) as { data?: HighLevelDataPayload } & ApiError;
      if (!response.ok) throw new Error(payload.error || "HighLevel is not ready to sync yet. Review the setup checklist below, then try again.");
      setHighLevelData(payload.data ?? null);
      await refreshConnectedApps();
      setMessage("HighLevel data refreshed in read-only mode.");
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "HighLevel is not ready to sync yet. Review the setup checklist below, then try again.");
    } finally {
      setIsSyncingHighLevel(false);
    }
  }

  async function selectCustomer(customerId: string) {
    setMessage("");
    try {
      const response = await fetch("/api/google-ads/active-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const payload = (await response.json()) as ApiError;
      if (!response.ok) throw new Error("That Google Ads account could not be selected. Refresh the account list and try again.");
      await refreshConnectedApps();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "That Google Ads account could not be selected. Refresh the account list and try again.");
    }
  }

  const googleAds = status?.googleAds;
  const highLevel = status?.highLevel;
  const tableRows = googleAdsData?.[activeTable] ?? [];
  const highLevelRows = highLevelData?.[activeHighLevelTable] ?? [];
  const syncedGoogleAdsClicks = googleAdsData ? sumMetricRows(googleAdsData.campaigns, "clicks") : 0;

  function setHighLevelPreset(days: number) {
    setHighLevelEndDate(todayInputValue());
    setHighLevelStartDate(daysAgoInputValue(days));
  }

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Eyebrow>Connected Apps</Eyebrow>
            <h2 className="flex items-center gap-2 text-xl font-black text-ink">
              <Settings className="size-5" aria-hidden="true" />
              External marketing data connections
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
              Connect read-only data sources now so HVAC Growth OS can learn from real performance. Write actions remain disabled until a future approval-based deployment mode is enabled.
            </p>
          </div>
          <Button onClick={refreshConnectedApps} variant="secondary">{isLoading ? "Refreshing..." : "Refresh Status"}</Button>
        </div>
      </Panel>

      {message && (
        <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-graphite/75 shadow-soft">
          {message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <ConnectedAppCard
          configured={Boolean(googleAds?.configured)}
          connected={Boolean(googleAds?.connected)}
          description="Read campaigns, ad groups, keywords, search terms, ads, assets, budgets, and conversions."
          mode={googleAds?.permissionMode ?? "Read Only"}
          primaryAction={googleAds?.configured ? (
            <a className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-sm font-black text-white" href="/api/google-ads/connect" rel="noreferrer" target="_blank">Connect Google Ads</a>
          ) : (
            <a className="inline-flex h-10 items-center justify-center rounded-full bg-ink/10 px-4 text-sm font-black text-ink" href="#google-ads-setup">Open Setup</a>
          )}
          secondaryAction={<Button disabled={!googleAds?.connected || isSyncing} onClick={syncGoogleAds} variant="secondary">{isSyncing ? "Syncing..." : "Refresh Data"}</Button>}
          title="Google Ads"
        />
        <ConnectedAppCard
          configured={Boolean(highLevel?.configured)}
          connected={Boolean(highLevel?.connected)}
          description="Read locations, contacts, opportunities, pipelines, conversations, calendars, forms, tags, workflows, custom fields, and revenue funnel metrics."
          mode={highLevel?.permissionMode ?? "Read Only"}
          primaryAction={highLevel?.connectionSource === "API Key" ? (
            <Button disabled variant="secondary">API Key Active</Button>
          ) : highLevel?.configured ? (
            <a className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-sm font-black text-white" href="/api/highlevel/connect" rel="noreferrer" target="_blank">Connect HighLevel</a>
          ) : (
            <a className="inline-flex h-10 items-center justify-center rounded-full bg-ink/10 px-4 text-sm font-black text-ink" href="#highlevel-setup">Open Setup</a>
          )}
          secondaryAction={<Button disabled={!highLevel?.connected || isSyncingHighLevel} onClick={syncHighLevel} variant="secondary">{isSyncingHighLevel ? "Syncing..." : "Refresh Data"}</Button>}
          title="HighLevel"
        />
        {[
          ["Google Analytics", "Website traffic, events, source quality, and conversion paths."],
          ["Google Search Console", "Queries, pages, clicks, impressions, indexing, and search visibility."],
          ["Google Business Profile", "Calls, views, posts, reviews, services, and local profile activity."],
          ["Meta / Facebook / Instagram", "Social content, engagement, ads, audiences, and lead forms."],
          ["LinkedIn", "Professional visibility, posts, page engagement, and B2B referral signals."],
          ["Weather Data", "Forecast, temperature swings, heat waves, cold snaps, and demand triggers."],
        ].map(([title, description]) => (
          <ConnectedAppCard
            configured={false}
            connected={false}
            description={description}
            key={title}
            mode="Read Only"
            primaryAction={<Button disabled variant="secondary">Coming Soon</Button>}
            title={title}
          />
        ))}
      </div>

      <GoogleAdsSetupWizard googleAds={googleAds} />
      <HighLevelSetupWizard highLevel={highLevel} onConfigured={refreshConnectedApps} />

      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h3 className="text-lg font-black text-ink">Google Ads Connection</h3>
            <p className="mt-2 text-sm leading-6 text-graphite/70">
              Current permission mode is read-only. HVAC Growth OS can read data, but cannot create, edit, pause, delete, or publish anything.
            </p>
          </div>
          <PermissionModePills activeMode={googleAds?.permissionMode ?? "Read Only"} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <InfoTile label="Connection" value={googleAds?.connected ? "Connected" : googleAds?.configured ? "Not connected" : "Needs setup"} />
          <InfoTile label="Credential storage" value={googleAds?.credentialStorage || "Not connected"} />
          <InfoTile label="Last sync" value={googleAds?.lastSyncAt ? new Date(googleAds.lastSyncAt).toLocaleString() : "Never synced"} />
          <InfoTile label="Active customer" value={googleAds?.activeCustomerId || "None selected"} />
        </div>
        <div className="mt-5 grid gap-3">
          <FieldLabel>Connected Google Ads customer IDs</FieldLabel>
          {googleAds?.customerIds.length ? (
            <select
              className="h-11 rounded-md border border-ink/15 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/15"
              onChange={(event) => selectCustomer(event.target.value)}
              value={googleAds.activeCustomerId || googleAds.customerIds[0]}
            >
              {googleAds.customerIds.map((customerId) => (
                <option key={customerId} value={customerId}>{customerId}</option>
              ))}
            </select>
          ) : (
            <p className="rounded-xl border border-dashed border-ink/15 bg-[#fbfbfa] p-4 text-sm text-graphite/70">
              No customer IDs loaded yet. Connect Google Ads, then refresh data.
            </p>
          )}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-black text-ink">Google Ads Data</h3>
            <p className="mt-2 text-sm leading-6 text-graphite/70">
              Read-only performance data synced from the selected Google Ads customer account.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["campaigns", "adGroups", "keywords", "searchTerms", "ads", "assets", "conversions"] as const).map((table) => (
              <button
                className={`rounded-full px-3 py-2 text-xs font-black transition ${activeTable === table ? "bg-ink text-white" : "border border-ink/10 bg-white text-ink hover:border-flame/40"}`}
                key={table}
                onClick={() => setActiveTable(table)}
                type="button"
              >
                {tableLabel(table)}
              </button>
            ))}
          </div>
        </div>
        <GoogleAdsDataTable rows={tableRows} />
        {googleAdsData?.budgets.length ? (
          <div className="mt-6">
            <h4 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Budgets</h4>
            <div className="mt-3 grid gap-2">
              {googleAdsData.budgets.map((budget) => (
                <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-ink/10 bg-[#fbfbfa] p-3 text-sm" key={budget.id}>
                  <strong className="text-ink">{budget.name}</strong>
                  <span className="font-bold text-graphite/70">${budget.amount.toFixed(2)} per day</span>
                  <span className="font-bold text-graphite/55">{budget.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h3 className="text-lg font-black text-ink">HighLevel Connection</h3>
            <p className="mt-2 text-sm leading-6 text-graphite/70">
              Current permission mode is read-only. HVAC Growth OS can read CRM performance data, but cannot create workflows, pipelines, automations, forms, or contacts.
            </p>
          </div>
          <PermissionModePills activeMode={highLevel?.permissionMode ?? "Read Only"} />
        </div>
        <div className="mt-5 rounded-2xl border border-ink/10 bg-[#fbfbfa] p-4">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">HighLevel Sync Range</h4>
              <p className="mt-2 text-sm leading-6 text-graphite/70">
                Metrics and CRM rows below use this selected date range. Default is the last 30 days.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["Today", 0],
                ["7 days", 7],
                ["30 days", 30],
                ["90 days", 90],
              ].map(([label, days]) => (
                <button
                  className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-black text-ink transition hover:border-flame/40"
                  key={label}
                  onClick={() => setHighLevelPreset(Number(days))}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2">
              <FieldLabel>Start Date</FieldLabel>
              <input
                className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/15"
                onChange={(event) => setHighLevelStartDate(event.target.value)}
                type="date"
                value={highLevelStartDate}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>End Date</FieldLabel>
              <input
                className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/15"
                onChange={(event) => setHighLevelEndDate(event.target.value)}
                type="date"
                value={highLevelEndDate}
              />
            </label>
            <div className="flex items-end">
              <Button disabled={!highLevel?.connected || isSyncingHighLevel} onClick={syncHighLevel} variant="secondary">
                {isSyncingHighLevel ? "Syncing..." : "Refresh Range"}
              </Button>
            </div>
          </div>
          {highLevelData?.syncRange ? (
            <p className="mt-3 text-xs font-bold text-graphite/55">
              Current synced range: {highLevelData.syncRange.startDate} to {highLevelData.syncRange.endDate}
            </p>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-6">
          <InfoTile label="Connection" value={highLevel?.connected ? "Connected" : highLevel?.configured ? "Not connected" : "Needs setup"} />
          <InfoTile label="Connection type" value={highLevel?.connectionSource || "Not selected"} />
          <InfoTile label="Credential storage" value={highLevel?.credentialStorage || "Not connected"} />
          <InfoTile label="Last sync" value={highLevel?.lastSyncAt ? new Date(highLevel.lastSyncAt).toLocaleString() : "Never synced"} />
          <InfoTile label="Connected location" value={highLevel?.connectedLocation || highLevel?.activeLocationId || "None selected"} />
          <InfoTile label="Location ID" value={highLevel?.activeLocationId || highLevelData?.activeLocationId || "Not synced"} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Total contacts" value={String(highLevel?.totalContacts ?? highLevelData?.contacts.length ?? 0)} />
          <InfoTile label="Total conversations" value={String(highLevel?.totalConversations ?? highLevelData?.conversations.length ?? 0)} />
          <InfoTile label="Total opportunities" value={String(highLevel?.totalOpportunities ?? highLevelData?.opportunities.length ?? 0)} />
          <InfoTile label="Open opportunities" value={String(highLevel?.openOpportunities ?? 0)} />
          <InfoTile label="Open pipeline value" value={`$${Math.round(highLevel?.openPipelineValue ?? highLevelData?.revenueFunnel.openPipelineValue ?? 0).toLocaleString()}`} />
          <InfoTile label="Closed won" value={String(highLevel?.closedWon ?? 0)} />
          <InfoTile label="Closed won value" value={`$${Math.round(highLevel?.closedWonValue ?? highLevelData?.revenueFunnel.closedWonValue ?? 0).toLocaleString()}`} />
          <InfoTile label="Calls tracked" value={String(highLevel?.callsTracked ?? highLevelData?.calls.length ?? 0)} />
          <InfoTile label="Missed calls" value={String(highLevel?.missedCalls ?? highLevelData?.revenueFunnel.missedCalls ?? 0)} />
          <InfoTile label="Forms submitted" value={String(highLevel?.formsSubmitted ?? highLevelData?.formSubmissions.length ?? 0)} />
          <InfoTile label="Pipeline value" value={`$${Math.round(highLevel?.pipelineValue ?? highLevelData?.revenueFunnel.pipelineValue ?? 0).toLocaleString()}`} />
        </div>
        {highLevelData?.syncAlerts.length ? (
          <div className="mt-5 grid gap-2">
            {highLevelData.syncAlerts.map((alert) => (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800" key={alert}>{alert}</p>
            ))}
          </div>
        ) : null}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <MiniAttributionTable rows={(highLevel?.leadSources ?? highLevelData?.revenueFunnel.leadSources ?? []).map((row) => [row.source, String(row.count), `$${Math.round(row.value).toLocaleString()}`])} title="Lead Sources" />
          <MiniSnapshotTable snapshots={highLevelData?.snapshots ?? []} />
        </div>
      </Panel>

      <RevenueFunnelPanel funnel={highLevelData?.revenueFunnel} googleAdsClicks={syncedGoogleAdsClicks} highLevelConnected={Boolean(highLevel?.connected)} />

      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-black text-ink">HighLevel CRM Data</h3>
            <p className="mt-2 text-sm leading-6 text-graphite/70">
              Read-only CRM records synced from the connected HighLevel location. This data powers Revenue Engine funnel metrics and AI CMO recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["contacts", "opportunities", "opportunityStages", "pipelines", "conversations", "calls", "calendars", "forms", "formSubmissions", "tags", "workflows", "customFields"] as const).map((table) => (
              <button
                className={`rounded-full px-3 py-2 text-xs font-black transition ${activeHighLevelTable === table ? "bg-ink text-white" : "border border-ink/10 bg-white text-ink hover:border-flame/40"}`}
                key={table}
                onClick={() => setActiveHighLevelTable(table)}
                type="button"
              >
                {highLevelTableLabel(table)}
              </button>
            ))}
          </div>
        </div>
        <HighLevelDataTable rows={highLevelRows} />
      </Panel>
    </div>
  );
}

function ConnectedAppCard({
  configured,
  connected,
  description,
  mode,
  primaryAction,
  secondaryAction,
  title,
}: {
  configured: boolean;
  connected: boolean;
  description: string;
  mode: PermissionMode;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  title: string;
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-graphite/70">{description}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${connected ? "border-teal-200 bg-teal-50 text-teal-700" : configured ? "border-amber-200 bg-amber-50 text-amber-700" : "border-ink/10 bg-slate-100 text-graphite"}`}>
          {connected ? "Connected" : configured ? "Ready to Connect" : "Needs Setup"}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[#fbfbfa] px-3 py-2 text-xs font-black text-graphite/70">Mode: {mode}</span>
        <div className="flex flex-wrap gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      </div>
    </Panel>
  );
}

function GoogleAdsSetupWizard({ googleAds }: { googleAds?: ConnectedAppStatus["googleAds"] }) {
  const setupItems = googleAds?.setup.items ?? [];
  const missingItems = googleAds?.setup.missingItems ?? [];
  const ready = Boolean(googleAds?.setup.ready);
  const connected = Boolean(googleAds?.connected);
  const temporaryCredentialStore = googleAds?.credentialStorage === "In-app temporary token store";

  return (
    <Panel className="scroll-mt-28" id="google-ads-setup">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Eyebrow>Google Ads Setup</Eyebrow>
          <h3 className="text-xl font-black text-ink">Connect Google Ads safely in read-only mode.</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
            Complete these setup steps before OAuth is enabled. Google Ads uses OAuth refresh tokens, so production needs a durable token store path or database-backed token storage.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-2 text-xs font-black ${connected ? "border-green-200 bg-green-50 text-green-700" : ready ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {connected ? "Connected" : ready ? "Ready to connect" : `${missingItems.length || 6} setup item${(missingItems.length || 6) === 1 ? "" : "s"} missing`}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="grid gap-3">
          {temporaryCredentialStore && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
              Google Ads is connected through a temporary file-backed token store. On Render, add <span className="font-mono">DATABASE_URL</span> so OAuth tokens are saved in the encrypted database credential store before relying on it long term.
            </p>
          )}
          {(setupItems.length ? setupItems : defaultGoogleAdsSetupItems()).map((item) => (
            <div className="flex gap-3 rounded-xl border border-ink/10 bg-[#fbfbfa] p-4" key={item.envVar}>
              <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${item.configured ? "text-green-600" : "text-copper"}`} aria-hidden="true" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-ink">{item.label}</p>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-black ${item.configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {item.configured ? "Configured" : "Missing"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-graphite/60">{item.envVar}</p>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-ink p-5 text-white">
          <h4 className="text-lg font-black">Connection checklist</h4>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-white/75">
            <p>1. Add the required values in Render environment settings.</p>
            <p>2. Make sure the redirect URI matches Google Cloud exactly.</p>
            <p>3. For durable OAuth, add DATABASE_URL for encrypted database token storage.</p>
            <p>4. Redeploy the service after changing environment variables.</p>
            <p>5. Return here, connect Google Ads, and select the active customer ID.</p>
          </div>
          <div className="mt-5 rounded-xl bg-white/8 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/55">Current mode</p>
            <p className="mt-1 text-sm font-black">Read Only</p>
            <p className="mt-2 text-sm leading-5 text-white/65">No campaigns, budgets, keywords, ads, or assets can be changed from this connector.</p>
          </div>
          <div className="mt-5">
            {ready ? (
              <a className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-black text-ink" href="/api/google-ads/connect" rel="noreferrer" target="_blank">Connect Google Ads</a>
            ) : (
              <button className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-white/15 px-4 text-sm font-black text-white/65" disabled type="button">
                Complete setup to connect
              </button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function HighLevelSetupWizard({ highLevel, onConfigured }: { highLevel?: ConnectedAppStatus["highLevel"]; onConfigured: () => Promise<void> }) {
  const setupItems = highLevel?.setup.items ?? [];
  const missingItems = highLevel?.setup.missingItems ?? [];
  const ready = Boolean(highLevel?.setup.ready);
  const connected = Boolean(highLevel?.connected);
  const temporaryCredentialStore = highLevel?.credentialStorage === "In-app temporary token store";
  const [locationId, setLocationId] = useState(highLevel?.activeLocationId ?? "");
  const [privateIntegrationToken, setPrivateIntegrationToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");

  useEffect(() => {
    if (highLevel?.activeLocationId) setLocationId(highLevel.activeLocationId);
  }, [highLevel?.activeLocationId]);

  async function savePrivateToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSetupMessage("");
    try {
      const response = await fetch("/api/highlevel/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, privateIntegrationToken }),
      });
      const payload = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(payload.error || "HighLevel setup could not be saved.");

      const syncResponse = await fetch("/api/highlevel/sync", { method: "POST" });
      const syncPayload = (await syncResponse.json()) as ApiError;
      if (!syncResponse.ok) {
        setSetupMessage(syncPayload.error || "Saved the HighLevel token, but the first sync needs review.");
      } else {
        setSetupMessage("HighLevel private token saved and read-only data synced.");
        setPrivateIntegrationToken("");
      }
      await onConfigured();
    } catch (caughtError) {
      setSetupMessage(caughtError instanceof Error ? caughtError.message : "HighLevel setup could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Panel className="scroll-mt-28" id="highlevel-setup">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Eyebrow>HighLevel Setup</Eyebrow>
          <h3 className="text-xl font-black text-ink">Connect the Comfort Guardians HighLevel location safely in read-only mode.</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
            For production on Render, store the location-level private integration token in Render environment variables. The in-app form is useful for testing, but file-backed credentials may be lost on redeploy.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-2 text-xs font-black ${connected ? "border-green-200 bg-green-50 text-green-700" : ready ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {connected ? "Connected" : ready ? "Ready to connect" : `${missingItems.length || 4} setup item${(missingItems.length || 4) === 1 ? "" : "s"} missing`}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="grid gap-4">
          <form className="rounded-2xl border border-ink/10 bg-[#fbfbfa] p-5" onSubmit={savePrivateToken}>
            <div>
              <h4 className="text-lg font-black text-ink">Private token setup</h4>
              <p className="mt-2 text-sm leading-6 text-graphite/70">
                Best for Render: add <span className="font-mono font-bold">HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN</span> and <span className="font-mono font-bold">HIGHLEVEL_LOCATION_ID</span> in Render, then redeploy. Use this form only for a temporary test connection.
              </p>
            </div>
            {temporaryCredentialStore && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
                This HighLevel credential was saved through the app. On Render, move it into environment variables so it survives deploys and service restarts.
              </p>
            )}
            <div className="mt-5 grid gap-4">
              <label className="space-y-2">
                <FieldLabel>HighLevel Location ID</FieldLabel>
                <input
                  className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
                  onChange={(event) => setLocationId(event.target.value)}
                  placeholder="Comfort Guardians location ID"
                  value={locationId}
                />
              </label>
              <label className="space-y-2">
                <FieldLabel>Private Integration Token</FieldLabel>
                <input
                  className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
                  onChange={(event) => setPrivateIntegrationToken(event.target.value)}
                  placeholder="Paste token once, then save"
                  type="password"
                  value={privateIntegrationToken}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled={isSaving || !locationId.trim() || !privateIntegrationToken.trim()} type="submit">
                  {isSaving ? "Saving..." : "Save & Connect HighLevel"}
                </Button>
                <span className="text-xs font-bold text-graphite/55">Read only. No contacts, workflows, or automations are created.</span>
              </div>
              {setupMessage && (
                <p className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-graphite/75">{setupMessage}</p>
              )}
            </div>
          </form>

          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
            <h4 className="text-sm font-black uppercase tracking-[0.12em] text-teal-800">Render durable setup</h4>
            <div className="mt-3 grid gap-2 text-sm font-bold leading-6 text-teal-900">
              <p>1. Open the HVAC Growth OS service in Render.</p>
              <p>2. Add or update <span className="font-mono">HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN</span>.</p>
              <p>3. Add or update <span className="font-mono">HIGHLEVEL_LOCATION_ID</span>.</p>
              <p>4. Add <span className="font-mono">DATABASE_URL</span> if you want in-app OAuth/private-token setup saved durably.</p>
              <p>5. Confirm <span className="font-mono">HIGHLEVEL_TOKEN_ENCRYPTION_KEY</span> or <span className="font-mono">HVAC_GROWTH_OS_AUTH_SECRET</span> exists.</p>
              <p>6. Redeploy, then refresh HighLevel data here.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {(setupItems.length ? setupItems : defaultHighLevelSetupItems()).map((item) => (
              <div className="flex gap-3 rounded-xl border border-ink/10 bg-[#fbfbfa] p-4" key={item.envVar}>
                <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${item.configured ? "text-green-600" : "text-copper"}`} aria-hidden="true" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-ink">{item.label}</p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-black ${item.configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {item.configured ? "Configured" : "Missing"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs font-bold text-graphite/60">{item.envVar}</p>
                  <p className="mt-2 text-sm leading-5 text-graphite/70">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-ink p-5 text-white">
          <h4 className="text-lg font-black">Read-only CRM checklist</h4>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-white/75">
            <p>1. Use OAuth for the Comfort Guardians location when available.</p>
            <p>2. If OAuth is not available, add a location-level private integration token and location ID in Render.</p>
            <p>3. Include read-only access for contacts, opportunities, conversations, calls, calendars, forms, tags, and custom fields.</p>
            <p>4. Redeploy the service after changing environment variables.</p>
            <p>5. Refresh HighLevel Data and confirm the connected location name and location ID.</p>
          </div>
          <div className="mt-5 rounded-xl bg-white/8 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/55">Current mode</p>
            <p className="mt-1 text-sm font-black">Read Only</p>
            <p className="mt-2 text-sm leading-5 text-white/65">No workflows, pipelines, automations, forms, contacts, or opportunities can be modified from this connector.</p>
          </div>
          <div className="mt-5">
            {highLevel?.connectionSource === "API Key" ? (
              <button className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-white/15 px-4 text-sm font-black text-white/65" disabled type="button">
                API key fallback active
              </button>
            ) : ready ? (
              <a className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-black text-ink" href="/api/highlevel/connect" rel="noreferrer" target="_blank">Connect HighLevel</a>
            ) : (
              <button className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-white/15 px-4 text-sm font-black text-white/65" disabled type="button">
                Complete setup to connect
              </button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PermissionModePills({ activeMode }: { activeMode: PermissionMode }) {
  const modes: PermissionMode[] = ["Read Only", "Draft Mode", "Agency Mode", "Owner Mode"];
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => (
        <span
          className={`rounded-full border px-3 py-2 text-xs font-black ${mode === activeMode ? "border-teal-200 bg-teal-50 text-teal-700" : "border-ink/10 bg-white text-graphite/55"}`}
          key={mode}
        >
          {mode}
        </span>
      ))}
    </div>
  );
}

function RevenueFunnelPanel({ funnel, googleAdsClicks = 0, highLevelConnected }: { funnel?: RevenueFunnelPayload; googleAdsClicks?: number; highLevelConnected: boolean }) {
  const fallback: RevenueFunnelPayload = {
    campaignAttribution: [],
    closedWonValue: 0,
    crmLeads: 0,
    estimates: 0,
    estimatedRevenue: 0,
    formsSubmitted: 0,
    googleAdsClicks: 0,
    googleAdsSpend: 0,
    leadSources: [],
    leads: 0,
    missedCalls: 0,
    openPipelineValue: 0,
    opportunityStages: [],
    phoneCalls: 0,
    pipelineValue: 0,
    revenue: 0,
    roi: 0,
    totalConversations: 0,
    totalOpportunities: 0,
    wonJobs: 0,
    wonOpportunities: 0,
  };
  const data = { ...(funnel ?? fallback), googleAdsClicks: googleAdsClicks || funnel?.googleAdsClicks || 0 };

  return (
    <Panel>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Eyebrow>Revenue Funnel</Eyebrow>
          <h3 className="text-xl font-black text-ink">Google Ads clicks → HighLevel calls → CRM leads → Estimates → Won jobs → Estimated revenue</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
            HighLevel data gives Revenue Engine a real CRM funnel. These are planning metrics from synced CRM records, not financial guarantees.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-2 text-xs font-black ${highLevelConnected ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {highLevelConnected ? "CRM data available" : "Connect HighLevel"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <FunnelMetric label="Google Ads Clicks" value={data.googleAdsClicks ? String(data.googleAdsClicks) : "Pending"} />
        <FunnelMetric label="HighLevel Calls" value={String(data.phoneCalls)} />
        <FunnelMetric label="CRM Leads" value={String(data.crmLeads || data.leads)} />
        <FunnelMetric label="Estimates" value={String(data.estimates)} />
        <FunnelMetric label="Won Jobs" value={String(data.wonJobs || data.wonOpportunities)} />
        <FunnelMetric label="Estimated Revenue" value={`$${Math.round(data.estimatedRevenue || data.revenue).toLocaleString()}`} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <MiniAttributionTable rows={data.leadSources.map((row) => [row.source, String(row.count), `$${Math.round(row.value).toLocaleString()}`])} title="Lead Sources" />
        <MiniAttributionTable rows={data.opportunityStages.map((row) => [row.stage, String(row.count), `$${Math.round(row.value).toLocaleString()}`])} title="Opportunity Stages" />
        <MiniAttributionTable rows={data.campaignAttribution.map((row) => [row.campaign, String(row.leads), `$${Math.round(row.value).toLocaleString()}`])} title="Campaign Attribution" />
      </div>
    </Panel>
  );
}

function FunnelMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4">
      <p className="text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-graphite/55">{label}</p>
    </div>
  );
}

function MiniAttributionTable({ rows, title }: { rows: string[][]; title: string }) {
  return (
    <div>
      <h4 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">{title}</h4>
      <div className="mt-3 grid gap-2">
        {rows.length ? rows.slice(0, 5).map((row) => (
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-xl border border-ink/10 bg-white p-3 text-xs" key={row.join("-")}>
            <strong className="truncate text-ink">{row[0] || "Unattributed"}</strong>
            <span className="font-bold text-graphite/70">{row[1]}</span>
            <span className="font-bold text-graphite/70">{row[2]}</span>
          </div>
        )) : (
          <p className="rounded-xl border border-dashed border-ink/15 bg-[#fbfbfa] p-4 text-sm text-graphite/70">No synced CRM attribution yet.</p>
        )}
      </div>
    </div>
  );
}

function MiniSnapshotTable({ snapshots }: { snapshots: HighLevelSnapshot[] }) {
  return (
    <div>
      <h4 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Historical Snapshots</h4>
      <div className="mt-3 grid gap-2">
        {snapshots.length ? snapshots.slice(0, 5).map((snapshot) => (
          <div className="grid gap-2 rounded-xl border border-ink/10 bg-white p-3 text-xs sm:grid-cols-[1fr_auto_auto_auto]" key={snapshot.syncedAt}>
            <strong className="text-ink">{new Date(snapshot.syncedAt).toLocaleString()}</strong>
            <span className="font-bold text-graphite/70">{snapshot.contacts} contacts</span>
            <span className="font-bold text-graphite/70">{snapshot.openOpportunities} open</span>
            <span className="font-bold text-graphite/70">${Math.round(snapshot.pipelineValue).toLocaleString()} pipeline</span>
          </div>
        )) : (
          <p className="rounded-xl border border-dashed border-ink/15 bg-[#fbfbfa] p-4 text-sm text-graphite/70">No HighLevel snapshots yet. Run the first read-only sync to start tracking history.</p>
        )}
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite/55">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function ConversionTrackingCenter({ analysis }: { analysis: BusinessProfile }) {
  const [googleAdsData, setGoogleAdsData] = useState<GoogleAdsDataPayload | null>(null);
  const [highLevelData, setHighLevelData] = useState<HighLevelDataPayload | null>(null);
  const [status, setStatus] = useState<ConnectedAppStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const refreshTrackingData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const [googleStatusResponse, highLevelStatusResponse, googleDataResponse, highLevelDataResponse] = await Promise.all([
        fetch("/api/google-ads/status", { cache: "no-store" }),
        fetch("/api/highlevel/status", { cache: "no-store" }),
        fetch("/api/google-ads/data", { cache: "no-store" }),
        fetch("/api/highlevel/data", { cache: "no-store" }),
      ]);
      const googleStatus = googleStatusResponse.ok ? await googleStatusResponse.json() as Pick<ConnectedAppStatus, "googleAds"> : null;
      const highLevelStatus = highLevelStatusResponse.ok ? await highLevelStatusResponse.json() as Pick<ConnectedAppStatus, "highLevel"> : null;
      const googlePayload = googleDataResponse.ok ? await googleDataResponse.json() as { data?: GoogleAdsDataPayload } : null;
      const highLevelPayload = highLevelDataResponse.ok ? await highLevelDataResponse.json() as { data?: HighLevelDataPayload } : null;

      setStatus({
        googleAds: googleStatus?.googleAds ?? emptyGoogleAdsStatus(),
        highLevel: highLevelStatus?.highLevel ?? emptyHighLevelStatus(),
      });
      setGoogleAdsData(googlePayload?.data ?? null);
      setHighLevelData(highLevelPayload?.data ?? null);
    } catch {
      setMessage("Conversion tracking data could not be loaded. Check Connected Apps, then refresh this screen.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTrackingData();
  }, [refreshTrackingData]);

  const funnel = highLevelData?.revenueFunnel;
  const adsClicks = googleAdsData ? sumMetricRows(googleAdsData.campaigns, "clicks") : 0;
  const adsCost = googleAdsData ? sumMetricRows(googleAdsData.campaigns, "cost") : 0;
  const adsConversions = googleAdsData ? sumMetricRows(googleAdsData.conversions, "conversions") : 0;
  const hasGoogleAds = Boolean(status?.googleAds.connected || googleAdsData);
  const hasHighLevel = Boolean(status?.highLevel.connected || highLevelData);
  const hasCalls = Boolean((funnel?.phoneCalls ?? 0) || highLevelData?.calls.length);
  const hasForms = Boolean((funnel?.formsSubmitted ?? 0) || highLevelData?.formSubmissions.length);
  const hasOpportunities = Boolean(funnel?.totalOpportunities || highLevelData?.opportunities.length);
  const hasWonJobs = Boolean(funnel?.wonJobs || funnel?.wonOpportunities || (funnel?.closedWonValue ?? 0) > 0);
  const hasGclidField = hasTrackingField(highLevelData, ["gclid", "gbraid", "wbraid"]);
  const hasUtmFields = hasTrackingField(highLevelData, ["utm", "source", "campaign", "medium"]);
  const trackingScore = clampScore(avg([
    hasGoogleAds ? 82 : 35,
    hasHighLevel ? 86 : 40,
    hasCalls ? 78 : 42,
    hasForms ? 72 : 44,
    hasOpportunities ? 82 : 48,
    hasGclidField ? 86 : 45,
    googleAdsData?.conversions.length ? 78 : 45,
    hasWonJobs ? 90 : 56,
  ]));
  const recommendations = buildTrackingRecommendations({
    adsConversions,
    hasCalls,
    hasForms,
    hasGclidField,
    hasGoogleAds,
    hasHighLevel,
    hasOpportunities,
    hasUtmFields,
    hasWonJobs,
  });
  const blockers = buildTrackingBlockers({
    hasCalls,
    hasForms,
    hasGclidField,
    hasGoogleAds,
    hasHighLevel,
    hasOpportunities,
    hasUtmFields,
  });
  const hasContactPath = Boolean(analysis.phone || hasCalls || hasForms);
  const gtmStatus: TrackingIssueStatus = hasContactPath && (hasCalls || hasForms) ? "Ready" : hasHighLevel ? "Needs Work" : "Missing";

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <Eyebrow>Conversion Tracking Center</Eyebrow>
            <h2 className="mt-2 flex items-center gap-2 text-3xl font-black text-ink">
              <ChartNoAxesCombined className="size-7" aria-hidden="true" />
              Prove which marketing creates revenue
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-graphite">
              This center checks whether Google Ads, HighLevel calls, forms, opportunities, and won jobs can be tied together before budget is scaled. It is read-only and does not change campaigns.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <ScoreBadge label="Tracking" score={trackingScore} />
            <Button disabled={isLoading} onClick={refreshTrackingData} variant="secondary">{isLoading ? "Refreshing..." : "Refresh Tracking"}</Button>
          </div>
        </div>
        {message && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{message}</p>}
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Google Ads Clicks" value={adsClicks ? adsClicks.toLocaleString() : hasGoogleAds ? "No clicks synced" : "Not connected"} />
        <InfoTile label="Google Ads Cost" value={adsCost ? `$${Math.round(adsCost).toLocaleString()}` : hasGoogleAds ? "$0 synced" : "Not connected"} />
        <InfoTile label="HighLevel Calls" value={String(funnel?.phoneCalls ?? highLevelData?.calls.length ?? 0)} />
        <InfoTile label="Forms Submitted" value={String(funnel?.formsSubmitted ?? highLevelData?.formSubmissions.length ?? 0)} />
        <InfoTile label="CRM Leads" value={String(funnel?.crmLeads ?? funnel?.leads ?? 0)} />
        <InfoTile label="Open Opportunities" value={String(funnel?.totalOpportunities ?? highLevelData?.opportunities.length ?? 0)} />
        <InfoTile label="Closed Won Value" value={`$${Math.round(funnel?.closedWonValue ?? 0).toLocaleString()}`} />
        <InfoTile label="Google Conversions" value={googleAdsData?.conversions.length ? `${adsConversions.toFixed(1)} synced` : "None synced"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h3 className="text-lg font-black text-ink">Tracking Readiness</h3>
              <p className="mt-2 text-sm leading-6 text-graphite/70">
                Use this as the launch checklist before increasing spend or importing CRM conversions back into Google Ads.
              </p>
            </div>
            <TrackingStatusBadge status={blockers.length ? "Needs Work" : "Ready"} />
          </div>
          <div className="mt-4 grid gap-3">
            <TrackingCheck label="Google Ads connected" detail="Campaign performance and conversion actions are available." status={hasGoogleAds ? "Ready" : "Missing"} />
            <TrackingCheck label="HighLevel connected" detail="Calls, forms, contacts, opportunities, and won jobs can be synced." status={hasHighLevel ? "Ready" : "Missing"} />
            <TrackingCheck label="GTM / website tracking" detail="Confirm Google Tag Manager, click-to-call, form submits, and thank-you events are installed." status={gtmStatus} />
            <TrackingCheck label="GCLID / GBRAID capture" detail="Required for offline conversion imports and source-level CRM attribution." status={hasGclidField ? "Ready" : "Needs Work"} />
            <TrackingCheck label="UTM/source fields" detail="Needed to compare Google Ads, GBP, social, SEO, and direct leads inside HighLevel." status={hasUtmFields ? "Ready" : "Needs Work"} />
            <TrackingCheck label="CRM opportunity stages" detail="Needed to separate raw leads from estimates, won jobs, and revenue." status={hasOpportunities ? "Ready" : "Needs Work"} />
          </div>
        </Panel>

        <Panel>
          <h3 className="text-lg font-black text-ink">Conversion Import Plan</h3>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            These are the conversion actions HVAC Growth OS should treat as primary or secondary once Google Ads write/import workflows are approved.
          </p>
          <div className="mt-4 grid gap-3">
            {recommendations.map((recommendation) => (
              <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4" key={recommendation.title}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <TrackingStatusBadge status={recommendation.status} />
                      <span className="rounded-lg border border-ink/10 bg-white px-2 py-1 text-xs font-black text-copper">{recommendation.category}</span>
                    </div>
                    <h4 className="mt-3 text-sm font-black text-ink">{recommendation.title}</h4>
                  </div>
                  <ConfidenceBadge score={recommendation.confidence} />
                </div>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{recommendation.reason}</p>
                <p className="mt-3 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-bold leading-5 text-graphite/70">{recommendation.importGuidance}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <h3 className="text-lg font-black text-ink">HighLevel Attribution</h3>
          <div className="mt-4">
            <MiniAttributionTable rows={(funnel?.leadSources ?? []).map((row) => [row.source, String(row.count), `$${Math.round(row.value).toLocaleString()}`])} title="Lead Sources" />
          </div>
        </Panel>
        <Panel>
          <h3 className="text-lg font-black text-ink">Campaign Attribution</h3>
          <div className="mt-4">
            <MiniAttributionTable rows={(funnel?.campaignAttribution ?? []).map((row) => [row.campaign, String(row.leads), `$${Math.round(row.value).toLocaleString()}`])} title="Campaigns" />
          </div>
        </Panel>
        <Panel>
          <h3 className="text-lg font-black text-ink">Fix Before Scaling</h3>
          <div className="mt-4 grid gap-3">
            {blockers.length ? blockers.map((blocker) => (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-5 text-amber-900" key={blocker}>
                {blocker}
              </div>
            )) : (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm font-bold leading-5 text-teal-800">
                Core tracking signals are ready for launch review. Keep campaigns paused until the import settings are approved.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TrackingCheck({ detail, label, status }: { detail: string; label: string; status: TrackingIssueStatus }) {
  return (
    <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black text-ink">{label}</p>
        <TrackingStatusBadge status={status} />
      </div>
      <p className="mt-2 text-sm leading-5 text-graphite/70">{detail}</p>
    </article>
  );
}

function TrackingStatusBadge({ status }: { status: TrackingIssueStatus }) {
  const className =
    status === "Ready"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : status === "Needs Work"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return <span className={`rounded-lg border px-2 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function defaultGoogleAdsSetupItems() {
  return [
    { configured: false, detail: "Required to call the Google Ads API.", envVar: "GOOGLE_ADS_DEVELOPER_TOKEN", label: "Google Ads developer token" },
    { configured: false, detail: "Required to send users to Google OAuth consent.", envVar: "GOOGLE_CLIENT_ID", label: "Google OAuth client ID" },
    { configured: false, detail: "Required to exchange the authorization code for tokens.", envVar: "GOOGLE_CLIENT_SECRET", label: "Google OAuth client secret" },
    { configured: false, detail: "Manager or login customer ID used for Google Ads API requests.", envVar: "GOOGLE_ADS_LOGIN_CUSTOMER_ID", label: "Google Ads login customer ID" },
    { configured: false, detail: "Must match the authorized redirect URI in Google Cloud.", envVar: "GOOGLE_OAUTH_REDIRECT_URI", label: "OAuth redirect URI" },
    { configured: false, detail: "Required to encrypt the stored refresh token.", envVar: "GOOGLE_TOKEN_ENCRYPTION_KEY", label: "Token encryption key" },
  ];
}

function defaultHighLevelSetupItems() {
  return [
    { configured: false, detail: "Preferred path for sending users to HighLevel OAuth consent. Optional when API key fallback is configured.", envVar: "HIGHLEVEL_CLIENT_ID", label: "HighLevel OAuth client ID" },
    { configured: false, detail: "Preferred path for exchanging OAuth authorization codes. Optional when API key fallback is configured.", envVar: "HIGHLEVEL_CLIENT_SECRET", label: "HighLevel OAuth client secret" },
    { configured: false, detail: "Must match the redirect URI in the HighLevel OAuth app. Optional when private token fallback is configured.", envVar: "HIGHLEVEL_REDIRECT_URI", label: "HighLevel OAuth redirect URI" },
    { configured: false, detail: "Fallback read-only connection when OAuth is not available for the location-level account.", envVar: "HIGHLEVEL_API_KEY or HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN", label: "HighLevel private integration token" },
    { configured: false, detail: "Required with API key fallback so HVAC Growth OS knows which HighLevel location to sync.", envVar: "HIGHLEVEL_LOCATION_ID", label: "HighLevel location ID" },
    { configured: false, detail: "Required to encrypt the stored HighLevel refresh token. Use a dedicated HighLevel key or the shared Google token key.", envVar: "HIGHLEVEL_TOKEN_ENCRYPTION_KEY", label: "HighLevel token encryption key" },
  ];
}

function emptyGoogleAdsStatus(): ConnectedAppStatus["googleAds"] {
  return {
    activeCustomerId: "",
    connected: false,
    configured: false,
    credentialStorage: "Not connected",
    customerIds: [],
    lastSyncAt: "",
    permissionMode: "Read Only",
    setup: { items: defaultGoogleAdsSetupItems(), missingItems: [], ready: false },
    tokenStored: false,
  };
}

function emptyHighLevelStatus(): ConnectedAppStatus["highLevel"] {
  return {
    activeLocationId: "",
    callsTracked: 0,
    closedWon: 0,
    closedWonValue: 0,
    connected: false,
    connectedLocation: "",
    connectionSource: "",
    credentialStorage: "Not connected",
    configured: false,
    formsSubmitted: 0,
    lastSyncAt: "",
    leadSources: [],
    missedCalls: 0,
    openOpportunities: 0,
    openPipelineValue: 0,
    permissionMode: "Read Only",
    pipelineValue: 0,
    setup: { items: defaultHighLevelSetupItems(), missingItems: [], ready: false },
    tokenStored: false,
    totalContacts: 0,
    totalConversations: 0,
    totalOpportunities: 0,
  };
}

function hasTrackingField(highLevelData: HighLevelDataPayload | null, terms: string[]) {
  return Boolean(highLevelData?.customFields.some((field) => {
    const haystack = `${field.name} ${field.status ?? ""} ${field.source ?? ""} ${field.type ?? ""}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  }));
}

function buildTrackingRecommendations(signals: {
  adsConversions: number;
  hasCalls: boolean;
  hasForms: boolean;
  hasGclidField: boolean;
  hasGoogleAds: boolean;
  hasHighLevel: boolean;
  hasOpportunities: boolean;
  hasUtmFields: boolean;
  hasWonJobs: boolean;
}): TrackingRecommendation[] {
  return [
    {
      title: "Qualified HVAC Opportunity",
      category: "Primary",
      status: signals.hasOpportunities && signals.hasGclidField ? "Ready" : "Needs Work",
      reason: "Use the CRM opportunity as the main optimization signal once it can be tied back to the original Google Ads click.",
      importGuidance: "Import as a primary offline conversion after GCLID/GBRAID/WBRAID capture is confirmed.",
      confidence: signals.hasOpportunities && signals.hasGclidField ? 88 : 64,
    },
    {
      title: "Estimate Scheduled",
      category: "Primary",
      status: signals.hasOpportunities ? "Ready" : "Needs Work",
      reason: "Estimate intent is stronger than a raw call or form and better reflects revenue potential.",
      importGuidance: "Map the HighLevel estimate stage to a Google Ads conversion once stages are clean.",
      confidence: signals.hasOpportunities ? 82 : 58,
    },
    {
      title: "Closed Won HVAC Job",
      category: "Primary",
      status: signals.hasWonJobs && signals.hasGclidField ? "Ready" : "Needs Work",
      reason: "Closed won jobs are the best revenue signal, but volume may be lower and delayed.",
      importGuidance: "Import as a value-based conversion when won-job value and click IDs are present.",
      confidence: signals.hasWonJobs && signals.hasGclidField ? 86 : 60,
    },
    {
      title: "Phone Call Lead",
      category: "Secondary",
      status: signals.hasCalls ? "Ready" : "Missing",
      reason: "HVAC customers often call first. Calls should be measured but should not be the only bidding signal.",
      importGuidance: "Keep as secondary or diagnostic unless calls are consistently qualified inside HighLevel.",
      confidence: signals.hasCalls ? 80 : 48,
    },
    {
      title: "Form Lead",
      category: "Secondary",
      status: signals.hasForms ? "Ready" : "Needs Work",
      reason: "Forms help catch after-hours and research-stage leads, but need source and quality checks.",
      importGuidance: "Track form submissions and import only qualified forms as primary later.",
      confidence: signals.hasForms ? 76 : 52,
    },
    {
      title: "Google Ads Conversion Actions",
      category: "Diagnostic",
      status: signals.adsConversions > 0 ? "Ready" : signals.hasGoogleAds ? "Needs Work" : "Missing",
      reason: "Existing Google conversion actions help compare platform-reported conversions with CRM outcomes.",
      importGuidance: "Audit existing conversion actions before adding offline imports to avoid double counting.",
      confidence: signals.adsConversions > 0 ? 78 : 55,
    },
  ];
}

function buildTrackingBlockers(signals: {
  hasCalls: boolean;
  hasForms: boolean;
  hasGclidField: boolean;
  hasGoogleAds: boolean;
  hasHighLevel: boolean;
  hasOpportunities: boolean;
  hasUtmFields: boolean;
}) {
  return [
    !signals.hasGoogleAds ? "Connect Google Ads in read-only mode so spend, clicks, campaigns, and conversion actions can be compared." : "",
    !signals.hasHighLevel ? "Connect HighLevel so calls, forms, opportunities, and won jobs can become revenue signals." : "",
    !signals.hasGclidField ? "Add HighLevel custom fields for GCLID, GBRAID, and WBRAID before importing offline conversions." : "",
    !signals.hasUtmFields ? "Add or confirm UTM/source fields so leads can be grouped by Google Ads, GBP, social, SEO, and direct." : "",
    !signals.hasCalls && !signals.hasForms ? "Confirm call tracking and form tracking before scaling paid traffic." : "",
    !signals.hasOpportunities ? "Clean up opportunity stages so raw leads can be separated from estimates and won jobs." : "",
  ].filter(Boolean);
}

function GoogleAdsDataTable({ rows }: { rows: GoogleAdsMetricRow[] }) {
  if (!rows.length) {
    return (
      <p className="mt-5 rounded-xl border border-dashed border-ink/15 bg-[#fbfbfa] p-4 text-sm text-graphite/70">
        No synced rows yet. Connect Google Ads and refresh data.
      </p>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-ink/10">
      <table className="min-w-full divide-y divide-ink/10 text-left text-sm">
        <thead className="bg-[#fbfbfa] text-xs uppercase tracking-[0.12em] text-graphite/55">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Ad Group</th>
            <th className="px-4 py-3">Clicks</th>
            <th className="px-4 py-3">Impr.</th>
            <th className="px-4 py-3">CTR</th>
            <th className="px-4 py-3">Avg CPC</th>
            <th className="px-4 py-3">Cost</th>
            <th className="px-4 py-3">Conv.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10 bg-white">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 font-bold text-ink">{row.name}</td>
              <td className="px-4 py-3 text-graphite/70">{row.campaign || "-"}</td>
              <td className="px-4 py-3 text-graphite/70">{row.adGroup || "-"}</td>
              <td className="px-4 py-3 text-graphite/70">{row.clicks}</td>
              <td className="px-4 py-3 text-graphite/70">{row.impressions}</td>
              <td className="px-4 py-3 text-graphite/70">{formatPercent(row.ctr)}</td>
              <td className="px-4 py-3 text-graphite/70">${row.avgCpc.toFixed(2)}</td>
              <td className="px-4 py-3 text-graphite/70">${row.cost.toFixed(2)}</td>
              <td className="px-4 py-3 text-graphite/70">{row.conversions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sumMetricRows(rows: GoogleAdsMetricRow[], field: keyof Pick<GoogleAdsMetricRow, "clicks" | "impressions" | "cost" | "conversions">) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

function HighLevelDataTable({ rows }: { rows: HighLevelRecord[] }) {
  if (!rows.length) {
    return (
      <p className="mt-5 rounded-xl border border-dashed border-ink/15 bg-[#fbfbfa] p-4 text-sm text-graphite/70">
        No synced CRM rows yet. Connect HighLevel and refresh data.
      </p>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-ink/10">
      <table className="min-w-full divide-y divide-ink/10 text-left text-sm">
        <thead className="bg-[#fbfbfa] text-xs uppercase tracking-[0.12em] text-graphite/55">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10 bg-white">
          {rows.slice(0, 100).map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 font-bold text-ink">{row.name}</td>
              <td className="px-4 py-3 text-graphite/70">{row.type || "-"}</td>
              <td className="px-4 py-3 text-graphite/70">{row.status || "-"}</td>
              <td className="px-4 py-3 text-graphite/70">{row.source || "-"}</td>
              <td className="px-4 py-3 text-graphite/70">{row.stage || "-"}</td>
              <td className="px-4 py-3 text-graphite/70">${Math.round(row.value || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-graphite/70">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function tableLabel(table: keyof Pick<GoogleAdsDataPayload, "campaigns" | "adGroups" | "keywords" | "searchTerms" | "ads" | "assets" | "conversions">) {
  return table
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInputValue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function highLevelTableLabel(table: keyof Pick<HighLevelDataPayload, "contacts" | "opportunities" | "opportunityStages" | "pipelines" | "conversations" | "calls" | "calendars" | "forms" | "formSubmissions" | "tags" | "workflows" | "customFields">) {
  return table
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function AiCmoSection({
  analysis,
  contractorUrl,
  ppcPlan,
}: {
  analysis: BusinessProfile;
  contractorUrl: string;
  ppcPlan: PpcPlan | null;
}) {
  const memoryKey = intelligenceMemoryKey(analysis, contractorUrl);
  const [memory, setMemory] = useState<IntelligenceSnapshot[]>([]);
  const [clientNotes, setClientNotes] = useState("");
  const [crmFunnel, setCrmFunnel] = useState<RevenueFunnelPayload | null>(null);
  const [googleAdsClicks, setGoogleAdsClicks] = useState(0);
  const hasCrmFunnelData = Boolean(crmFunnel && (crmFunnel.leads || crmFunnel.pipelineValue || crmFunnel.revenue));
  const brief = buildAiCmoBrief(analysis, contractorUrl, ppcPlan, memory, crmFunnel ?? undefined, googleAdsClicks);
  const currentSnapshot = createIntelligenceSnapshot(analysis, ppcPlan, brief, clientNotes);
  const htmlReport = buildAiCmoHtmlReport(analysis, contractorUrl, brief, memory);
  const summary = buildAiCmoClientSummary(analysis, brief);

  useEffect(() => {
    const storedMemory = loadIntelligenceMemory(memoryKey);
    if (storedMemory.length) {
      setMemory(storedMemory);
      return;
    }
    const baselineBrief = buildAiCmoBrief(analysis, contractorUrl, ppcPlan, []);
    const baselineSnapshot = createIntelligenceSnapshot(analysis, ppcPlan, baselineBrief, "Initial intelligence baseline saved from current audit.");
    saveIntelligenceMemory(memoryKey, [baselineSnapshot]);
    setMemory([baselineSnapshot]);
  }, [analysis, contractorUrl, memoryKey, ppcPlan]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/highlevel/data", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((payload: { data?: HighLevelDataPayload } | null) => {
          setCrmFunnel(payload?.data?.revenueFunnel ?? null);
        })
        .catch(() => setCrmFunnel(null)),
      fetch("/api/google-ads/data", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((payload: { data?: GoogleAdsDataPayload } | null) => {
          setGoogleAdsClicks(payload?.data?.campaigns ? sumMetricRows(payload.data.campaigns, "clicks") : 0);
        })
        .catch(() => setGoogleAdsClicks(0)),
    ]);
  }, []);

  function saveSnapshot() {
    const withoutToday = memory.filter((snapshot) => snapshot.date !== currentSnapshot.date);
    const nextMemory = [currentSnapshot, ...withoutToday].slice(0, 24);
    saveIntelligenceMemory(memoryKey, nextMemory);
    setMemory(nextMemory);
  }

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <Eyebrow>Daily Marketing Brief</Eyebrow>
            <h2 className="mt-2 flex items-center gap-2 text-3xl font-black text-ink">
              <Brain className="size-7" aria-hidden="true" />
              AI CMO
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-graphite">
              {brief.headline}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreBadge label="Today" score={brief.todayScore} />
            <ScoreBadge label="Memory" score={brief.memoryScore} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-2 text-lg font-black text-ink">
              <Target className="size-5" aria-hidden="true" />
              Top 5 Actions Today
            </h3>
            <Button onClick={saveSnapshot} variant="secondary">Save Today&apos;s Snapshot</Button>
          </div>
          <div className="mt-4 grid gap-3">
            {brief.actions.map((action) => (
              <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={action.action}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className={`rounded-md px-2 py-1 text-xs font-black ${priorityClass(action.priority)}`}>{action.priority}</span>
                    <h4 className="mt-3 text-sm font-black text-ink">{action.action}</h4>
                  </div>
                  <ConfidenceBadge score={action.confidence} />
                </div>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{action.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-copper">{action.impact}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-graphite">{action.relatedModule}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5">
          <Panel>
            <h3 className="flex items-center gap-2 text-lg font-black text-ink">
              <CloudSun className="size-5" aria-hidden="true" />
              Demand Signals
            </h3>
            <dl className="mt-4 grid gap-4 text-sm">
              {brief.demandSignals.map((item) => (
                <InfoRow key={item.label} label={item.label} value={item.value} />
              ))}
            </dl>
          </Panel>

          <Panel>
            <h3 className="text-lg font-black text-ink">Tracking & Operations Alerts</h3>
            <div className="mt-4 grid gap-3">
              {brief.operationsAlerts.map((alert) => (
                <article className="rounded-md border border-ink/10 bg-frost p-3" key={alert.label}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-ink">{alert.label}</p>
                    <StatusBadge status={alert.status} />
                  </div>
                  <p className="mt-2 text-sm leading-5 text-graphite/70">{alert.detail}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RecommendationPanel title="Campaign Recommendations" values={brief.campaignRecommendations} />
        <RecommendationPanel title="Content Recommendations" values={brief.contentRecommendations} />
        <RecommendationPanel title="Competitive Alerts" values={brief.competitiveAlerts} />
        <RecommendationPanel title="Predictions" values={brief.predictions} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <h3 className="text-lg font-black text-ink">Intelligence Memory</h3>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            This client has {memory.length} saved observation{memory.length === 1 ? "" : "s"}. Future versions can move this same history into persistent client workspaces.
          </p>
          <div className="mt-4 grid gap-3">
            <TextField label="Client Notes / Actions Taken" value={clientNotes} onChange={setClientNotes} />
            {memory.slice(0, 4).map((snapshot) => (
              <article className="rounded-md border border-ink/10 bg-frost p-3" key={snapshot.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-ink">{new Date(snapshot.date).toLocaleDateString()}</p>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-copper">{snapshot.demandIndex} demand</span>
                </div>
                <p className="mt-2 text-sm leading-5 text-graphite/70">
                  {snapshot.topService} in {snapshot.topCity}. SEO {snapshot.seoScore}, AI {snapshot.aiVisibilityScore}, Revenue {snapshot.revenueScore}.
                </p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="text-lg font-black text-ink">Lessons Learned</h3>
          <div className="mt-4 grid gap-3">
            {brief.lessonsLearned.map((lesson) => (
              <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={lesson.label}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-ink">{lesson.label}</p>
                  <ConfidenceBadge score={lesson.confidence} />
                </div>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{lesson.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-ink">
              <Download className="size-5" aria-hidden="true" />
              Daily Brief Export
            </h3>
            <p className="mt-2 text-sm leading-6 text-graphite/70">
              Recommendations only. AI CMO does not change budgets or campaigns automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-frost" download="ai-cmo-daily-brief.html" href={textDataUrl(htmlReport, "text/html")}>
              <Download className="size-4" aria-hidden="true" />
              HTML Report
            </a>
            <a className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-frost" download="ai-cmo-pdf-ready-report.html" href={textDataUrl(htmlReport, "text/html")}>
              <Download className="size-4" aria-hidden="true" />
              PDF-Ready Report
            </a>
          </div>
        </div>
        <textarea
          className="mt-4 min-h-32 w-full rounded-md border border-ink/15 bg-frost px-3 py-3 text-sm leading-6 text-ink outline-none"
          readOnly
          value={summary}
        />
      </Panel>
    </div>
  );
}

function MarketingIntelligenceSection({
  analysis,
  ppcPlan,
}: {
  analysis: BusinessProfile;
  ppcPlan: PpcPlan | null;
}) {
  const primaryCity = analysis.serviceAreas[0] || "primary market";
  const [signals, setSignals] = useState({
    currentWeather: "Warm, humid, and uncomfortable during peak afternoon hours",
    forecast: "7-day forecast favors higher cooling demand with scattered storms",
    seasonality: currentHvacSeason(),
    googleTrends: `AC repair and HVAC repair interest rising around ${primaryCity}`,
    adsPerformance: ppcPlan ? "Revenue Engine campaigns are ready for launch review" : "Google Ads data not connected yet",
    searchVolume: "High cooling-season search demand",
    competitorObservations: "Nearby contractors are pushing repair speed, financing, and maintenance offers",
    websiteAnalytics: "Service pages and contact paths should be watched for conversion lift",
    crmLeadVolume: "12",
    campaignPerformance: "Repair and emergency-intent campaigns should get the first budget tests",
  });

  const intelligence = buildMarketingIntelligence(analysis, ppcPlan, {
    ...signals,
    crmLeadVolume: Number(signals.crmLeadVolume) || 0,
  });

  function updateSignal(field: keyof typeof signals, value: string) {
    setSignals({ ...signals, [field]: value });
  }

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-ink">
              <CloudSun className="size-5" aria-hidden="true" />
              Marketing Intelligence
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
              Daily operating recommendations based on weather, seasonality, search demand, CRM volume, website signals, and campaign readiness.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreBadge label="Daily" score={intelligence.dailyMarketingScore} />
            <ScoreBadge label="Demand" score={intelligence.hvacDemandIndex} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel>
          <h3 className="flex items-center gap-2 text-lg font-black text-ink">
            <Gauge className="size-5" aria-hidden="true" />
            Live Signal Inputs
          </h3>
          <div className="mt-5 grid gap-4">
            <TextField label="Current Weather" value={signals.currentWeather} onChange={(value) => updateSignal("currentWeather", value)} />
            <TextField label="7-Day Forecast" value={signals.forecast} onChange={(value) => updateSignal("forecast", value)} />
            <TextField label="Seasonality" value={signals.seasonality} onChange={(value) => updateSignal("seasonality", value)} />
            <TextField label="Google Trends" value={signals.googleTrends} onChange={(value) => updateSignal("googleTrends", value)} />
            <TextField label="Google Ads Performance" value={signals.adsPerformance} onChange={(value) => updateSignal("adsPerformance", value)} />
            <TextField label="Search Volume" value={signals.searchVolume} onChange={(value) => updateSignal("searchVolume", value)} />
            <TextField label="CRM Lead Volume Today" value={signals.crmLeadVolume} onChange={(value) => updateSignal("crmLeadVolume", value)} />
            <TextField label="Existing Campaign Performance" value={signals.campaignPerformance} onChange={(value) => updateSignal("campaignPerformance", value)} />
          </div>
        </Panel>

        <div className="grid gap-5">
          <Panel>
            <h3 className="flex items-center gap-2 text-lg font-black text-ink">
              <Target className="size-5" aria-hidden="true" />
              Today&apos;s Decisions
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {intelligence.answers.map((answer) => (
                <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={answer.question}>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-copper">{answer.question}</p>
                  <p className="mt-2 text-sm font-black text-ink">{answer.answer}</p>
                  <p className="mt-2 text-sm leading-5 text-graphite/70">{answer.explanation}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel>
            <h3 className="flex items-center gap-2 text-lg font-black text-ink">
              <TrendingUp className="size-5" aria-hidden="true" />
              Top 5 Marketing Actions
            </h3>
            <div className="mt-4 grid gap-3">
              {intelligence.priorityActions.map((action, index) => (
                <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={action.action}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-black text-ink">{index + 1}. {action.action}</p>
                    <ConfidenceBadge score={action.confidence} />
                  </div>
                  <p className="mt-2 text-sm leading-5 text-graphite/70">{action.explanation}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RecommendationPanel title="Budget Adjustments" values={intelligence.budgetAdjustments} />
        <RecommendationPanel title="Best Services Today" values={intelligence.servicesToPromote} />
        <RecommendationPanel title="Cities To Prioritize" values={intelligence.citiesToPrioritize} />
        <RecommendationPanel title="Social Posting Opportunities" values={intelligence.socialPosts} />
        <RecommendationPanel title="Email Campaigns" values={intelligence.emailCampaigns} />
        <RecommendationPanel title="Review Requests" values={intelligence.reviewRequests} />
      </div>
    </div>
  );
}

function MarketIntelligenceSection({
  analysis,
  contractorUrl,
  ppcPlan,
}: {
  analysis: BusinessProfile;
  contractorUrl: string;
  ppcPlan: PpcPlan | null;
}) {
  const defaultSearchTerms = [
    `AC Repair ${analysis.serviceAreas[0] || "Lawrenceville"}`,
    `HVAC Repair ${analysis.serviceAreas[0] || "Lawrenceville"}`,
    `Furnace Repair ${analysis.serviceAreas[0] || "Lawrenceville"}`,
    `Heat Pump Repair ${analysis.serviceAreas[0] || "Lawrenceville"}`,
    `HVAC Contractor ${analysis.serviceAreas[0] || "Lawrenceville"}`,
    `Air Conditioning Repair ${analysis.serviceAreas[0] || "Lawrenceville"}`,
  ];
  const [seedUrls, setSeedUrls] = useState("");
  const [searchTerms, setSearchTerms] = useState(defaultSearchTerms.join("\n"));
  const [marketSize, setMarketSize] = useState(24);
  const intelligence = buildMarketIntelligence(analysis, contractorUrl, ppcPlan, {
    seedUrls: linesToList(seedUrls),
    searchTerms: linesToList(searchTerms),
    marketSize,
  });

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-ink">
              <Users className="size-5" aria-hidden="true" />
              Market Intelligence
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
              Local HVAC market strategy across discovery, visibility, saturation, messaging, promotions, ads, SEO, and market memory.
            </p>
          </div>
          <ScoreBadge label="Market" score={intelligence.marketOpportunityScore} />
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel>
          <h3 className="text-lg font-black text-ink">Market Discovery Engine</h3>
          <div className="mt-5 grid gap-4">
            <ListField label="Search Patterns" values={linesToList(searchTerms)} onChange={setSearchTerms} />
            <ListField label="Optional Seed Company URLs" values={linesToList(seedUrls)} onChange={setSeedUrls} />
            <label className="space-y-2">
              <FieldLabel>Target Market Size</FieldLabel>
              <input
                className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/15"
                max="30"
                min="12"
                onChange={(event) => setMarketSize(Number(event.target.value))}
                type="number"
                value={marketSize}
              />
            </label>
            <p className="text-sm leading-6 text-graphite/70">
              vNext-ready discovery model: Google organic, GBP, ads, directories, and company sites. Current version models a deduplicated market dataset from available client signals and seed inputs.
            </p>
          </div>
        </Panel>

        <Panel>
          <h3 className="flex items-center gap-2 text-lg font-black text-ink">
            <Target className="size-5" aria-hidden="true" />
            Market Position Score
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MetricCard label="Visibility" value={intelligence.marketPosition.visibility} />
            <MetricCard label="Projected Rank" value={intelligence.marketPosition.projectedRank} />
            <MetricCard label="Confidence" value={intelligence.marketPosition.confidence} />
            <MetricCard label="Businesses" value={intelligence.marketDatabase.length} />
          </div>
          <p className="mt-4 text-sm leading-6 text-graphite/70">{intelligence.marketPosition.explanation}</p>
          <p className="mt-2 text-sm font-black text-ink">Market Rank: {intelligence.marketPosition.marketRank}</p>
        </Panel>
      </div>

      <Panel>
        <h3 className="text-lg font-black text-ink">AI Market Director</h3>
        <p className="mt-3 text-base leading-7 text-graphite">{intelligence.marketDirectorSummary}</p>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h3 className="text-lg font-black text-ink">Market Opportunity Score</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {intelligence.opportunityScores.map((score) => (
              <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={score.label}>
                <p className="text-3xl font-black text-ink">{score.score}</p>
                <p className="mt-1 text-sm font-black text-ink">{score.label}</p>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{score.explanation}</p>
              </article>
            ))}
          </div>
        </Panel>
        <Panel>
          <h3 className="text-lg font-black text-ink">Market Saturation</h3>
          <div className="mt-4 grid gap-3">
            {intelligence.marketSaturation.map((item) => (
              <div className="rounded-md border border-ink/10 bg-frost p-3" key={item.service}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-ink">{item.service}</p>
                  <span className={`rounded-md px-2 py-1 text-xs font-black ${saturationClass(item.level)}`}>{item.level}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-flame" style={{ width: `${item.score}%` }} />
                </div>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{item.reason}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <h3 className="text-lg font-black text-ink">Market Database</h3>
        <PpcTable
          columns={["Business", "Category", "Position", "Ads", "Reviews"]}
          rows={intelligence.marketDatabase.slice(0, 12).map((company) => [
            company.businessName,
            company.category,
            company.positioning,
            company.advertisingPresence,
            `${company.reviewRating} (${company.reviewCount})`,
          ])}
          title="Deduplicated Market Sample"
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <RecommendationPanel title="What Everyone Says" values={intelligence.whatEveryoneSays} />
        <RecommendationPanel title="What Nobody Says" values={intelligence.whatNobodySays} />
        <RecommendationPanel title="Promotion Analysis" values={intelligence.promotionAnalysis} />
        <RecommendationPanel title="Google Ads Market Scan" values={intelligence.googleAdsMarketScan} />
        <RecommendationPanel title="Local SEO Analysis" values={intelligence.localSeoAnalysis} />
        <RecommendationPanel title="Market Gap Engine" values={intelligence.marketGaps} />
        <RecommendationPanel title="Differentiation Engine" values={intelligence.differentiation} />
        <RecommendationPanel title="Landing Page Recommendations" values={intelligence.landingPageRecommendations} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h3 className="text-lg font-black text-ink">Promotion Mix: Client vs Market</h3>
          <div className="mt-4 grid gap-3">
            {intelligence.promotionMix.map((promo) => (
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-ink/10 bg-frost p-3" key={promo.label}>
                <p className="text-sm font-black text-ink">{promo.label}</p>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-copper">Market {promo.market}%</span>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-graphite">Client {promo.client ? "Yes" : "No"}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h3 className="text-lg font-black text-ink">Market Timeline</h3>
          <div className="mt-4 grid gap-3">
            {intelligence.marketTimeline.map((event) => (
              <article className="rounded-md border border-ink/10 bg-frost p-3" key={`${event.date}-${event.event}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-copper">{event.date}</p>
                <p className="mt-2 text-sm font-black text-ink">{event.event}</p>
                <p className="mt-1 text-sm leading-5 text-graphite/70">{event.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <h3 className="text-lg font-black text-ink">Original Ad Copy Inspired By Market Gaps</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {intelligence.adCopy.map((copy) => (
            <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={`${copy.headline}-${copy.description}`}>
              <p className="text-sm font-black text-ink">{copy.headline}</p>
              <p className="mt-2 text-sm leading-5 text-graphite/70">{copy.description}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function RecommendationPanel({ title, values }: { title: string; values: Array<{ label: string; detail: string; confidence: number }> }) {
  return (
    <Panel>
      <h3 className="text-lg font-black text-ink">{title}</h3>
      <div className="mt-4 grid gap-3">
        {values.map((value) => (
          <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={`${title}-${value.label}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">{value.label}</p>
              <ConfidenceBadge score={value.confidence} />
            </div>
            <p className="mt-2 text-sm leading-5 text-graphite/70">{value.detail}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  return (
    <span className="rounded-lg border border-flame/20 bg-teal-50 px-2 py-1 text-xs font-black text-copper">
      {score}% confidence
    </span>
  );
}

function OpportunityBadge({ score }: { score: number }) {
  return (
    <span className="rounded-lg border border-ink/10 bg-white px-2 py-1 text-xs font-black text-copper">
      {score} opportunity
    </span>
  );
}

function ReportsSection({
  analysis,
  campaign,
  campaignImage,
  error,
  goal,
  isCreatingCampaign,
  offer,
  onCreateCampaign,
  ppcPlan,
  setGoal,
  setOffer,
}: {
  analysis: BusinessProfile;
  campaign: CampaignOutput | null;
  campaignImage: CampaignImage | null;
  error: string;
  goal: string;
  isCreatingCampaign: boolean;
  offer: string;
  onCreateCampaign: (event: FormEvent<HTMLFormElement>) => void;
  ppcPlan: PpcPlan | null;
  setGoal: (value: string) => void;
  setOffer: (value: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <Panel>
        <h2 className="flex items-center gap-2 text-xl font-black text-ink">
          <FileText className="size-5" aria-hidden="true" />
          Report Center
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {["Launch Report", "Weekly Marketing Report", "Monthly Executive Report", "Quarterly Growth Review", "Annual Marketing Review"].map((report) => (
            <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={report}>
              <p className="text-sm font-black text-ink">{report}</p>
              <p className="mt-2 text-sm leading-5 text-graphite/70">
                {ppcPlan ? "Ready to generate from current workspace data." : "Run Revenue Engine to complete this report."}
              </p>
            </article>
          ))}
        </div>
      </Panel>
      <CampaignForm
        error={error}
        goal={goal}
        isCreatingCampaign={isCreatingCampaign}
        offer={offer}
        onCreateCampaign={onCreateCampaign}
        setGoal={setGoal}
        setOffer={setOffer}
      />
      {campaign && <CampaignPanel campaign={campaign} campaignImage={campaignImage} />}
      <Panel>
        <h2 className="text-lg font-black text-ink">Report Inputs</h2>
        <BulletList
          emptyText=""
          values={[
            `${analysis.companyName || "Client"} business profile`,
            `${analysis.seoAnalysis.recommendedFixes.length} SEO fixes`,
            `${analysis.aiSeoAnalysis.recommendedFixes.length} AI visibility fixes`,
            ppcPlan ? `${ppcPlan.recommendedLaunchPlan.length} Revenue Engine launch campaigns` : "Revenue Engine not generated yet",
          ]}
        />
      </Panel>
    </div>
  );
}

function SettingsSection({
  analysis,
  onListChange,
  onUpdate,
}: {
  analysis: BusinessProfile;
  onListChange: (
    field: "services" | "serviceAreas" | "differentiators" | "topGrowthOpportunities",
    value: string,
  ) => void;
  onUpdate: <K extends keyof BusinessProfile>(field: K, value: BusinessProfile[K]) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <ProfileEditor analysis={analysis} onListChange={onListChange} onUpdate={onUpdate} />
      <Panel>
        <h2 className="flex items-center gap-2 text-lg font-black text-ink">
          <Settings className="size-5" aria-hidden="true" />
          Platform Settings
        </h2>
        <BulletList
          emptyText=""
          values={[
            "CRM: HighLevel-ready workspace",
            "Website platform: detected during onboarding or entered manually",
            "Future-ready: multiple industries, historical reports, versioned audits, recurring scans",
          ]}
        />
        <div className="mt-6 rounded-2xl border border-ink/10 bg-[#fbfbfa] p-4">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Private Access</h3>
          <BulletList
            emptyText=""
            values={[
              "Public signup is closed.",
              "Approved users are managed by admins through HVAC_GROWTH_OS_USERS.",
              "Roles supported: Admin, TallTwin Team, Client, Viewer.",
              "Client users are scoped with clientIds so future multi-client workspaces can filter data by account.",
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}

function OnboardingPreview() {
  const steps = [
    "Business Information",
    "Access Checklist",
    "Run Firecrawl",
    "Generate Business Profile",
    "Run Revenue Engine",
    "Review Recommendations",
    "Deploy Assets",
  ];

  return (
    <div className="mt-7 grid gap-2">
      {steps.map((step, index) => (
        <div className="flex items-center gap-3 text-sm font-semibold text-graphite" key={step}>
          <span className="flex size-7 items-center justify-center rounded-md bg-white text-xs font-black text-copper shadow-sm">
            {index + 1}
          </span>
          {step}
        </div>
      ))}
    </div>
  );
}

function OperatingChannels() {
  const channels = [
    ["01", "Google Ads", "Search demand"],
    ["02", "SEO", "Local intent"],
    ["03", "AI CMO", "Daily decisions"],
    ["04", "Market", "Opportunity map"],
    ["05", "Website", "Conversion paths"],
    ["06", "Reporting", "Real outcomes"],
  ];

  return (
    <div className="os-channel-orbit" aria-label="HVAC Growth OS operating channels">
      {channels.map(([number, title, detail]) => (
        <article className="os-channel-card" key={title}>
          <span>{number}</span>
          <strong>{title}</strong>
          <em>{detail}</em>
        </article>
      ))}
    </div>
  );
}

function ScoreGrid({ analysis, ppcPlan }: { analysis: BusinessProfile; ppcPlan: PpcPlan | null }) {
  const scores = [
    ["Overall Growth", Math.round(analysis.growthScore)],
    ["Revenue", ppcPlan ? Math.round(avg(ppcPlan.campaignReadiness.map((item) => item.priorityScore))) : 0],
    ["AI Visibility", analysis.aiSeoAnalysis.score],
    ["SEO", analysis.seoAnalysis.score],
    ["Google Ads", ppcPlan ? Math.round(avg(ppcPlan.recommendedLaunchPlan.map((item) => item.priorityScore))) : 0],
    ["GBP", analysis.aiSeoAnalysis.citationOpportunities.length ? 70 : 45],
    ["HighLevel", 25],
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {scores.map(([label, score]) => (
        <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-3" key={label}>
          <p className="text-2xl font-black text-ink">{score}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">{label}</p>
        </div>
      ))}
    </div>
  );
}

function HealthBadge({ color, score }: { color: "Green" | "Yellow" | "Red"; score: number }) {
  const className =
    color === "Green"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : color === "Yellow"
        ? "border-flame/20 bg-teal-50 text-copper"
        : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${className}`}>
      <p className="text-2xl font-black leading-none">{score}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em]">{color}</p>
    </div>
  );
}

function TaskCenter({ analysis, ppcPlan }: { analysis: BusinessProfile; ppcPlan: PpcPlan | null }) {
  const tasks = buildTasks(analysis, ppcPlan);

  return (
    <Panel>
      <h2 className="flex items-center gap-2 text-lg font-black text-ink">
        <ListChecks className="size-5" aria-hidden="true" />
        Task Center
      </h2>
      <div className="mt-4 grid gap-3">
        {tasks.map((task) => (
          <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-3" key={task.title}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">{task.title}</p>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-copper ring-1 ring-ink/10">{task.priority}</span>
            </div>
            <p className="mt-2 text-sm leading-5 text-graphite/70">{task.detail}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ClientTimeline({ ppcPlan }: { ppcPlan: PpcPlan | null }) {
  const steps = [
    ["Website Imported", true],
    ["SEO Audit Complete", true],
    ["Revenue Engine Complete", Boolean(ppcPlan)],
    ["Google Ads Generated", Boolean(ppcPlan?.recommendedLaunchPlan.length)],
    ["HighLevel Connected", false],
    ["Campaign Launched", false],
    ["Month 1 Report", false],
  ] as const;

  return (
    <Panel>
      <h2 className="text-lg font-black text-ink">Client Timeline</h2>
      <div className="mt-5 space-y-3">
        {steps.map(([label, complete]) => (
          <div className="flex items-start gap-3" key={label}>
            <CheckCircle2 className={`mt-0.5 size-5 ${complete ? "text-green-600" : "text-graphite/25"}`} aria-hidden="true" />
            <div>
              <p className="text-sm font-black text-ink">{label}</p>
              <p className="text-sm text-graphite/65">{complete ? "Complete" : "Pending"}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ActionRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center justify-between rounded-xl border border-ink/10 bg-[#fbfbfa] px-4 py-3 text-left text-sm font-black text-ink transition hover:border-flame/40 hover:bg-white"
      onClick={onClick}
      type="button"
    >
      {label}
      <Rocket className="size-4 text-copper" aria-hidden="true" />
    </button>
  );
}

function ImplementationChannelCard({
  channel,
  onApprove,
  onDeploy,
  onExport,
  onPreview,
}: {
  channel: ImplementationChannel;
  onApprove: () => void;
  onDeploy: () => void;
  onExport: () => void;
  onPreview: () => void;
}) {
  return (
    <Panel className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ink via-flame to-copper" />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-ink">{channel.target}</h3>
            <ChannelStatusBadge status={channel.status} />
          </div>
          <p className="mt-2 text-sm leading-6 text-graphite/70">{channel.topRecommendedDeployment}</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] px-4 py-3 text-center">
          <p className="text-2xl font-black text-ink">{channel.pendingDeployments}</p>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-graphite/55">Pending</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ChannelDetail label="Required integrations" values={channel.requiredIntegrations} />
        <ChannelDetail label="Blocking issues" values={channel.blockingIssues} emptyText="No blockers found" />
      </div>

      <div className="mt-4 rounded-xl border border-ink/10 bg-[#fbfbfa] p-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite/55">Last deployed item</p>
        <p className="mt-1 text-sm font-bold text-ink">{channel.lastDeployedItem}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-black text-ink transition hover:border-flame/40" disabled={!channel.candidate} onClick={onPreview} type="button">Preview</button>
        <button className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-black text-ink transition hover:border-flame/40" disabled={!channel.candidate} onClick={onApprove} type="button">Approve</button>
        <button className="rounded-lg bg-ink px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" disabled={!channel.candidate} onClick={onDeploy} type="button">Deploy</button>
        <button className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-black text-ink transition hover:border-flame/40" disabled={!channel.candidate} onClick={onExport} type="button">Export</button>
      </div>
    </Panel>
  );
}

function ChannelDetail({ emptyText = "None", label, values }: { emptyText?: string; label: string; values: string[] }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite/55">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length ? values.map((value) => (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-graphite/75" key={value}>{value}</span>
        )) : (
          <span className="text-sm font-bold text-graphite/50">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function ChannelStatusBadge({ status }: { status: ChannelStatus }) {
  const className =
    status === "Ready"
      ? "bg-teal-50 text-teal-700 border-teal-200"
      : status === "Needs Setup"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : status === "Pending Review"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : status === "Deployed"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-rose-50 text-rose-700 border-rose-200";

  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function DeploymentWorkflowCard({
  candidate,
  onDeploy,
  onUpdate,
  record,
}: {
  candidate: DeploymentCandidate;
  onDeploy: (candidate: DeploymentCandidate) => void;
  onUpdate: (candidate: DeploymentCandidate, status: DeploymentApprovalStatus) => void;
  record?: DeploymentRecord;
}) {
  const validation = validateDeployment(candidate);
  const approvalStatus = record?.approvalStatus ?? "Pending";
  const runtimeStatus = record?.runtimeStatus ?? "Waiting";
  const log = record?.log ?? ["Waiting for human review."];
  const history = record?.history ?? [];

  return (
    <Panel>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">{candidate.target}</span>
            <DeploymentStatusBadge status={runtimeStatus} />
            <ApprovalBadge status={approvalStatus} />
          </div>
          <h3 className="mt-3 text-xl font-black text-ink">{candidate.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">{candidate.recommendation}</p>
        </div>
        <Button onClick={() => onDeploy(candidate)} variant={approvalStatus === "Approved" ? "primary" : "secondary"}>
          Deploy Draft
        </Button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-5">
        <PipelineStage title="1. Recommendation">
          <p>{candidate.recommendation}</p>
          <p className="mt-2 font-bold text-ink">Memory feed: {candidate.intelligenceMemoryNote}</p>
        </PipelineStage>
        <PipelineStage title="2. Preview">
          <BulletList emptyText="" values={candidate.preview} />
        </PipelineStage>
        <PipelineStage title="3. Validation">
          <div className="grid gap-2">
            {candidate.dependencies.map((dependency) => (
              <div className="flex gap-2" key={dependency.label}>
                <CheckCircle2 className={`mt-0.5 size-4 ${dependency.exists ? "text-green-600" : "text-copper"}`} aria-hidden="true" />
                <p>
                  <strong className="text-ink">{dependency.label}:</strong> {dependency.detail}
                </p>
              </div>
            ))}
          </div>
        </PipelineStage>
        <PipelineStage title="4. Approval">
          <div className="grid gap-2">
            <button className="rounded-lg bg-ink px-3 py-2 text-left text-xs font-black text-white" onClick={() => onUpdate(candidate, "Approved")} type="button">Approve</button>
            <button className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-left text-xs font-black text-ink" onClick={() => onUpdate(candidate, "Dismissed")} type="button">Dismiss</button>
            <button className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-left text-xs font-black text-ink" onClick={() => onUpdate(candidate, "Remind Later")} type="button">Remind Later</button>
          </div>
        </PipelineStage>
        <PipelineStage title="5. Deploy">
          <p className="font-bold text-ink">{candidate.deployMode}</p>
          <p className="mt-2">{validation.ready ? "Dependencies are ready for a safe draft deployment." : `Waiting on: ${validation.missing.join(", ")}`}</p>
          <p className="mt-2">Campaigns and assets are never enabled automatically.</p>
        </PipelineStage>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4">
          <h4 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Deployment Log</h4>
          <div className="mt-3 grid gap-2">
            {log.map((entry, index) => (
              <p className="rounded-lg bg-white px-3 py-2 text-sm text-graphite/75" key={`${entry}-${index}`}>{entry}</p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4">
          <h4 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Deployment History</h4>
          <div className="mt-3 grid gap-2">
            {history.length ? history.slice(0, 4).map((item) => (
              <p className="rounded-lg bg-white px-3 py-2 text-sm text-graphite/75" key={`${item.date}-${item.event}`}>
                {item.event} <span className="font-bold text-graphite/45">({new Date(item.date).toLocaleString()} by {item.actor})</span>
              </p>
            )) : (
              <p className="rounded-lg bg-white px-3 py-2 text-sm text-graphite/75">No action taken yet.</p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PipelineStage({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 text-sm leading-6 text-graphite/70">
      <h4 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-ink">{title}</h4>
      {children}
    </div>
  );
}

function DeploymentStatusBadge({ status }: { status: DeploymentRuntimeStatus }) {
  const className =
    status === "Success"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "Failed"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function ApprovalBadge({ status }: { status: DeploymentApprovalStatus }) {
  const className =
    status === "Approved"
      ? "bg-teal-50 text-teal-700 border-teal-200"
      : status === "Dismissed"
        ? "bg-slate-100 text-graphite border-ink/10"
        : status === "Remind Later"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-white text-graphite border-ink/10";

  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function DeployCard({ title, items }: { title: string; items: Array<{ label: string; status: "Ready" | "Needs Work"; detail: string }> }) {
  return (
    <Panel>
      <h3 className="text-lg font-black text-ink">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-3" key={item.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">{item.label}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm leading-5 text-graphite/70">{item.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PpcPlannerPanel({
  analysis,
  isCreatingPpcPlan,
  onCreatePpcPlan,
  overrides,
  ppcPlan,
  setOverrides,
}: {
  analysis: BusinessProfile;
  isCreatingPpcPlan: boolean;
  onCreatePpcPlan: (event: FormEvent<HTMLFormElement>) => void;
  overrides: PpcManualOverrides;
  ppcPlan: PpcPlan | null;
  setOverrides: (value: PpcManualOverrides) => void;
}) {
  const [crmFunnel, setCrmFunnel] = useState<RevenueFunnelPayload | null>(null);
  const [googleAdsClicks, setGoogleAdsClicks] = useState(0);
  const hasCrmFunnelData = Boolean(crmFunnel && (crmFunnel.leads || crmFunnel.pipelineValue || crmFunnel.revenue));

  useEffect(() => {
    void Promise.all([
      fetch("/api/highlevel/data", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((payload: { data?: HighLevelDataPayload } | null) => {
          setCrmFunnel(payload?.data?.revenueFunnel ?? null);
        })
        .catch(() => setCrmFunnel(null)),
      fetch("/api/google-ads/data", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((payload: { data?: GoogleAdsDataPayload } | null) => {
          setGoogleAdsClicks(payload?.data?.campaigns ? sumMetricRows(payload.data.campaigns, "clicks") : 0);
        })
        .catch(() => setGoogleAdsClicks(0)),
    ]);
  }, []);

  function updateOverride<K extends keyof PpcManualOverrides>(field: K, value: PpcManualOverrides[K]) {
    setOverrides({ ...overrides, [field]: value });
  }

  return (
    <Panel className="mt-5">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-ink">
            <Megaphone className="size-5" aria-hidden="true" />
            Revenue Engine
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/70">
            Scores which HVAC campaigns are ready to launch, what needs fixing first, and which ad assets
            should be exported from the scraped business profile.
          </p>
        </div>
        {ppcPlan && (
          <div className="rounded-md bg-ink px-4 py-3 text-center text-white">
            <p className="text-3xl font-black leading-none">{ppcPlan.campaigns.length}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/70">launch picks</p>
          </div>
        )}
      </div>

      <form className="grid gap-4 lg:grid-cols-4" onSubmit={onCreatePpcPlan}>
        <TextField
          label="Business Name"
          onChange={(value) => updateOverride("businessName", value)}
          value={overrides.businessName ?? analysis.companyName}
        />
        <TextField
          label="Phone Number"
          onChange={(value) => updateOverride("phoneNumber", value)}
          value={overrides.phoneNumber ?? analysis.phone}
        />
        <label className="space-y-2">
          <FieldLabel>Monthly Budget</FieldLabel>
          <input
            className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
            min="0"
            onChange={(event) => updateOverride("monthlyBudget", Number(event.target.value))}
            type="number"
            value={overrides.monthlyBudget ?? 3000}
          />
        </label>
        <div className="flex items-end">
          <Button disabled={isCreatingPpcPlan} type="submit">
            {isCreatingPpcPlan ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {isCreatingPpcPlan ? "Building..." : "Build Revenue Engine"}
          </Button>
        </div>

        <label className="space-y-2">
          <FieldLabel>Avg Repair Ticket</FieldLabel>
          <input
            className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
            min="0"
            onChange={(event) => updateOverride("averageRepairTicket", Number(event.target.value))}
            type="number"
            value={overrides.averageRepairTicket ?? 750}
          />
        </label>
        <label className="space-y-2">
          <FieldLabel>Avg Replacement Ticket</FieldLabel>
          <input
            className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
            min="0"
            onChange={(event) => updateOverride("averageReplacementTicket", Number(event.target.value))}
            type="number"
            value={overrides.averageReplacementTicket ?? 9500}
          />
        </label>
        <label className="space-y-2">
          <FieldLabel>Close Rate %</FieldLabel>
          <input
            className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
            min="0"
            onChange={(event) => updateOverride("estimatedCloseRate", Number(event.target.value))}
            type="number"
            value={overrides.estimatedCloseRate ?? 35}
          />
        </label>
        <label className="space-y-2">
          <FieldLabel>Lead to Estimate %</FieldLabel>
          <input
            className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
            min="0"
            onChange={(event) => updateOverride("estimatedLeadToEstimateRate", Number(event.target.value))}
            type="number"
            value={overrides.estimatedLeadToEstimateRate ?? 65}
          />
        </label>

        <ListField
          label="Service Cities"
          onChange={(value) => updateOverride("serviceCities", linesToList(value))}
          values={overrides.serviceCities?.length ? overrides.serviceCities : analysis.serviceAreas}
        />
        <ListField
          label="Services to Prioritize"
          onChange={(value) => updateOverride("servicesToPrioritize", linesToList(value))}
          values={overrides.servicesToPrioritize ?? []}
        />
        <div className="grid content-start gap-3">
          <ToggleField
            checked={overrides.emergencyService ?? analysis.emergencyServiceMentioned}
            label="Emergency Service"
            onChange={(value) => updateOverride("emergencyService", value)}
          />
          <ToggleField
            checked={overrides.financing ?? analysis.financingMentioned}
            label="Financing"
            onChange={(value) => updateOverride("financing", value)}
          />
          <ToggleField
            checked={Boolean(overrides.freeEstimates)}
            label="Free Estimates"
            onChange={(value) => updateOverride("freeEstimates", value)}
          />
        </div>
        <div className="grid content-start gap-3">
          <ToggleField
            checked={Boolean(overrides.licensedAndInsured)}
            label="Licensed and Insured"
            onChange={(value) => updateOverride("licensedAndInsured", value)}
          />
          <ToggleField
            checked={Boolean(overrides.broadMatchEnabled)}
            label="Enable Broad Match"
            onChange={(value) => updateOverride("broadMatchEnabled", value)}
          />
        </div>
      </form>

      <div className="mt-6">
        <RevenueFunnelPanel funnel={crmFunnel ?? undefined} googleAdsClicks={googleAdsClicks} highLevelConnected={hasCrmFunnelData} />
      </div>

      {ppcPlan && <PpcPlanResults plan={ppcPlan} />}
    </Panel>
  );
}

function PpcPlanResults({ plan }: { plan: PpcPlan }) {
  const headlineCount = plan.responsiveSearchAds.filter((asset) => asset.assetType === "Headline").length;
  const descriptionCount = plan.responsiveSearchAds.filter((asset) => asset.assetType === "Description").length;

  return (
    <div className="mt-7 border-t border-ink/10 pt-6">
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Campaign Readiness</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {plan.campaignReadiness.map((item) => (
            <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={item.campaignKey}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-ink">{item.campaignName}</h4>
                  <p className="mt-2 text-sm leading-5 text-graphite/70">{item.reasoning}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={item.readinessStatus} />
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-ink">{item.priorityScore}</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-ink">First action: {item.recommendedFirstAction}</p>
              {item.missingRequirements.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {item.missingRequirements.map((requirement) => (
                    <li className="text-sm leading-5 text-graphite/70" key={requirement}>{requirement}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Keywords" value={plan.keywords.length} />
        <MetricCard label="Ad Groups" value={plan.adGroups.length} />
        <MetricCard label="Headlines" value={headlineCount} />
        <MetricCard label="Descriptions" value={descriptionCount} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Recommended Launch Plan</h3>
          <div className="mt-3 grid gap-3">
            {plan.recommendedLaunchPlan.map((campaign) => (
              <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]" key={campaign.campaign}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-ink">{campaign.campaign}</h4>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-copper">
                    ${campaign.recommendedDailyBudget}/day
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{campaign.whyLaunchNow}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-graphite/60">
                  ${campaign.monthlyBudgetEstimate}/month estimate
                </p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Detected Revenue Signals</h3>
          <dl className="mt-3 grid gap-3 text-sm">
            <InfoRow label="Business" value={plan.detected.businessName} />
            <InfoRow label="Phone" value={plan.detected.phoneNumber || "Not found"} />
            <InfoRow label="Financing" value={yesNo(plan.detected.financing)} />
            <InfoRow label="Emergency" value={yesNo(plan.detected.emergencyService)} />
            <InfoRow label="Maintenance" value={yesNo(plan.detected.maintenancePlans)} />
            <InfoRow label="Heat Pumps" value={yesNo(plan.detected.heatPumps)} />
            <InfoRow label="Water Heaters" value={yesNo(plan.detected.waterHeaters)} />
            <InfoRow label="IAQ" value={yesNo(plan.detected.indoorAirQuality)} />
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-ink/10 bg-frost p-4">
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Export Center</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {plan.csvExports.map((exportFile) => (
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-flame/5"
              download={exportFile.fileName}
              href={exportFile.dataUrl}
              key={exportFile.fileName}
            >
              <Download className="size-4" aria-hidden="true" />
              {exportFile.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <PpcTable
          columns={["Campaign", "Ad Group", "Keyword", "Match"]}
          rows={plan.keywords.slice(0, 12).map((keyword) => [
            keyword.campaign,
            keyword.adGroup,
            keyword.keyword,
            keyword.matchType,
          ])}
          title="Keyword Preview"
        />
        <PpcTable
          columns={["Ad Group", "Type", "Text"]}
          rows={plan.responsiveSearchAds.slice(0, 12).map((asset) => [
            asset.adGroup,
            asset.assetType,
            asset.text,
          ])}
          title="Responsive Search Ad Preview"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <PpcTable
          columns={["Campaign", "Ad Group", "Score", "Recommendation"]}
          rows={plan.landingPageRecommendations.map((page) => [
            page.campaign,
            page.adGroup,
            String(page.landingPageReadinessScore),
            page.recommendation,
          ])}
          title="Landing Page Intelligence"
        />
        <ForecastPanel plan={plan} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ReportList title="Search Intent Analysis" values={plan.report.searchIntentAnalysis} />
        <ReportList title="Missing Landing Pages" values={plan.report.missingLandingPages} />
        <ReportList title="Tracking Recommendations" values={plan.report.trackingRecommendations} />
        <ReportList title="Next Steps" values={plan.report.nextSteps} />
      </div>

      <ImplementationChecklist plan={plan} />

      <div className="mt-6 rounded-md border border-ink/10 bg-white p-4">
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Budget Recommendation</h3>
        <p className="mt-3 text-sm leading-6 text-graphite">{plan.report.budgetRecommendation}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4 shadow-[0_10px_28px_rgba(7,27,51,0.035)]">
      <p className="text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "Ready" | "Needs Work" | "Not Recommended" }) {
  const className =
    status === "Ready"
      ? "bg-teal-50 text-teal-700 border-teal-200"
      : status === "Needs Work"
        ? "bg-teal-50 text-copper border-flame/20"
        : "bg-slate-100 text-graphite border-ink/10";

  return (
    <span className={`rounded-lg border px-2 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function ForecastPanel({ plan }: { plan: PpcPlan }) {
  const forecast = plan.roiForecast;

  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Budget & ROI Forecast</h3>
      <div className="mt-3 rounded-md border border-ink/10 bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <ForecastMetric label="Clicks" value={String(forecast.estimatedClicks)} />
          <ForecastMetric label="Leads" value={String(forecast.estimatedLeads)} />
          <ForecastMetric label="Cost / Lead" value={`$${forecast.estimatedCostPerLead}`} />
          <ForecastMetric label="Booked Jobs" value={String(forecast.estimatedBookedJobs)} />
          <ForecastMetric label="Revenue Low" value={`$${forecast.estimatedRevenueLow.toLocaleString()}`} />
          <ForecastMetric label="Revenue High" value={`$${forecast.estimatedRevenueHigh.toLocaleString()}`} />
          <ForecastMetric label="ROI Low" value={`${forecast.simpleRoiLow}x`} />
          <ForecastMetric label="ROI High" value={`${forecast.simpleRoiHigh}x`} />
        </div>
        <ul className="mt-4 space-y-2">
          {forecast.notes.map((note) => (
            <li className="text-xs leading-5 text-graphite/70" key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ForecastMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-frost px-3 py-2">
      <p className="text-lg font-black text-ink">{value}</p>
      <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-graphite/60">{label}</p>
    </div>
  );
}

function ImplementationChecklist({ plan }: { plan: PpcPlan }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Implementation Checklist</h3>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {plan.implementationChecklist.map((item) => (
          <article className="rounded-md border border-ink/10 bg-frost p-3" key={`${item.category}-${item.item}`}>
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-black text-ink">{item.category}</h4>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm font-bold text-graphite">{item.item}</p>
            <p className="mt-2 text-sm leading-5 text-graphite/70">{item.notes}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PpcTable({
  columns,
  rows,
  title,
}: {
  columns: string[];
  rows: string[][];
  title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">{title}</h3>
      <div className="mt-3 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_10px_28px_rgba(7,27,51,0.035)]">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="bg-[#f7f1f2] text-graphite/80">
            <tr>
              {columns.map((column) => (
                <th className="px-3 py-3 font-black" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-t border-ink/10" key={`${title}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td className="truncate px-3 py-3 font-medium text-graphite" key={`${cell}-${cellIndex}`} title={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">{title}</h3>
      <ul className="mt-3 space-y-2">
        {values.map((value) => (
          <li className="rounded-md bg-frost px-3 py-2 text-sm leading-5 text-graphite" key={value}>
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeoAnalysisPanel({ analysis }: { analysis: BusinessProfile }) {
  const seo = analysis.seoAnalysis;

  return (
    <Panel>
      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-ink">
            <Search className="size-5" aria-hidden="true" />
            Google Search
          </h2>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            What is helping or hurting this contractor when homeowners search locally.
          </p>
        </div>
        <ScoreBadge label="Search" score={seo.score} />
      </div>

      <div className="mt-5 grid gap-3">
        <InfoRow label="Google Page Title" value={seo.titleTag || "Not found"} />
        <InfoRow label="Google Preview Text" value={seo.metaDescription || "Not found"} />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <CompactList title="Local Search Gaps" values={seo.localSeoGaps} emptyText="No major local search gaps found." />
        <CompactList title="Website Issues" values={seo.technicalIssues} emptyText="No visible website issues found." />
        <CompactList title="Pages and Content to Add" values={seo.contentOpportunities} emptyText="No content opportunities found." />
      </div>

      <KeywordUpdateList className="mt-6" values={seo.keywordUpdates} />

      <FixList
        className="mt-6"
        emptyText="No search fixes returned."
        title="Recommended Search Fixes"
        values={seo.recommendedFixes}
      />

      <div className="mt-6 border-t border-ink/10 pt-5">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-graphite/65">
          <FileSearch className="size-4" aria-hidden="true" />
          Pages to Build
        </h3>
        <div className="mt-3 grid gap-3">
          {seo.recommendedPages.length ? (
            seo.recommendedPages.map((page) => (
              <article className="rounded-md border border-ink/10 bg-frost p-3" key={`${page.title}-${page.slug}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-black text-ink">{page.title || "Untitled page"}</h4>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-copper">{page.priority}</span>
                </div>
                <p className="mt-2 font-mono text-xs font-bold text-graphite/70">{page.slug || "/recommended-page"}</p>
                <p className="mt-2 text-sm leading-5 text-graphite">{page.searchIntent}</p>
                <p className="mt-2 text-sm leading-5 text-graphite/70">{page.rationale}</p>
              </article>
            ))
          ) : (
            <p className="text-sm font-medium text-graphite/65">No page recommendations returned.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function AiSeoAnalysisPanel({ analysis }: { analysis: BusinessProfile }) {
  const aiSeo = analysis.aiSeoAnalysis;

  return (
    <Panel>
      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-ink">
            <Bot className="size-5" aria-hidden="true" />
            Get Found in AI
          </h2>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            How easy it is for tools like ChatGPT, Google AI, and voice assistants to understand the company and recommend it to homeowners.
          </p>
        </div>
        <ScoreBadge label="AI" score={aiSeo.score} />
      </div>

      <div className="mt-5 rounded-md border border-ink/10 bg-frost p-4">
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Can AI Understand This Business?</h3>
        <p className="mt-3 text-sm leading-6 text-graphite">{aiSeo.answerEngineReadiness || "No AI search summary returned."}</p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <CompactList title="Proof AI Can Use" values={aiSeo.citationOpportunities} emptyText="No proof opportunities returned." />
        <CompactList title="Website Info to Make Clearer" values={aiSeo.schemaRecommendations} emptyText="No website clarity recommendations returned." />
        <CompactList title="Homeowner Questions to Answer" values={aiSeo.faqQuestions} emptyText="No homeowner questions returned." />
        <CompactList title="Missing Trust Details" values={aiSeo.entityGaps} emptyText="No missing trust details returned." />
      </div>

      <FixList
        className="mt-6"
        emptyText="No AI search fixes returned."
        title="Recommended AI Search Fixes"
        values={aiSeo.recommendedFixes}
      />
    </Panel>
  );
}

function KeywordUpdateList({
  className = "",
  values,
}: {
  className?: string;
  values: BusinessProfile["seoAnalysis"]["keywordUpdates"];
}) {
  return (
    <div className={`border-t border-ink/10 pt-5 ${className}`}>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">
        Search Terms to Use on Existing Pages
      </h3>
      {values.length ? (
        <div className="mt-3 grid gap-3">
          {values.map((item) => (
            <article
              className="rounded-md border border-ink/10 bg-white p-3"
              key={`${item.page}-${item.currentText}-${item.suggestedText}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-frost px-2 py-1 text-xs font-black text-copper">
                  {item.page || "Existing page"}
                </span>
              </div>
              {item.currentText && (
                <p className="mt-3 text-sm leading-5 text-graphite/70">
                  Current wording: <span className="font-bold text-graphite">{item.currentText}</span>
                </p>
              )}
              <p className="mt-2 text-sm leading-5 text-graphite">
                Use this wording: <span className="font-black text-ink">{item.suggestedText}</span>
              </p>
              <p className="mt-2 text-sm leading-5 text-graphite/70">{item.reason}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium text-graphite/65">
          No existing-page search term changes returned.
        </p>
      )}
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl bg-ink px-4 py-3 text-center text-white shadow-[0_14px_35px_rgba(7,27,51,0.18)]">
      <p className="text-3xl font-black leading-none">{Math.round(score)}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/70">{label}</p>
    </div>
  );
}

function CompactList({
  emptyText,
  title,
  values,
}: {
  emptyText: string;
  title: string;
  values: string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">{title}</h3>
      {values.length ? (
        <ul className="mt-3 space-y-2">
          {values.map((value) => (
            <li className="rounded-md bg-frost px-3 py-2 text-sm leading-5 text-graphite" key={value}>
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm font-medium text-graphite/65">{emptyText}</p>
      )}
    </div>
  );
}

function FixList({
  className = "",
  emptyText,
  title,
  values,
}: {
  className?: string;
  emptyText: string;
  title: string;
  values: BusinessProfile["seoAnalysis"]["recommendedFixes"];
}) {
  return (
    <div className={`border-t border-ink/10 pt-5 ${className}`}>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">{title}</h3>
      {values.length ? (
        <div className="mt-3 grid gap-3">
          {values.map((item) => (
            <article className="rounded-md border border-ink/10 bg-white p-3" key={`${item.problem}-${item.fix}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-frost px-2 py-1 text-xs font-black text-copper">{item.priority}</span>
                <span className="rounded-md bg-frost px-2 py-1 text-xs font-black text-graphite">{item.effort}</span>
              </div>
              <p className="mt-3 text-sm font-black text-ink">{item.problem}</p>
              <p className="mt-2 text-sm leading-5 text-graphite">{item.fix}</p>
              <p className="mt-2 text-sm leading-5 text-graphite/70">{item.impact}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium text-graphite/65">{emptyText}</p>
      )}
    </div>
  );
}

function ProfileEditor({
  analysis,
  onListChange,
  onUpdate,
}: {
  analysis: BusinessProfile;
  onListChange: (
    field: "services" | "serviceAreas" | "differentiators" | "topGrowthOpportunities",
    value: string,
  ) => void;
  onUpdate: <K extends keyof BusinessProfile>(field: K, value: BusinessProfile[K]) => void;
}) {
  return (
    <Panel>
      <div className="mb-5">
        <h2 className="text-lg font-black text-ink">Review Business Profile</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/70">
          Correct anything the scan missed. Campaign copy and creative use this profile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Company Name" value={analysis.companyName} onChange={(value) => onUpdate("companyName", value)} />
        <TextField label="Phone" value={analysis.phone} onChange={(value) => onUpdate("phone", value)} />
        <TextField label="Email" value={analysis.email} onChange={(value) => onUpdate("email", value)} />
        <TextField label="Brand Tone" value={analysis.brandTone} onChange={(value) => onUpdate("brandTone", value)} />
        <TextField className="md:col-span-2" label="Logo URL" value={analysis.logoUrl} onChange={(value) => onUpdate("logoUrl", value)} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ToggleField
          checked={analysis.financingMentioned}
          label="Financing"
          onChange={(value) => onUpdate("financingMentioned", value)}
        />
        <ToggleField
          checked={analysis.emergencyServiceMentioned}
          label="Emergency Service"
          onChange={(value) => onUpdate("emergencyServiceMentioned", value)}
        />
        <ToggleField
          checked={analysis.maintenancePlanMentioned}
          label="Maintenance Plans"
          onChange={(value) => onUpdate("maintenancePlanMentioned", value)}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ListField label="Services" values={analysis.services} onChange={(value) => onListChange("services", value)} />
        <ListField label="Service Areas" values={analysis.serviceAreas} onChange={(value) => onListChange("serviceAreas", value)} />
        <ListField label="Differentiators" values={analysis.differentiators} onChange={(value) => onListChange("differentiators", value)} />
        <ListField label="Growth Opportunities" values={analysis.topGrowthOpportunities} onChange={(value) => onListChange("topGrowthOpportunities", value)} />
      </div>
    </Panel>
  );
}

function AnalysisQualityPanel({
  readinessItems,
  readinessScore,
  scrapedPages,
}: {
  readinessItems: ReadinessItem[];
  readinessScore: number;
  scrapedPages: AnalyzedPage[];
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="text-lg font-black text-ink">Launch Readiness</h2>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            A quick check of whether the profile has enough signal for a useful campaign.
          </p>
        </div>
        <div className="rounded-md bg-ink px-4 py-3 text-center text-white">
          <p className="text-3xl font-black leading-none">{readinessScore}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/70">ready</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {readinessItems.map((item) => (
          <div className="flex gap-3 rounded-md border border-ink/10 bg-frost p-3" key={item.label}>
            <CheckCircle2
              className={`mt-0.5 size-4 shrink-0 ${item.complete ? "text-green-600" : "text-graphite/35"}`}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-black text-ink">{item.label}</p>
              <p className="mt-1 text-sm leading-5 text-graphite/70">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-graphite/65">Pages Analyzed</h3>
        <div className="mt-3 space-y-2">
          {scrapedPages.length ? (
            scrapedPages.map((page) => (
              <a
                className="block rounded-md border border-ink/10 bg-white px-3 py-2 text-sm transition hover:border-flame/40 hover:bg-flame/5"
                href={page.url}
                key={`${page.label}-${page.url}`}
                rel="noreferrer"
                target="_blank"
              >
                <span className="font-black text-ink">{page.label}</span>
                <span className="ml-2 text-graphite/70">{page.title || page.url}</span>
              </a>
            ))
          ) : (
            <p className="text-sm font-medium text-graphite/65">No page details returned.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function TextField({
  className = "",
  label,
  onChange,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <input
        className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ListField({
  label,
  onChange,
  values,
}: {
  label: string;
  onChange: (value: string) => void;
  values: string[];
}) {
  return (
    <label className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        className="min-h-28 w-full resize-y rounded-md border border-ink/15 bg-white px-3 py-3 text-sm leading-5 text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
        onChange={(event) => onChange(event.target.value)}
        value={values.join("\n")}
      />
    </label>
  );
}

function ToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-md border border-ink/10 bg-frost px-3">
      <input
        checked={checked}
        className="size-4 accent-flame"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="text-sm font-bold text-ink">{label}</span>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-ink/10 pt-4 first:border-t-0 first:pt-0">
      <dt className="font-semibold text-graphite/68">{label}</dt>
      <dd className="max-w-[16rem] break-words text-right font-bold text-ink">{value}</dd>
    </div>
  );
}

function ChipList({
  icon,
  label,
  values,
}: {
  icon?: React.ReactNode;
  label: string;
  values: string[];
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-graphite/65">
        {icon}
        {label}
      </h2>
      <div className="flex flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <span className="rounded-md bg-frost px-3 py-2 text-sm font-semibold text-ink" key={value}>
              {value}
            </span>
          ))
        ) : (
          <span className="text-sm font-medium text-graphite/65">None found</span>
        )}
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const displayValue = toHexColor(value) || "#111827";

  return (
    <div className="rounded-lg border border-ink/10 bg-frost p-3">
      <div className="flex items-center gap-3">
        <input
          aria-label={`${label} color`}
          className="h-10 w-12 cursor-pointer rounded-md border border-ink/10 bg-white p-1"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={displayValue}
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">{label}</p>
          <input
            aria-label={`${label} hex value`}
            className="mt-1 h-9 w-full rounded-md border border-ink/10 bg-white px-2 font-mono text-sm font-bold text-ink outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/15"
            onChange={(event) => onChange(event.target.value)}
            placeholder="#000000"
            value={value}
          />
        </div>
      </div>
    </div>
  );
}

function toHexColor(value: string) {
  const trimmedValue = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmedValue)) return trimmedValue;
  if (/^#[0-9a-f]{3}$/i.test(trimmedValue)) {
    return `#${trimmedValue[1]}${trimmedValue[1]}${trimmedValue[2]}${trimmedValue[2]}${trimmedValue[3]}${trimmedValue[3]}`;
  }
  return "";
}

function BulletList({ values, emptyText }: { values: string[]; emptyText: string }) {
  if (!values.length) {
    return <p className="mt-4 text-sm font-medium text-graphite/65">{emptyText}</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {values.map((value) => (
        <li className="text-sm leading-6 text-graphite" key={value}>
          {value}
        </li>
      ))}
    </ul>
  );
}

function CampaignPanel({
  campaign,
  campaignImage,
}: {
  campaign: CampaignOutput;
  campaignImage: CampaignImage | null;
}) {
  return (
    <Panel className="mt-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-flame text-white">
          <Megaphone className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-black text-ink">Campaign Output</h2>
          <p className="text-sm font-medium text-graphite/70">Generated from the analyzed business profile.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CampaignBlock title="Facebook ad" value={campaign.facebookAd} />
        <CampaignBlock title="Google Business Profile post" value={campaign.googleBusinessProfilePost} />
        <CampaignBlock title="Email campaign" value={campaign.emailCampaign} />
        <CampaignBlock title="Google search page idea" value={campaign.seoPageRecommendation} />
        <CampaignBlock title="AI search idea" value={campaign.aiSeoRecommendation} />
        <CampaignBlock
          title="Landing page hero section"
          value={[
            campaign.landingPageHero.headline,
            campaign.landingPageHero.subheadline,
            campaign.landingPageHero.primaryCta,
            ...campaign.landingPageHero.supportingBullets.map((bullet) => `- ${bullet}`),
          ].join("\n\n")}
        />
      </div>

      {campaignImage && <CampaignImagePreview campaignImage={campaignImage} />}
    </Panel>
  );
}

function CampaignImagePreview({ campaignImage }: { campaignImage: CampaignImage }) {
  return (
    <div className="mt-6 border-t border-ink/10 pt-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-black text-ink">Campaign Hero Ad</h3>
          <p className="text-sm font-medium text-graphite/70">
            Microf-style hero creative with a generated contractor image, brand-color overlays, proof points, and logo when available.
          </p>
        </div>
        <a
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:bg-frost"
          download={campaignImage.fileName}
          href={campaignImage.dataUrl}
        >
          <Download className="size-4" aria-hidden="true" />
          Download Image
        </a>
      </div>
      <div className="overflow-hidden rounded-lg border border-ink/10 bg-frost">
        <img
          className="block w-full object-contain"
          style={{ aspectRatio: `${campaignImage.width} / ${campaignImage.height}` }}
          src={campaignImage.dataUrl}
          alt="Generated campaign creative"
        />
      </div>
    </div>
  );
}

function CampaignBlock({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-frost p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-copper">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-graphite">{value}</p>
    </article>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {message}
    </p>
  );
}

function buildReadinessItems(profile: BusinessProfile): ReadinessItem[] {
  const hasAcquisitionHook =
    profile.financingMentioned || profile.emergencyServiceMentioned || profile.maintenancePlanMentioned;

  return [
    {
      complete: Boolean(profile.companyName && profile.phone),
      label: "Contact path",
      detail: profile.phone ? "Phone number is ready for campaign CTAs." : "Add a phone number before launch.",
    },
    {
      complete: profile.services.length > 0,
      label: "Service focus",
      detail: profile.services.length
        ? `${profile.services.slice(0, 3).join(", ")} will shape the campaign offer.`
        : "Add at least one service so the campaign has a clear target.",
    },
    {
      complete: profile.serviceAreas.length > 0,
      label: "Local targeting",
      detail: profile.serviceAreas.length
        ? `${profile.serviceAreas.slice(0, 3).join(", ")} can anchor local ads and search pages.`
        : "Add service areas for local ad and search recommendations.",
    },
    {
      complete: Boolean(profile.logoUrl && toHexColor(profile.primaryColor)),
      label: "Brand assets",
      detail: profile.logoUrl
        ? "Logo and brand colors are available for creative."
        : "Add a logo URL if one was missed by the scan.",
    },
    {
      complete: profile.differentiators.length > 0,
      label: "Trust proof",
      detail: profile.differentiators.length
        ? "Differentiators are ready to support the ad message."
        : "Add proof points such as years in business, guarantees, reviews, or certifications.",
    },
    {
      complete: hasAcquisitionHook,
      label: "Conversion hook",
      detail: hasAcquisitionHook
        ? "Financing, emergency, or maintenance-plan messaging gives the campaign a sharper hook."
        : "Consider adding financing, emergency service, or maintenance-plan messaging.",
    },
    {
      complete:
        profile.seoAnalysis.score >= 60 &&
        profile.seoAnalysis.recommendedPages.length > 0 &&
        profile.seoAnalysis.recommendedFixes.length > 0,
      label: "Google search plan",
      detail: profile.seoAnalysis.recommendedPages.length
        ? "Local search page ideas and fixes are ready to support the campaign."
        : "Add local search page targets before relying on Google traffic.",
    },
    {
      complete:
        profile.aiSeoAnalysis.score >= 60 &&
        profile.aiSeoAnalysis.faqQuestions.length > 0 &&
        profile.aiSeoAnalysis.recommendedFixes.length > 0,
      label: "AI search plan",
      detail: profile.aiSeoAnalysis.faqQuestions.length
        ? "Homeowner questions, missing trust details, and fixes are ready for AI search content."
        : "Add homeowner FAQs and trust details so AI tools can understand the business.",
    },
  ];
}

function buildClientHealth(analysis: BusinessProfile, ppcPlan: PpcPlan | null) {
  const tracking = analysis.phone ? 70 : 25;
  const seo = analysis.seoAnalysis.score;
  const ppc = ppcPlan ? avg(ppcPlan.recommendedLaunchPlan.map((item) => item.priorityScore)) : 25;
  const gbp = analysis.aiSeoAnalysis.citationOpportunities.length ? 70 : 45;
  const crm = 25;
  const website = analysis.growthScore;
  const ai = analysis.aiSeoAnalysis.score;
  const score = Math.round(avg([tracking, seo, ppc, gbp, crm, website, ai]));
  const color = score >= 75 ? "Green" : score >= 50 ? "Yellow" : "Red";
  return { score, color: color as "Green" | "Yellow" | "Red" };
}

function buildTasks(analysis: BusinessProfile, ppcPlan: PpcPlan | null) {
  return [
    { title: "Install GTM", priority: "High", detail: "Confirm Google Tag Manager is installed before launch." },
    { title: "Connect HighLevel", priority: "High", detail: "Connect forms, call tracking, pipeline stages, and automations." },
    { title: "Verify Google Ads", priority: "High", detail: ppcPlan ? "Use Revenue Engine exports for campaign setup." : "Run Revenue Engine first." },
    { title: "Create Landing Page", priority: "Medium", detail: ppcPlan?.report.missingLandingPages[0] || "Create pages for missing revenue campaigns." },
    { title: "Improve Meta Titles", priority: "Medium", detail: analysis.seoAnalysis.keywordUpdates[0]?.suggestedText || "Use service + city phrasing on priority pages." },
    { title: "Review Search Terms", priority: "Medium", detail: "Review search terms twice weekly after launch." },
    { title: "Publish GBP Post", priority: "Low", detail: "Use weekly service, financing, maintenance, or seasonal content." },
  ];
}

function buildDeploymentCandidates(
  analysis: BusinessProfile,
  ppcPlan: PpcPlan | null,
  campaign: CampaignOutput | null,
): DeploymentCandidate[] {
  const topCampaign = ppcPlan?.recommendedLaunchPlan[0];
  const missingPage = ppcPlan?.landingPageRecommendations.find((page) => page.bestExistingLandingPage === "Recommended new page");
  const primaryCity = analysis.serviceAreas[0] || "primary service area";
  const primaryService = analysis.services[0] || "HVAC service";

  return [
    {
      id: "google-ads-paused-campaigns",
      target: "Google Ads",
      title: "Create Google Ads campaigns in PAUSED state",
      recommendation: topCampaign
        ? `Create paused Google Ads campaigns for ${topCampaign.campaign} because Revenue Engine scored it ${topCampaign.priorityScore}/100 and identified it as launch-ready.`
        : "Run Revenue Engine first, then create paused Google Ads campaigns from approved launch recommendations.",
      preview: [
        `${ppcPlan?.recommendedLaunchPlan.length ?? 0} launch campaign${ppcPlan?.recommendedLaunchPlan.length === 1 ? "" : "s"} in PAUSED state`,
        `${ppcPlan?.keywords.length ?? 0} exact and phrase keywords`,
        `${ppcPlan?.responsiveSearchAds.length ?? 0} responsive search ad assets`,
        `${ppcPlan?.negativeKeywords.length ?? 0} starter negative keywords`,
      ],
      dependencies: [
        { label: "Revenue Engine", exists: Boolean(ppcPlan), detail: ppcPlan ? "Campaign structure is available." : "Run Revenue Engine first." },
        { label: "Google Ads access", exists: false, detail: "Connect customer ID and API credentials before external creation." },
        { label: "Conversion tracking", exists: false, detail: "Confirm calls, forms, and GTM before launch review." },
      ],
      deployMode: "API target: Google Ads. Safe output: paused campaign draft until account access is connected.",
      intelligenceMemoryNote: "Stores approved campaign, paused state, validation results, and later CTR/CPC/conversion outcomes.",
    },
    {
      id: "gbp-post-draft",
      target: "Google Business Profile",
      title: "Create Google Business Profile post draft",
      recommendation: `Draft a GBP post promoting ${primaryService} in ${primaryCity} so the client has timely local content without publishing automatically.`,
      preview: [
        campaign?.googleBusinessProfilePost || `Service-focused post draft for ${primaryService}`,
        "CTA: Call or request service",
        "Status: Draft only",
      ],
      dependencies: [
        { label: "Business profile", exists: Boolean(analysis.companyName), detail: "Business name is available." },
        { label: "GBP access", exists: false, detail: "Connect or verify GBP permissions before API draft creation." },
      ],
      deployMode: "API target: Google Business Profile. Safe output: post draft only.",
      intelligenceMemoryNote: "Stores draft topic, service focus, and later profile activity or review response signals.",
    },
    {
      id: "highlevel-automation-draft",
      target: "HighLevel / CRM",
      title: "Create HighLevel automation draft",
      recommendation: "Create a speed-to-lead and missed-call follow-up automation draft so CRM operations are ready before campaigns are enabled.",
      preview: [
        "Trigger: new form lead or missed call",
        "Step 1: immediate SMS follow-up",
        "Step 2: internal notification",
        "Step 3: estimate follow-up sequence",
      ],
      dependencies: [
        { label: "HighLevel access", exists: false, detail: "Connect location and API token before external draft creation." },
        { label: "Phone tracking", exists: Boolean(analysis.phone), detail: analysis.phone ? "Phone number detected." : "Add phone number." },
      ],
      deployMode: "API target: HighLevel. Safe output: automation draft only.",
      intelligenceMemoryNote: "Stores automation draft, CRM dependency status, and later response-time or pipeline changes.",
    },
    {
      id: "landing-page-draft",
      target: "Website / Landing Pages",
      title: "Generate landing page draft",
      recommendation: missingPage
        ? `Generate a draft landing page for ${missingPage.campaign} because Revenue Engine found no strong existing destination.`
        : "Generate a draft campaign landing page from the strongest existing Revenue Engine recommendation.",
      preview: [
        missingPage?.suggestedPageTitle || `${analysis.companyName} ${primaryService} landing page`,
        missingPage?.suggestedH1 || `${primaryService} in ${primaryCity}`,
        missingPage?.suggestedCta || "Request Service",
        missingPage?.metaDescription || "Draft SEO meta description based on service, city, and offer context.",
      ],
      dependencies: [
        { label: "Landing page recommendation", exists: Boolean(ppcPlan?.landingPageRecommendations.length), detail: ppcPlan ? "Landing page intelligence is available." : "Run Revenue Engine first." },
        { label: "Website access", exists: false, detail: "Connect CMS, repo, or page builder before publishing." },
      ],
      deployMode: "Publishing target: website CMS or repo. Safe output: draft page only.",
      intelligenceMemoryNote: "Stores page draft, target service, missing-page reason, and later conversion/page-performance changes.",
    },
    {
      id: "social-post-draft",
      target: "Social Media",
      title: "Create social media post draft",
      recommendation: `Create an owner-friendly social post about ${primaryService} so trust-building content supports current demand without overpromising results.`,
      preview: [
        campaign?.facebookAd || `Post idea: homeowner tip for ${primaryService} in ${primaryCity}`,
        "Creative angle: practical service education",
        "Status: Draft only",
      ],
      dependencies: [
        { label: "Social account access", exists: false, detail: "Connect Facebook/Instagram pages before scheduling or posting." },
        { label: "Brand voice", exists: Boolean(analysis.brandTone), detail: analysis.brandTone ? "Brand tone detected." : "Confirm tone before posting." },
      ],
      deployMode: "API target: social scheduler. Safe output: post draft only.",
      intelligenceMemoryNote: "Stores post topic, channel readiness, and later engagement or lead-assist observations.",
    },
    {
      id: "seo-update-draft",
      target: "SEO",
      title: "Create SEO update draft",
      recommendation: analysis.seoAnalysis.keywordUpdates.length
        ? "Create a metadata and on-page SEO update draft from the highest-priority audit gaps."
        : "Create a baseline SEO improvement draft using detected services, cities, and AI search readiness gaps.",
      preview: [
        analysis.seoAnalysis.keywordUpdates[0]?.suggestedText || `Title idea: ${primaryService} in ${primaryCity}`,
        analysis.seoAnalysis.metaDescription || "Meta description draft from service-area and conversion context.",
        `${analysis.aiSeoAnalysis.schemaRecommendations.length} schema recommendation${analysis.aiSeoAnalysis.schemaRecommendations.length === 1 ? "" : "s"}`,
      ],
      dependencies: [
        { label: "Website audit", exists: true, detail: "Current audit and SEO signals are loaded." },
        { label: "Website access", exists: false, detail: "Connect CMS or repo before publishing SEO changes." },
      ],
      deployMode: "Publishing target: website CMS or repo. Safe output: SEO draft only.",
      intelligenceMemoryNote: "Stores SEO draft, target pages, and later ranking, traffic, and AI visibility movement.",
    },
    {
      id: "report-draft",
      target: "Reports",
      title: "Generate launch report draft",
      recommendation: "Create a launch report draft so the owner can review what is ready, what is blocked, and what needs approval before live deployment.",
      preview: [
        `Client: ${analysis.companyName || "HVAC client"}`,
        `Revenue Engine: ${ppcPlan ? "Complete" : "Not generated"}`,
        `Campaign creative: ${campaign ? "Available" : "Not generated"}`,
        "Status: Draft report only",
      ],
      dependencies: [
        { label: "Website audit", exists: true, detail: "Current client analysis is loaded." },
        { label: "Revenue Engine", exists: Boolean(ppcPlan), detail: ppcPlan ? "Launch recommendations are available." : "Run Revenue Engine for richer reporting." },
      ],
      deployMode: "Report output: draft HTML/PDF-ready report.",
      intelligenceMemoryNote: "Stores launch summary and follow-up outcomes for future monthly and quarterly reports.",
    },
  ];
}

function validateDeployment(candidate: DeploymentCandidate) {
  const missing = candidate.dependencies.filter((dependency) => !dependency.exists).map((dependency) => dependency.label);
  return { ready: missing.length === 0, missing };
}

function buildImplementationChannels(
  candidates: DeploymentCandidate[],
  records: Record<string, DeploymentRecord>,
): ImplementationChannel[] {
  const targets: DeploymentTarget[] = [
    "Google Ads",
    "Google Business Profile",
    "Social Media",
    "Website / Landing Pages",
    "SEO",
    "HighLevel / CRM",
    "Reports",
  ];

  return targets.map((target) => {
    const channelCandidates = candidates.filter((candidate) => candidate.target === target);
    const topCandidate = channelCandidates[0];
    const channelRecords = channelCandidates
      .map((candidate) => records[candidate.id])
      .filter((record): record is DeploymentRecord => Boolean(record));
    const latestSuccess = channelRecords
      .filter((record) => record.runtimeStatus === "Success")
      .sort((a, b) => Date.parse(b.deployedAt ?? "") - Date.parse(a.deployedAt ?? ""))[0];
    const failedRecord = channelRecords.find((record) => record.runtimeStatus === "Failed");
    const pendingDeployments = channelCandidates.filter((candidate) => {
      const record = records[candidate.id];
      return record?.runtimeStatus !== "Success" && record?.approvalStatus !== "Dismissed";
    }).length;
    const requiredIntegrations = uniqueStrings(channelCandidates.flatMap((candidate) => candidate.dependencies.map((dependency) => dependency.label)));
    const blockingIssues = uniqueStrings(channelCandidates.flatMap((candidate) => candidate.dependencies.filter((dependency) => !dependency.exists).map((dependency) => dependency.detail)));
    const approvedReady = channelCandidates.some((candidate) => records[candidate.id]?.approvalStatus === "Approved" && validateDeployment(candidate).ready);
    const pendingReview = channelCandidates.some((candidate) => !records[candidate.id] || records[candidate.id]?.approvalStatus === "Pending" || records[candidate.id]?.approvalStatus === "Remind Later");

    let status: ChannelStatus = "Pending Review";
    if (failedRecord) status = "Failed";
    else if (latestSuccess) status = "Deployed";
    else if (blockingIssues.length) status = "Needs Setup";
    else if (approvedReady) status = "Ready";
    else if (pendingReview) status = "Pending Review";

    return {
      target,
      status,
      pendingDeployments,
      topRecommendedDeployment: topCandidate?.title ?? "No deployment candidate available yet.",
      requiredIntegrations,
      blockingIssues,
      lastDeployedItem: latestSuccess ? `${latestSuccess.title} on ${new Date(latestSuccess.deployedAt ?? "").toLocaleDateString()}` : "Nothing deployed yet",
      candidate: topCandidate,
    };
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function downloadJson(fileName: string, payload: unknown) {
  if (typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function updateDeploymentRecord(
  existing: DeploymentRecord | undefined,
  candidate: DeploymentCandidate,
  update: {
    approvalStatus: DeploymentApprovalStatus;
    runtimeStatus: DeploymentRuntimeStatus;
    event: string;
    log: string;
    deployedAt?: string;
    deployedBy?: string;
  },
): DeploymentRecord {
  const now = new Date().toISOString();
  const actor = currentActor();
  const base: DeploymentRecord = existing ?? {
    id: candidate.id,
    deploymentId: `dep-${candidate.id}-${Date.now()}`,
    target: candidate.target,
    title: candidate.title,
    approvalStatus: "Pending",
    runtimeStatus: "Waiting",
    log: [`Recommendation created for ${candidate.target}.`],
    history: [],
  };

  return {
    ...base,
    approvalStatus: update.approvalStatus,
    runtimeStatus: update.runtimeStatus,
    log: [
      `${new Date(now).toLocaleString()}: ${update.log}`,
      ...base.log,
    ].slice(0, 8),
    history: [
      { date: now, actor, event: update.event },
      ...base.history,
    ].slice(0, 12),
    deployedAt: update.deployedAt,
    deployedBy: update.deployedBy,
  };
}

function deploymentMemoryKey(analysis: BusinessProfile, contractorUrl: string) {
  return `hvac-growth-os:deploy-center:${domainLabel(contractorUrl || analysis.companyName || "client")}`;
}

function loadDeploymentMemory(key: string): Record<string, DeploymentRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DeploymentRecord>;
  } catch {
    return {};
  }
}

function saveDeploymentMemory(key: string, records: Record<string, DeploymentRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(records));
}

function currentActor() {
  return "Current user";
}

function googleAdsDeployItems(ppcPlan: PpcPlan | null) {
  return [
    { label: "Generate Campaign", status: ppcPlan ? "Ready" as const : "Needs Work" as const, detail: ppcPlan ? `${ppcPlan.recommendedLaunchPlan.length} launch campaigns ready.` : "Run Revenue Engine first." },
    { label: "Download Google Ads Editor CSV", status: ppcPlan ? "Ready" as const : "Needs Work" as const, detail: "Campaign structure export." },
    { label: "Download Keyword CSV", status: ppcPlan ? "Ready" as const : "Needs Work" as const, detail: "Exact and phrase match keywords." },
    { label: "Download Negative Keywords", status: ppcPlan ? "Ready" as const : "Needs Work" as const, detail: "Starter HVAC negative list." },
    { label: "Download Assets", status: ppcPlan ? "Ready" as const : "Needs Work" as const, detail: "RSAs, callouts, sitelinks, and snippets." },
  ];
}

function landingPageDeployItems(ppcPlan: PpcPlan | null) {
  return [
    { label: "Generate Landing Pages", status: ppcPlan ? "Ready" as const : "Needs Work" as const, detail: "Use missing page recommendations." },
    { label: "Export HTML", status: "Needs Work" as const, detail: "Next phase: render page files from recommendations." },
    { label: "Export React Components", status: "Needs Work" as const, detail: "Next phase: componentized landing-page output." },
  ];
}

function seoDeployItems(analysis: BusinessProfile) {
  return [
    { label: "Generate Meta Titles", status: analysis.seoAnalysis.keywordUpdates.length ? "Ready" as const : "Needs Work" as const, detail: `${analysis.seoAnalysis.keywordUpdates.length} keyword updates found.` },
    { label: "Generate Meta Descriptions", status: analysis.seoAnalysis.metaDescription ? "Ready" as const : "Needs Work" as const, detail: "Use audit preview and page recommendations." },
    { label: "Generate Schema", status: "Ready" as const, detail: "Business, service, FAQ, review, and local details." },
    { label: "Generate City Pages", status: analysis.serviceAreas.length ? "Ready" as const : "Needs Work" as const, detail: `${analysis.serviceAreas.length} service areas detected.` },
  ];
}

function gbpDeployItems(analysis: BusinessProfile) {
  return [
    { label: "Generate Service List", status: analysis.services.length ? "Ready" as const : "Needs Work" as const, detail: `${analysis.services.length} services detected.` },
    { label: "Generate Description", status: analysis.brandTone ? "Ready" as const : "Needs Work" as const, detail: "Use brand tone and differentiators." },
    { label: "Generate Q&A", status: analysis.aiSeoAnalysis.faqQuestions.length ? "Ready" as const : "Needs Work" as const, detail: `${analysis.aiSeoAnalysis.faqQuestions.length} homeowner questions.` },
    { label: "Generate Weekly Posts", status: "Ready" as const, detail: "Use service, financing, maintenance, and seasonal content." },
  ];
}

function highLevelDeployItems() {
  return [
    { label: "Generate Snapshot Checklist", status: "Ready" as const, detail: "Tracking, forms, pipeline, automations, and reporting." },
    { label: "Pipeline Recommendations", status: "Ready" as const, detail: "New lead, estimate set, sold, lost, maintenance nurture." },
    { label: "Automation Recommendations", status: "Ready" as const, detail: "Speed-to-lead, missed-call text back, and estimate follow-up." },
  ];
}

function reportDeployItems(campaign: CampaignOutput | null) {
  return [
    { label: "Launch Report", status: "Ready" as const, detail: "Workspace summary, priorities, and implementation checklist." },
    { label: "Weekly Report", status: campaign ? "Ready" as const : "Needs Work" as const, detail: "Use generated campaign and Revenue Engine data." },
    { label: "Monthly Report", status: "Ready" as const, detail: "Executive summary with SEO, AI, PPC, and task status." },
    { label: "Quarterly Review", status: "Ready" as const, detail: "Growth review, budget shifts, and next campaign bets." },
  ];
}

function buildAiCmoBrief(
  analysis: BusinessProfile,
  contractorUrl: string,
  ppcPlan: PpcPlan | null,
  memory: IntelligenceSnapshot[],
  crmFunnel?: RevenueFunnelPayload,
  googleAdsClicks = 0,
) {
  const marketing = buildMarketingIntelligence(analysis, ppcPlan, defaultMarketingSignals(analysis, ppcPlan));
  const market = buildMarketIntelligence(analysis, contractorUrl, ppcPlan, {
    seedUrls: [],
    searchTerms: [`AC repair ${analysis.serviceAreas[0] || "Lawrenceville"} GA`],
    marketSize: 24,
  });
  const revenueScore = ppcPlan ? Math.round(avg(ppcPlan.campaignReadiness.map((item) => item.priorityScore))) : 35;
  const hasCrmData = Boolean(crmFunnel && (crmFunnel.leads || crmFunnel.pipelineValue || crmFunnel.revenue));
  const trackingScore = Math.round(avg([
    analysis.phone ? 80 : 25,
    ppcPlan ? 72 : 30,
    analysis.aiSeoAnalysis.citationOpportunities.length ? 68 : 42,
    hasCrmData ? 82 : 25,
  ]));
  const todayScore = clampScore(Math.round(avg([
    marketing.hvacDemandIndex,
    analysis.seoAnalysis.score,
    analysis.aiSeoAnalysis.score,
    revenueScore,
    trackingScore,
  ])));
  const memoryScore = clampScore(35 + Math.min(memory.length * 12, 45) + (memory.length >= 2 ? 12 : 0));
  const topService = marketing.servicesToPromote[0]?.label || "AC Repair";
  const topCity = marketing.citiesToPrioritize[0]?.label || analysis.serviceAreas[0] || "Lawrenceville";
  const previous = memory[0];
  const older = memory[1];
  const historicalConfidence = memory.length >= 3 ? 16 : memory.length >= 2 ? 10 : 4;
  const baseConfidence = clampScore(62 + historicalConfidence + (ppcPlan ? 8 : 0) + (analysis.serviceAreas.length ? 5 : 0) + (hasCrmData ? 8 : 0));
  const headline = hasCrmData
    ? `Today's best opportunity is ${topService} in ${topCity} with CRM evidence from ${crmFunnel?.crmLeads ?? crmFunnel?.leads ?? 0} leads, ${crmFunnel?.phoneCalls ?? 0} phone calls, ${crmFunnel?.wonJobs ?? crmFunnel?.wonOpportunities ?? 0} won jobs, and $${Math.round(crmFunnel?.estimatedRevenue ?? crmFunnel?.revenue ?? 0).toLocaleString()} in estimated revenue.`
    : `Today's best opportunity is ${topService} in ${topCity} due to ${marketing.hvacDemandIndex >= 78 ? "high" : "moderate"} HVAC demand, seasonal urgency, and ${ppcPlan ? "active campaign readiness" : "a clear need to finish campaign setup"}.`;

  const missingPage = ppcPlan?.report.missingLandingPages.find((item) => !item.startsWith("No major"));
  const campaignToPromote = ppcPlan?.recommendedLaunchPlan[0]?.campaign || `Search | ${topService} | ${topCity}`;
  const actionConfidence = (offset = 0) => clampScore(baseConfidence + offset);
  const crmAction = buildHighLevelCmoAction(crmFunnel, googleAdsClicks, actionConfidence);
  const actions = [
    {
      priority: "High",
      action: `Increase ${topService} budget by 15% for ${topCity}`,
      reason: "Demand signals and seasonal intent favor urgent repair traffic today. Treat this as a recommendation for review, not an automatic budget change.",
      impact: "More high-intent calls",
      confidence: actionConfidence(8),
      relatedModule: "Revenue Engine",
    },
    {
      priority: "High",
      action: ppcPlan ? "Review search terms and add one negative keyword" : "Build the Revenue Engine before scaling paid search",
      reason: ppcPlan ? "Cleaning search terms protects spend when demand rises." : "Campaign readiness needs to be scored before budget decisions are useful.",
      impact: ppcPlan ? "Lower wasted spend" : "Launch readiness",
      confidence: actionConfidence(4),
      relatedModule: "Google Ads",
    },
    {
      priority: "Medium",
      action: `Publish a cooling tip for ${topCity}`,
      reason: "Weather and seasonality support practical homeowner content that can feed Facebook and GBP engagement.",
      impact: "Local engagement lift",
      confidence: actionConfidence(0),
      relatedModule: "Marketing Intelligence",
    },
    {
      priority: crmAction.priority,
      action: crmAction.action,
      reason: crmAction.reason,
      impact: crmAction.impact,
      confidence: crmAction.confidence,
      relatedModule: crmAction.relatedModule,
    },
    {
      priority: missingPage ? "High" : "Medium",
      action: missingPage ? `Create landing page for ${missingPage}` : "Request reviews from recent completed jobs",
      reason: missingPage ? "Paid clicks convert better when service-specific landing pages match intent." : "Fresh reviews strengthen paid, organic, and GBP trust.",
      impact: missingPage ? "Conversion rate lift" : "Trust signal lift",
      confidence: actionConfidence(2),
      relatedModule: missingPage ? "Deploy Center" : "Google Business Profile",
    },
  ];

  return {
    headline,
    todayScore,
    memoryScore,
    actions,
    demandSignals: [
      { label: "Temperature", value: "Planning input: 94°F" },
      { label: "Forecast", value: defaultMarketingSignals(analysis, ppcPlan).forecast },
      { label: "Heat Index / Cold Snap", value: marketing.hvacDemandIndex >= 78 ? "Elevated cooling stress" : "Moderate weather-driven demand" },
      { label: "Seasonality", value: currentHvacSeason() },
      { label: "HVAC Demand Level", value: `${marketing.hvacDemandIndex}/100` },
      { label: "Most Likely To Convert", value: `${topService} in ${topCity}` },
      { label: "Google Ads Clicks", value: googleAdsClicks ? `${googleAdsClicks} synced clicks` : "Waiting on Google Ads sync" },
      { label: "CRM Leads", value: hasCrmData ? `${crmFunnel?.crmLeads ?? crmFunnel?.leads ?? 0} synced leads` : "HighLevel not connected" },
      { label: "Phone Calls", value: hasCrmData ? `${crmFunnel?.phoneCalls ?? 0} synced calls` : "Waiting on CRM sync" },
      { label: "Pipeline Value", value: hasCrmData ? `$${Math.round(crmFunnel?.pipelineValue ?? 0).toLocaleString()}` : "Waiting on CRM sync" },
    ],
    campaignRecommendations: [
      { label: "Promote", detail: `${campaignToPromote}. Use exact and phrase match terms tied to ${topCity}.`, confidence: actionConfidence(7) },
      { label: "Pause", detail: "Pause low-intent or unsupported campaigns until tracking and landing pages are ready.", confidence: actionConfidence(-2) },
      { label: "Budget", detail: hasCrmData ? `Review budget toward the best CRM source. Current estimated revenue: $${Math.round(crmFunnel?.estimatedRevenue ?? crmFunnel?.revenue ?? 0).toLocaleString()}; pipeline: $${Math.round(crmFunnel?.pipelineValue ?? 0).toLocaleString()}. Do not apply automatically.` : "Review a 15% shift toward the highest-readiness repair campaign. Do not apply automatically.", confidence: actionConfidence(hasCrmData ? 8 : 3) },
      { label: "Cities", detail: marketing.citiesToPrioritize.slice(0, 3).map((city) => city.label).join(", "), confidence: actionConfidence(1) },
      { label: "CRM Stage", detail: hasCrmData && crmFunnel?.opportunityStages[0] ? `Watch ${crmFunnel.opportunityStages[0].stage}: ${crmFunnel.opportunityStages[0].count} opportunities, $${Math.round(crmFunnel.opportunityStages[0].value).toLocaleString()} value.` : "Connect HighLevel to see stage-level bottlenecks.", confidence: actionConfidence(hasCrmData ? 6 : -8) },
    ],
    contentRecommendations: [
      { label: "Social Post", detail: `Cooling tip for ${topCity}: signs an AC system needs service before the hottest part of the day.`, confidence: actionConfidence(0) },
      { label: "GBP Post", detail: `Post a service-area update for ${topService} with a call CTA and verified trust signals.`, confidence: actionConfidence(1) },
      { label: "Email Subject", detail: `${topCity}: Is your AC ready for this week?`, confidence: actionConfidence(-1) },
      { label: "Short Video / Reel", detail: "Technician explains three AC warning signs homeowners should not ignore.", confidence: actionConfidence(-4) },
    ],
    competitiveAlerts: [
      market.marketGaps[0],
      market.whatNobodySays[0],
      market.promotionAnalysis[0],
    ],
    operationsAlerts: [
      { label: "Google Ads Tag", status: ppcPlan ? "Needs Work" as const : "Not Recommended" as const, detail: ppcPlan ? "Verify conversion tag before approving budget increases." : "Generate campaigns first, then verify tags." },
      { label: "HighLevel Connected", status: hasCrmData ? "Ready" as const : "Needs Work" as const, detail: hasCrmData ? `CRM funnel synced: ${crmFunnel?.crmLeads ?? crmFunnel?.leads ?? 0} leads, ${crmFunnel?.phoneCalls ?? 0} calls, ${crmFunnel?.wonJobs ?? crmFunnel?.wonOpportunities ?? 0} won jobs, $${Math.round(crmFunnel?.estimatedRevenue ?? crmFunnel?.revenue ?? 0).toLocaleString()} estimated revenue.` : "CRM and pipeline metrics are not connected in this workspace yet." },
      { label: "Call Tracking", status: analysis.phone ? "Needs Work" as const : "Not Recommended" as const, detail: analysis.phone ? "Phone is detected; confirm tracked numbers and source attribution." : "Add a phone number before campaign launch." },
      { label: "Form Tracking", status: "Needs Work" as const, detail: "Confirm form submissions pass source, campaign, and service intent into CRM." },
      { label: "GBP Linked", status: analysis.aiSeoAnalysis.citationOpportunities.length ? "Needs Work" as const : "Not Recommended" as const, detail: "Link GBP data to validate post, call, direction, and review trends." },
    ],
    lessonsLearned: buildLessonsLearned(memory, analysis, marketing.hvacDemandIndex, previous, older),
    predictions: buildPredictions(memory, topService, topCity, marketing.hvacDemandIndex, baseConfidence),
  };
}

function buildHighLevelCmoAction(
  crmFunnel: RevenueFunnelPayload | undefined,
  googleAdsClicks: number,
  actionConfidence: (offset?: number) => number,
) {
  const calls = crmFunnel?.phoneCalls ?? 0;
  const crmLeads = crmFunnel?.crmLeads ?? crmFunnel?.leads ?? 0;
  const opportunities = crmFunnel?.totalOpportunities ?? 0;
  const wonJobs = crmFunnel?.wonJobs ?? crmFunnel?.wonOpportunities ?? 0;
  const missedCalls = crmFunnel?.missedCalls ?? 0;

  if (!crmFunnel) {
    return {
      action: "Connect HighLevel call tracking before scaling spend",
      confidence: actionConfidence(-8),
      impact: "Cleaner attribution",
      priority: "High",
      reason: "CRM calls, opportunities, and won jobs are not connected yet, so budget recommendations are intentionally conservative.",
      relatedModule: "HighLevel / CRM",
    };
  }

  if (missedCalls >= 3 || (calls > 0 && missedCalls / calls >= 0.2)) {
    return {
      action: "Review missed-call handling before increasing budget",
      confidence: actionConfidence(8),
      impact: "Recover lost leads",
      priority: "High",
      reason: `${missedCalls} missed calls are synced from HighLevel. Missed-call text automation should be reviewed, but not deployed automatically.`,
      relatedModule: "HighLevel / CRM",
    };
  }

  if (calls > 0 && opportunities === 0) {
    return {
      action: "Fix CRM intake so calls become opportunities",
      confidence: actionConfidence(6),
      impact: "Better lead-to-estimate tracking",
      priority: "High",
      reason: "HighLevel shows calls, but no synced opportunities. The intake process may not be creating pipeline records consistently.",
      relatedModule: "HighLevel / CRM",
    };
  }

  if (googleAdsClicks >= 30 && calls === 0) {
    return {
      action: "Review landing page call CTA and tracking numbers",
      confidence: actionConfidence(3),
      impact: "Improve click-to-call conversion",
      priority: "High",
      reason: `Google Ads has ${googleAdsClicks} synced clicks while HighLevel call volume is flat. Confirm phone CTAs and call tracking before adding budget.`,
      relatedModule: "Revenue Engine",
    };
  }

  if (wonJobs > 0) {
    return {
      action: "Review budget increase for campaigns producing won jobs",
      confidence: actionConfidence(9),
      impact: "Scale proven demand",
      priority: "High",
      reason: `HighLevel shows ${wonJobs} won job${wonJobs === 1 ? "" : "s"}. Use source and campaign attribution before approving any budget change.`,
      relatedModule: "Revenue Engine",
    };
  }

  return {
    action: "Review HighLevel lead sources before shifting budget",
    confidence: actionConfidence(5),
    impact: "Cleaner source-level ROI",
    priority: "Medium",
    reason: "CRM attribution is available. Compare calls, lead sources, and opportunity stages before changing spend.",
    relatedModule: "HighLevel / CRM",
  };
}

function buildLessonsLearned(
  memory: IntelligenceSnapshot[],
  analysis: BusinessProfile,
  demandIndex: number,
  previous?: IntelligenceSnapshot,
  older?: IntelligenceSnapshot,
) {
  if (!previous || !older) {
    return [
      {
        label: "Baseline memory started",
        detail: "AI CMO saved the first client snapshot. Future briefs will compare SEO, AI visibility, demand, campaign readiness, notes, and actions taken against this baseline.",
        confidence: 48,
      },
      {
        label: "Repair demand is the first learning focus",
        detail: `${demandIndex >= 75 ? "Current demand is high" : "Current demand is moderate"}, so the system will watch whether repair-focused actions produce stronger future scores.`,
        confidence: 54,
      },
      {
        label: "Tracking gaps limit certainty",
        detail: "Historical CTR, CPC, conversion rate, and HighLevel pipeline metrics are not connected yet, so recommendation confidence is intentionally conservative.",
        confidence: 52,
      },
    ];
  }

  return [
    {
      label: "What changed",
      detail: `SEO moved ${formatDelta(older.seoScore, previous.seoScore)}, AI visibility moved ${formatDelta(older.aiVisibilityScore, previous.aiVisibilityScore)}, and demand moved ${formatDelta(older.demandIndex, previous.demandIndex)} since the prior saved snapshot.`,
      confidence: 72,
    },
    {
      label: "What worked",
      detail: previous.recommendations.length ? `The last brief emphasized ${previous.recommendations[0]}. Repeat if lead quality improved.` : "No completed actions were saved yet. Add notes after each client review.",
      confidence: 66,
    },
    {
      label: "What to stop",
      detail: analysis.phone ? "Stop scaling campaigns without verified call/form attribution; budget decisions need source-level lead quality." : "Stop campaign launch work until a verified phone path is added.",
      confidence: 70,
    },
    {
      label: "What to repeat",
      detail: "Repeat service + city messaging when demand rises; local phrasing is one of the clearest reusable patterns for HVAC search and social.",
      confidence: 68,
    },
  ];
}

function buildPredictions(
  memory: IntelligenceSnapshot[],
  topService: string,
  topCity: string,
  demandIndex: number,
  baseConfidence: number,
) {
  const hasHistory = memory.length >= 2;
  return [
    {
      label: "Weekend heat opportunity",
      detail: `${demandIndex >= 78 ? "Forecast demand is high" : "Forecast demand is building"}. Based on current conditions${hasHistory ? " and saved client history" : ""}, review a 15-20% ${topService} budget increase for ${topCity}.`,
      confidence: clampScore(baseConfidence + (hasHistory ? 6 : -4)),
    },
    {
      label: "Monday repair call pattern",
      detail: hasHistory ? "Watch Monday call volume after weekend heat; saved demand snapshots suggest repair intent should be reviewed early in the week." : "Start tracking weekday lead volume so AI CMO can learn whether Mondays outperform after hot weekends.",
      confidence: clampScore(baseConfidence - 8),
    },
    {
      label: "Two-week replacement window",
      detail: "If repair volume rises and financing is verified, the next two weeks are a good period to test replacement consultation content.",
      confidence: clampScore(baseConfidence - 5),
    },
  ];
}

function createIntelligenceSnapshot(
  analysis: BusinessProfile,
  ppcPlan: PpcPlan | null,
  brief: ReturnType<typeof buildAiCmoBrief>,
  notes: string,
): IntelligenceSnapshot {
  const revenueScore = ppcPlan ? Math.round(avg(ppcPlan.campaignReadiness.map((item) => item.priorityScore))) : 35;
  return {
    id: `${Date.now()}`,
    date: new Date().toISOString(),
    seoScore: analysis.seoAnalysis.score,
    aiVisibilityScore: analysis.aiSeoAnalysis.score,
    growthScore: Math.round(analysis.growthScore),
    revenueScore,
    googleAdsScore: ppcPlan ? Math.round(avg(ppcPlan.recommendedLaunchPlan.map((item) => item.priorityScore))) : 30,
    gbpScore: analysis.aiSeoAnalysis.citationOpportunities.length ? 68 : 42,
    highLevelScore: 25,
    demandIndex: Number(brief.demandSignals.find((item) => item.label === "HVAC Demand Level")?.value.split("/")[0] ?? 50),
    topService: brief.demandSignals.find((item) => item.label === "Most Likely To Convert")?.value.split(" in ")[0] ?? "AC Repair",
    topCity: brief.demandSignals.find((item) => item.label === "Most Likely To Convert")?.value.split(" in ")[1] ?? "Primary market",
    weather: brief.demandSignals.find((item) => item.label === "Temperature")?.value ?? "Not connected",
    forecast: brief.demandSignals.find((item) => item.label === "Forecast")?.value ?? "Not connected",
    recommendations: brief.actions.map((action) => action.action),
    actionsTaken: notes ? linesToList(notes) : [],
    notes,
  };
}

function loadIntelligenceMemory(key: string): IntelligenceSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IntelligenceSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIntelligenceMemory(key: string, memory: IntelligenceSnapshot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(memory));
}

function intelligenceMemoryKey(analysis: BusinessProfile, contractorUrl: string) {
  return `hvac-growth-os:intelligence-memory:${domainLabel(contractorUrl || analysis.companyName || "client")}`;
}

function defaultMarketingSignals(analysis: BusinessProfile, ppcPlan: PpcPlan | null) {
  const city = analysis.serviceAreas[0] || "primary market";
  return {
    currentWeather: "Warm, humid, and uncomfortable during peak afternoon hours",
    forecast: "7-day forecast favors higher cooling demand with scattered storms",
    seasonality: currentHvacSeason(),
    googleTrends: `AC repair and HVAC repair interest rising around ${city}`,
    adsPerformance: ppcPlan ? "Revenue Engine campaigns are ready for launch review" : "Google Ads data not connected yet",
    searchVolume: "High cooling-season search demand",
    competitorObservations: "Nearby contractors are pushing repair speed, financing, and maintenance offers",
    websiteAnalytics: "Service pages and contact paths should be watched for conversion lift",
    crmLeadVolume: 12,
    campaignPerformance: "Repair and emergency-intent campaigns should get the first budget tests",
  };
}

function buildAiCmoHtmlReport(
  analysis: BusinessProfile,
  contractorUrl: string,
  brief: ReturnType<typeof buildAiCmoBrief>,
  memory: IntelligenceSnapshot[],
) {
  const actionItems = brief.actions.map((action) => `<li><strong>${escapeHtml(action.action)}</strong><br>${escapeHtml(action.reason)} Confidence: ${action.confidence}%.</li>`).join("");
  const lessons = brief.lessonsLearned.map((lesson) => `<li><strong>${escapeHtml(lesson.label)}</strong><br>${escapeHtml(lesson.detail)}</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>AI CMO Daily Brief</title><style>body{font-family:Arial,sans-serif;color:#17202a;line-height:1.5;margin:40px;max-width:900px}h1,h2{margin-bottom:8px}.score{display:inline-block;background:#17202a;color:white;padding:12px 16px;border-radius:8px;margin-right:8px}li{margin:12px 0}.muted{color:#667085}</style></head><body><h1>AI CMO Daily Brief: ${escapeHtml(analysis.companyName || "HVAC Client")}</h1><p class="muted">${escapeHtml(contractorUrl)}</p><p>${escapeHtml(brief.headline)}</p><p><span class="score">Today: ${brief.todayScore}/100</span><span class="score">Memory: ${brief.memoryScore}/100</span></p><h2>Top Actions</h2><ol>${actionItems}</ol><h2>Lessons Learned</h2><ul>${lessons}</ul><h2>Memory</h2><p>${memory.length} saved observation${memory.length === 1 ? "" : "s"}.</p><p class="muted">Planning recommendations only. No budget or campaign changes were applied automatically.</p></body></html>`;
}

function buildAiCmoClientSummary(analysis: BusinessProfile, brief: ReturnType<typeof buildAiCmoBrief>) {
  return [
    `AI CMO Daily Brief for ${analysis.companyName || "the client"}`,
    brief.headline,
    `Today's Marketing Score: ${brief.todayScore}/100`,
    "",
    "Top actions:",
    ...brief.actions.map((action, index) => `${index + 1}. ${action.action} (${action.confidence}% confidence) - ${action.reason}`),
    "",
    "Important: these are recommendations only. No budget or campaign changes were made automatically.",
  ].join("\n");
}

function priorityClass(priority: string) {
  if (priority === "High") return "bg-red-50 text-red-700 border border-red-200";
  if (priority === "Medium") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-green-50 text-green-700 border border-green-200";
}

function saturationClass(level: string) {
  if (level === "HIGH") return "bg-red-50 text-red-700 border border-red-200";
  if (level === "MEDIUM") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (level === "LOW") return "bg-green-50 text-green-700 border border-green-200";
  return "bg-blue-50 text-blue-700 border border-blue-200";
}

function textDataUrl(value: string, mimeType: string) {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(value)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDelta(before: number, after: number) {
  const delta = Math.round(after - before);
  if (delta > 0) return `up ${delta} points`;
  if (delta < 0) return `down ${Math.abs(delta)} points`;
  return "flat";
}

function currentHvacSeason() {
  const month = new Date().getMonth();
  if (month >= 4 && month <= 8) return "Cooling season: prioritize AC repair, emergency cooling, and replacement demand";
  if (month >= 9 || month <= 1) return "Heating season: prioritize heating repair, furnace repair, and replacement demand";
  return "Shoulder season: prioritize maintenance plans, tune-ups, IAQ, and replacement planning";
}

function buildMarketingIntelligence(
  analysis: BusinessProfile,
  ppcPlan: PpcPlan | null,
  signals: {
    currentWeather: string;
    forecast: string;
    seasonality: string;
    googleTrends: string;
    adsPerformance: string;
    searchVolume: string;
    competitorObservations: string;
    websiteAnalytics: string;
    crmLeadVolume: number;
    campaignPerformance: string;
  },
) {
  const textSignals = Object.values(signals).join(" ").toLowerCase();
  const heatDemand = scoreSignal(textSignals, ["hot", "warm", "humid", "cooling", "ac", "storm"], 18);
  const repairDemand = scoreSignal(textSignals, ["repair", "emergency", "same-day", "same day", "urgent"], 14);
  const trendDemand = scoreSignal(textSignals, ["rising", "high", "spike", "growth"], 12);
  const dataConfidence = ppcPlan ? 12 : 4;
  const leadPressure = signals.crmLeadVolume >= 18 ? 8 : signals.crmLeadVolume >= 8 ? 12 : 6;
  const hvacDemandIndex = clampScore(48 + heatDemand + repairDemand + trendDemand + leadPressure);
  const dailyMarketingScore = clampScore(Math.round(avg([
    hvacDemandIndex,
    analysis.growthScore,
    analysis.serviceAreas.length ? 78 : 48,
    analysis.phone ? 82 : 42,
    dataConfidence + 58,
  ])));
  const cities = analysis.serviceAreas.length ? analysis.serviceAreas.slice(0, 4) : ["Lawrenceville", "Suwanee", "Dacula", "Buford"];
  const coolingServices = serviceNames(analysis, ["AC Repair", "HVAC Repair", "Emergency HVAC", "Installation / Replacement"]);
  const budgetShift = hvacDemandIndex >= 78 ? "Increase high-intent search budgets 15-25% today" : hvacDemandIndex >= 62 ? "Hold budgets steady and watch lead cost" : "Reduce low-converting tests and protect brand/search coverage";
  const dailyBudget = ppcPlan?.recommendedLaunchPlan[0]?.recommendedDailyBudget ?? 100;

  return {
    dailyMarketingScore,
    hvacDemandIndex,
    answers: [
      {
        question: "What should I market today?",
        answer: coolingServices.slice(0, 2).join(" and "),
        explanation: "Weather, seasonality, and search-intent signals point toward urgent service demand before softer awareness content.",
      },
      {
        question: "Where should I market today?",
        answer: cities.slice(0, 3).join(", "),
        explanation: "Use detected service areas first so ads, posts, and emails stay locally relevant.",
      },
      {
        question: "How much should I spend today?",
        answer: `${budgetShift}; start near $${dailyBudget}/day for the top launch campaign.`,
        explanation: "This is a planning recommendation based on demand signals and Revenue Engine readiness, not a guarantee.",
      },
      {
        question: "What content should I publish today?",
        answer: "A cooling problem post, a service-area GBP update, and a short email for homeowners delaying repairs.",
        explanation: "The content mix matches high-intent homeowner concerns and supports local search visibility.",
      },
      {
        question: "What should I pause today?",
        answer: signals.crmLeadVolume >= 18 ? "Pause broad awareness posts and low-intent tests until response capacity is clear." : "Pause unsupported claims and any campaign without a service-specific landing page.",
        explanation: "Spend should move away from weak intent or operational bottlenecks.",
      },
    ],
    priorityActions: [
      { action: `Push ${coolingServices[0]} in ${cities[0]}`, confidence: 88, explanation: "The strongest immediate demand signal is service + city intent." },
      { action: budgetShift, confidence: ppcPlan ? 84 : 68, explanation: "Budget action uses current signals and the latest Revenue Engine readiness." },
      { action: "Publish a Google Business Profile service post", confidence: 78, explanation: "GBP posts support local discovery and reinforce the service area message." },
      { action: "Send review requests to recently completed happy customers", confidence: 74, explanation: "Fresh review velocity improves trust for paid and organic traffic." },
      { action: "Check call/form tracking before increasing spend", confidence: 81, explanation: "Budget changes are only useful when calls, forms, and CRM attribution are visible." },
    ],
    budgetAdjustments: [
      { label: coolingServices[0], detail: `${budgetShift}. Watch calls, booked jobs, and cost per lead every day.`, confidence: ppcPlan ? 86 : 70 },
      { label: "Brand Search", detail: "Keep brand coverage active to defend demand created by other campaigns and referrals.", confidence: 82 },
      { label: "Maintenance Awareness", detail: hvacDemandIndex >= 75 ? "Limit spend today unless the schedule has open capacity." : "Use small retargeting or email budget during softer demand windows.", confidence: 67 },
    ],
    servicesToPromote: coolingServices.slice(0, 4).map((service, index) => ({
      label: service,
      detail: index === 0 ? "Lead with this in search ads, GBP, email, and social today." : "Use as supporting content or secondary ad group focus.",
      confidence: 86 - index * 5,
    })),
    citiesToPrioritize: cities.map((city, index) => ({
      label: city,
      detail: "Use service + city phrasing in ads, captions, email subject lines, and landing-page headings.",
      confidence: 84 - index * 4,
    })),
    socialPosts: [
      { label: "Cooling problem checklist", detail: `Post signs homeowners in ${cities[0]} should call before a small AC issue becomes an emergency.`, confidence: 80 },
      { label: "Technician trust post", detail: "Share a simple proof-focused post using detected trust signals without adding unverifiable claims.", confidence: 72 },
      { label: "Financing reminder", detail: analysis.financingMentioned ? "Promote financing for replacement decisions." : "Hold financing posts until the offer is verified.", confidence: analysis.financingMentioned ? 78 : 52 },
    ],
    emailCampaigns: [
      { label: "Hot-weather repair email", detail: `Send to homeowners in ${cities.slice(0, 2).join(" and ")} with a clear call button and no unsupported promises.`, confidence: 82 },
      { label: "Maintenance plan nurture", detail: analysis.maintenancePlanMentioned ? "Invite past customers to schedule seasonal maintenance." : "Create the maintenance-plan offer before emailing it.", confidence: analysis.maintenancePlanMentioned ? 76 : 55 },
    ],
    reviewRequests: [
      { label: "Completed repair jobs", detail: "Ask recent satisfied repair customers for Google reviews while the service experience is fresh.", confidence: 82 },
      { label: "Replacement customers", detail: "Request reviews that mention comfort, communication, and installation experience.", confidence: 75 },
    ],
  };
}

function buildMarketIntelligence(
  analysis: BusinessProfile,
  contractorUrl: string,
  ppcPlan: PpcPlan | null,
  inputs: { seedUrls: string[]; searchTerms: string[]; marketSize: number },
) {
  const primaryCity = analysis.serviceAreas[0] || "Lawrenceville";
  const marketSize = Math.max(12, Math.min(30, inputs.marketSize || 24));
  const seedNames = inputs.seedUrls.map((url) => titleCase(domainLabel(url).replace(/-/g, " "))).filter(Boolean);
  const baseNames = [
    `${primaryCity} Heating & Air`,
    "Reliable Comfort Services",
    "Premier Air Pros",
    "All Seasons HVAC",
    "North Metro Heating",
    "Rapid Response Air",
    "Home Comfort Experts",
    "Metro Mechanical",
    "Climate Care Pros",
    "Neighborhood Air",
    "Precision Cooling",
    "Complete Comfort Co",
    "Family Air Service",
    "Southern Heat & Cooling",
    "Comfort First HVAC",
    "AirWorks Contractors",
    "Guardian Climate",
    "Peak Comfort",
    "Elite Indoor Air",
    "Local Furnace Pros",
    "Water Heater & Air",
    "Smart Heat Pump Co",
    "County Comfort",
    "Same Day Cooling",
    "Trusted Home Air",
    "Regional Comfort Group",
    "Franchise Air Network",
    "Owner Operated HVAC",
    "Metro IAQ Specialists",
    "Mini Split Masters",
  ];
  const names = [...seedNames, ...baseNames].slice(0, marketSize);
  const categories = ["Enterprise", "Regional", "Local", "Owner-Operator", "Franchise"];
  const postures = ["Aggressive Advertiser", "SEO Heavy", "Google Ads Heavy", "GBP Heavy", "Brand Focused"];
  const marketDatabase = names.map((name, index) => {
    const category = categories[index % categories.length];
    const posture = postures[(index + 2) % postures.length];
    const services = ["AC Repair", "HVAC Repair", "Installation", "Maintenance Plans"];
    if (index % 3 === 0) services.push("Furnace Repair");
    if (index % 4 === 0) services.push("Heat Pumps");
    if (index % 5 === 0) services.push("Water Heaters");
    if (index % 7 === 0) services.push("Indoor Air Quality");
    return {
      businessName: name,
      website: inputs.seedUrls[index] || `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.com`,
      googleBusinessProfile: `${name} GBP profile`,
      estimatedServiceArea: analysis.serviceAreas.slice(0, 4).join(", ") || `${primaryCity}, Suwanee, Dacula`,
      primaryServices: services,
      primaryCta: index % 2 === 0 ? "Call Now" : "Schedule Service",
      currentPromotions: index % 4 === 0 ? "Seasonal tune-up" : index % 4 === 1 ? "Financing message" : index % 4 === 2 ? "Diagnostic offer" : "No visible promotion",
      emergencyService: index % 3 === 0,
      financing: index % 4 === 1 || index % 6 === 0,
      maintenancePlans: index % 2 === 0,
      waterHeaters: index % 5 === 0,
      indoorAirQuality: index % 7 === 0,
      primaryHeadlines: index % 2 === 0 ? "Fast local HVAC service" : "Comfort solutions for your home",
      metaTitle: `${name} | HVAC Services in ${primaryCity}`,
      metaDescription: `HVAC services, repair, and replacement in ${primaryCity}.`,
      reviewCount: 75 + index * 41,
      reviewRating: Number((4.2 + (index % 7) * 0.1).toFixed(1)),
      trustSignals: index % 2 === 0 ? "Family owned, reviews, local technicians" : "Financing, warranties, certified technicians",
      brandsMentioned: index % 3 === 0 ? "Trane, Carrier" : index % 3 === 1 ? "Lennox, Goodman" : "Rheem, Bryant",
      socialLinks: index % 2 === 0 ? "Facebook, Instagram" : "Facebook",
      estimatedCompanySize: category === "Enterprise" ? "50+ employees" : category === "Regional" ? "20-50 employees" : category === "Owner-Operator" ? "1-5 employees" : "6-20 employees",
      advertisingPresence: posture,
      category,
      positioning: `${category}; ${posture}`,
    };
  });
  const serviceSet = new Set(analysis.services.map((service) => service.toLowerCase()));
  const hasRepair = Array.from(serviceSet).some((service) => service.includes("repair"));
  const clientVisibility = clampScore(Math.round(avg([
    analysis.seoAnalysis.score,
    analysis.aiSeoAnalysis.score,
    analysis.growthScore,
    ppcPlan ? 76 : 45,
  ])));
  const projectedRank = clientVisibility >= 78 ? "Top 3" : clientVisibility >= 64 ? "Top 5" : "Top 10";
  const marketOpportunityScore = clampScore(Math.round(avg([
    analysis.serviceAreas.length ? 82 : 55,
    hasRepair ? 84 : 62,
    analysis.financingMentioned ? 78 : 60,
    ppcPlan ? 86 : 64,
  ])));
  const serviceCounts = {
    "AC Repair": marketDatabase.filter((company) => company.primaryServices.includes("AC Repair")).length,
    Installation: marketDatabase.filter((company) => company.primaryServices.includes("Installation")).length,
    "Water Heaters": marketDatabase.filter((company) => company.waterHeaters).length,
    "Mini Splits": Math.max(2, Math.round(marketSize * 0.16)),
    "Indoor Air Quality": marketDatabase.filter((company) => company.indoorAirQuality).length,
    "Heat Pumps": marketDatabase.filter((company) => company.primaryServices.includes("Heat Pumps")).length,
  };
  const saturation = (count: number) => Math.round((count / marketSize) * 100);
  const marketSaturation = Object.entries(serviceCounts).map(([service, count]) => {
    const score = saturation(count);
    const level = score >= 75 ? "HIGH" : score >= 45 ? "MEDIUM" : score >= 22 ? "LOW" : "VERY LOW";
    return {
      service,
      score,
      level,
      reason: `${count} of ${marketSize} modeled businesses strongly promote ${service}.`,
    };
  });
  const promotionMix = [
    { label: "Financing", market: saturation(marketDatabase.filter((company) => company.financing).length), client: analysis.financingMentioned },
    { label: "Maintenance", market: saturation(marketDatabase.filter((company) => company.maintenancePlans).length), client: analysis.maintenancePlanMentioned },
    { label: "Free Estimates", market: 38, client: false },
    { label: "Coupons", market: 29, client: false },
    { label: "Warranty", market: 42, client: analysis.differentiators.some((item) => /warranty|guarantee/i.test(item)) },
    { label: "Seasonal Specials", market: 54, client: false },
  ];

  return {
    marketOpportunityScore,
    marketDatabase,
    marketPosition: {
      visibility: clientVisibility,
      marketRank: `${Math.max(4, Math.round(marketSize * (1 - clientVisibility / 110)))} / ${marketSize}`,
      projectedRank,
      confidence: ppcPlan ? 83 : 68,
      explanation: `Score combines SEO (${analysis.seoAnalysis.score}), AI visibility (${analysis.aiSeoAnalysis.score}), website readiness (${Math.round(analysis.growthScore)}), Revenue Engine status, detected service-area depth, and market saturation. It is explained from available signals rather than treated as a black-box rank.`,
    },
    opportunityScores: [
      { label: "Revenue Opportunity", score: marketOpportunityScore, explanation: "High-intent repair and replacement services are present, with budget upside after tracking is verified." },
      { label: "Market Position", score: clientVisibility, explanation: "Based on current organic, AI, website, and paid-readiness signals." },
      { label: "Competitive Pressure", score: 100 - saturation(serviceCounts["AC Repair"]), explanation: "AC repair is crowded, so advantage depends on offer, page quality, and local specificity." },
      { label: "Differentiation Potential", score: 82, explanation: "Financing, neighborhood pages, IAQ, water heaters, and whole-home comfort are underused angles." },
      { label: "Marketing Advantage", score: ppcPlan ? 79 : 62, explanation: "Revenue Engine output improves ability to move from analysis to launch assets." },
    ],
    marketSaturation,
    whatEveryoneSays: [
      { label: "Fast service", detail: "The dominant market pattern is speed-based repair messaging, usually with call-now CTAs.", confidence: 84 },
      { label: "Trusted local technicians", detail: "Most companies lean on generic trust language, family-owned claims, and review mentions.", confidence: 79 },
      { label: "Financing and same-day language", detail: "A meaningful minority use financing or same-day phrasing, but often without service-specific positioning.", confidence: 74 },
    ],
    whatNobodySays: [
      { label: "Neighborhood comfort experts", detail: "Few competitors appear to own neighborhood-level messaging. This is a strong city-page and GBP content angle.", confidence: 86 },
      { label: "Whole-home comfort", detail: "Most competitors split repair, replacement, IAQ, and water heaters. A complete-home comfort frame can stand apart.", confidence: 78 },
      { label: "Transparent decision help", detail: "Repair-or-replace education is less common than hard-sell offers and can improve trust.", confidence: 75 },
    ],
    promotionAnalysis: [
      { label: "Financing", detail: `${promotionMix[0].market}% of the modeled market promotes financing. ${analysis.financingMentioned ? "Use verified financing more prominently." : "Do not advertise financing until verified."}`, confidence: 80 },
      { label: "Maintenance plans", detail: `${promotionMix[1].market}% mention maintenance. Package this as a named membership to make it more ownable.`, confidence: 76 },
      { label: "Seasonal specials", detail: "Seasonal service hooks are common, so pair any offer with a city or neighborhood angle.", confidence: 72 },
    ],
    googleAdsMarketScan: [
      { label: "Average ad style", detail: "Visible ad style is direct-response: repair keyword, city, phone CTA, and a short trust phrase.", confidence: 76 },
      { label: "Repeated language", detail: "Common phrases include fast service, same day, trusted, local, financing, and free estimate. Use more specific original phrasing.", confidence: 80 },
      { label: "Original ad angle", detail: `Test '${primaryCity} comfort problem solved' and service-specific city copy instead of generic fast HVAC language.`, confidence: ppcPlan ? 82 : 68 },
    ],
    localSeoAnalysis: [
      { label: "Service pages", detail: "AC repair and HVAC repair are saturated; win with better city-specific service pages and stronger internal links.", confidence: 84 },
      { label: "Neighborhood pages", detail: "Neighborhood landing pages appear underused. This is a very high opportunity for local relevance.", confidence: 88 },
      { label: "FAQ and schema", detail: "Use FAQ, LocalBusiness, Service, and Review schema to improve machine readability and AI visibility.", confidence: 79 },
      { label: "GBP categories and reviews", detail: "Review velocity and category completeness should be tracked against market leaders monthly.", confidence: 75 },
    ],
    marketGaps: [
      { label: "Water Heater Replacement", detail: `Only ${serviceCounts["Water Heaters"]} of ${marketSize} modeled competitors strongly promote water heaters. Estimated opportunity: High.`, confidence: 84 },
      { label: "Indoor Air Quality", detail: `Only ${serviceCounts["Indoor Air Quality"]} of ${marketSize} emphasize IAQ. Estimated opportunity: Very High.`, confidence: 82 },
      { label: "Neighborhood Landing Pages", detail: "Few competitors appear to target neighborhoods below city level. Estimated opportunity: Very High.", confidence: 88 },
      { label: "Heat Pump Repair", detail: `Heat pumps show ${marketSaturation.find((item) => item.service === "Heat Pumps")?.level.toLowerCase()} saturation with strong replacement upside.`, confidence: 78 },
    ],
    differentiation: [
      { label: "Neighborhood Comfort Experts", detail: "Own the local map with neighborhood page clusters, GBP posts, and service-area language.", confidence: 86 },
      { label: "Comfort Guardian Membership", detail: "A named membership makes maintenance more memorable than a generic plan.", confidence: 78 },
      { label: "Whole Home Comfort", detail: "Connect HVAC repair, replacement, IAQ, heat pumps, and water heaters into one differentiated message.", confidence: 80 },
      { label: "Financing Specialists", detail: analysis.financingMentioned ? "Use verified financing to support replacement decisions." : "Add verified financing before using this angle.", confidence: analysis.financingMentioned ? 79 : 55 },
    ],
    adCopy: [
      {
        headline: `AC Repair in ${primaryCity}`.slice(0, 30),
        description: `Local HVAC help for ${primaryCity}. Call ${analysis.companyName || "today"} for service.`,
      },
      {
        headline: "Cooling Problem Today?".slice(0, 30),
        description: "Get clear next steps for repair or replacement without unsupported promises.",
      },
      {
        headline: "HVAC Help Near You".slice(0, 30),
        description: `Service-focused support for ${analysis.serviceAreas.slice(0, 2).join(" and ") || primaryCity}.`,
      },
      {
        headline: "Repair Or Replace?".slice(0, 30),
        description: "Promote a practical consultation page that helps homeowners choose the next step.",
      },
    ],
    landingPageRecommendations: [
      { label: `${primaryCity} AC Repair`, detail: "Create a page with service symptoms, city proof, phone CTA, trust signals, and FAQs.", confidence: 88 },
      { label: `${primaryCity} Neighborhood Hub`, detail: "Build a hub that links city, neighborhood, service, FAQ, and review content.", confidence: 86 },
      { label: "Water Heater Replacement", detail: "Use the low-saturation gap to create a conversion-focused water heater page.", confidence: 82 },
      { label: "Indoor Air Quality", detail: "Create an IAQ page that frames health, comfort, humidity, and filtration without overclaiming.", confidence: 78 },
    ],
    promotionMix,
    marketTimeline: [
      { date: "12 days ago", event: "Financing messages increased", detail: "Modeled market activity shows financing becoming more common in replacement positioning." },
      { date: "8 days ago", event: "City-page emphasis expanded", detail: "SEO-heavy companies appear to be leaning into service + city page patterns." },
      { date: "This week", event: "Repair ads remain saturated", detail: "AC repair and HVAC repair language continues to dominate visible paid-search style." },
      { date: "Next scan", event: "Market memory checkpoint", detail: "Future scans should compare review growth, new pages, GBP posts, promotions, and ad language." },
    ],
    marketDirectorSummary: `The ${primaryCity} HVAC market is saturated with repair messaging. Most companies compete on fast service, generic trust, and call-now CTAs. Fewer competitors strongly emphasize financing, water heaters, IAQ, heat pumps, or neighborhood-specific landing pages. ${analysis.companyName || "This contractor"} can compete by pairing service + city campaign structure with neighborhood branding, a named maintenance membership, verified financing language, and whole-home comfort content.`,
    searchTerms: inputs.searchTerms,
    clientUrl: contractorUrl,
  };
}

function nextRecommendedAction(analysis: BusinessProfile, ppcPlan: PpcPlan | null) {
  if (!ppcPlan) return "Run the Revenue Engine to score campaign readiness and generate launch assets.";
  const missingPage = ppcPlan.report.missingLandingPages.find((item) => !item.startsWith("No major"));
  if (missingPage) return `Create or improve the landing page for ${missingPage}.`;
  if (!analysis.phone) return "Add a verified phone number before launching paid campaigns.";
  return "Move to Deploy Center and export Google Ads, SEO, GBP, HighLevel, and reporting assets.";
}

function buildDecisionRecommendations(
  section: PlatformSection,
  analysis: BusinessProfile,
  ppcPlan: PpcPlan | null,
): DecisionRecommendation[] {
  const city = analysis.serviceAreas[0] || "primary market";
  const topCampaign = ppcPlan?.recommendedLaunchPlan[0];
  const missingPage = ppcPlan?.report.missingLandingPages.find((item) => !item.startsWith("No major"));
  const revenueScore = ppcPlan ? Math.round(avg(ppcPlan.campaignReadiness.map((item) => item.priorityScore))) : 35;
  const baseConfidence = clampScore(Math.round(avg([
    analysis.growthScore,
    analysis.seoAnalysis.score,
    analysis.aiSeoAnalysis.score,
    revenueScore,
    analysis.serviceAreas.length ? 76 : 48,
  ])));
  const annualHigh = "$25k-$75k annual opportunity";
  const annualMedium = "$10k-$30k annual opportunity";
  const annualLow = "$2k-$10k annual opportunity";
  const common = {
    confidenceScore: baseConfidence,
    dependencies: ["Verified tracking", "Owner approval"],
  };
  const map: Record<PlatformSection, DecisionRecommendation[]> = {
    dashboard: [
      decision("dashboard-revenue-engine", "Revenue", "Run or refresh the Revenue Engine", "High", "Creates the campaign launch plan and budget priorities.", annualHigh, baseConfidence, "Moderate", "30 minutes", ["Website scan", "Service areas"], "The dashboard needs one revenue decision before deployment work can be prioritized."),
      decision("dashboard-tracking", "CRM", "Verify call, form, and HighLevel tracking", "High", "Improves attribution before any spend increase.", annualHigh, baseConfidence - 2, "Moderate", "45 minutes", ["GTM access", "HighLevel access"], "Marketing decisions only get smarter when the platform can compare outcomes against source-level performance."),
    ],
    "website-audit": [
      decision("audit-contact-path", "Website", analysis.phone ? "Confirm tracked phone number is installed" : "Add a verified phone number to the website", "High", "Protects paid and organic lead capture.", annualHigh, baseConfidence, "Easy", "20 minutes", ["Website access"], "The audit cannot become launch-ready without a measurable conversion path."),
      decision("audit-trust-proof", "Brand", "Add one visible trust proof block to priority service pages", "Medium", "Improves conversion confidence for paid and organic visitors.", annualMedium, baseConfidence - 4, "Easy", "45 minutes", ["Reviews or proof points"], "Detected differentiators should be converted into proof near CTAs."),
    ],
    seo: [
      decision("seo-city-page", "SEO", `Create or improve the ${city} AC repair page`, "High", "Targets high-intent local search demand.", annualHigh, baseConfidence + 4, "Moderate", "2 hours", ["Service details", "Website CMS"], "Service + city pages are the clearest path from SEO analysis to revenue opportunity."),
      decision("seo-internal-links", "SEO", "Add internal links from homepage and service pages to priority city pages", "Medium", "Helps search engines understand local service relevance.", annualMedium, baseConfidence, "Easy", "45 minutes", ["CMS access"], "Internal linking turns page recommendations into a crawlable local SEO structure."),
    ],
    "ai-visibility": [
      decision("ai-faq-schema", "SEO", "Publish FAQ content and schema for top homeowner questions", "High", "Improves AI search and answer-engine readiness.", annualMedium, baseConfidence + 2, "Moderate", "90 minutes", ["FAQ answers", "Schema access"], "AI visibility improves when the business gives clear, structured answers with verifiable facts."),
      decision("ai-entity-proof", "Brand", "Add clearer entity proof: service areas, services, reviews, and company details", "Medium", "Makes the company easier for AI tools to understand and cite.", annualMedium, baseConfidence, "Easy", "1 hour", ["Business profile"], "AI systems need explicit business facts, not implied service claims."),
    ],
    "connected-apps": [
      decision("connected-google-ads", "Google Ads", "Connect Google Ads in read-only mode", "High", "Lets HVAC Growth OS use real spend, search terms, CPC, CTR, and conversion data.", annualHigh, baseConfidence + 4, "Moderate", "30 minutes", ["Google OAuth access", "Google Ads developer token"], "Connected Apps is the bridge from generated recommendations to performance-aware decisions."),
      decision("connected-customer-sync", "CRM", "Select the active Google Ads customer account and refresh data", "High", "Prevents recommendations from using stale or wrong-account performance data.", annualHigh, baseConfidence + 3, "Easy", "10 minutes", ["Connected Google Ads account"], "The platform needs one active customer account before it can compare campaigns, search terms, and deployment readiness."),
    ],
    "conversion-tracking": [
      decision("tracking-click-id", "CRM", "Confirm GCLID, GBRAID, and WBRAID capture in HighLevel", "High", "Enables offline conversion imports and source-level revenue attribution.", annualHigh, baseConfidence + 5, "Moderate", "45 minutes", ["HighLevel custom fields", "Website form tracking"], "Conversion Tracking should prove which clicks turn into qualified opportunities and revenue before spend is increased."),
      decision("tracking-primary-conversions", "Google Ads", "Define primary conversions as qualified opportunities, estimates, and closed won jobs", "High", "Improves bidding signals by optimizing toward revenue stages instead of raw leads only.", annualHigh, baseConfidence + 4, "Moderate", "1 hour", ["Google Ads access", "HighLevel stages"], "Raw calls and forms matter, but the operating system needs deeper CRM milestones to make better budget decisions."),
    ],
    "ai-cmo": [
      decision("cmo-top-action", "Revenue", `Spend the next hour on ${topCampaign?.campaign || `AC Repair in ${city}`}`, "High", "Focuses the day on the highest-ROI decision.", annualHigh, baseConfidence + 6, "Moderate", "1 hour", ["Decision approval"], "AI CMO should turn daily signals into one concrete operating move."),
      decision("cmo-memory", "CRM", "Save today's decision outcome in Intelligence Memory", "Medium", "Improves future confidence and recommendation quality.", annualMedium, baseConfidence + 1, "Easy", "5 minutes", ["Outcome note"], "Completed and ignored decisions teach the system what works for this client."),
    ],
    "revenue-engine": [
      decision("revenue-launch-campaign", "Google Ads", topCampaign ? `Approve launch plan for ${topCampaign.campaign}` : "Generate the Revenue Engine launch plan", "High", "Moves paid search from strategy to implementation.", annualHigh, baseConfidence + 5, "Moderate", "45 minutes", ["Google Ads access", "Tracking"], "Revenue Engine decisions should create campaign assets, not stop at keyword lists."),
      decision("revenue-landing-page", "Website", missingPage ? `Create landing page for ${missingPage}` : "QA the best existing landing page for launch campaigns", "High", "Improves conversion rate before budget increases.", annualHigh, baseConfidence + 3, "Moderate", "2 hours", ["CMS access", "Offer approval"], "Paid clicks need matching pages or the campaign will leak revenue."),
    ],
    "marketing-intelligence": [
      decision("marketing-budget", "Google Ads", `Review a 15% budget shift toward AC Repair in ${city}`, "High", "Captures weather and seasonality-driven repair demand.", annualHigh, baseConfidence + 4, "Moderate", "20 minutes", ["Ads performance", "Budget approval"], "Marketing Intelligence exists to decide where today's marginal dollar should go."),
      decision("marketing-content", "Social Media", `Publish a cooling tip for homeowners in ${city}`, "Medium", "Supports local engagement and GBP/social freshness.", annualLow, baseConfidence - 2, "Easy", "20 minutes", ["Approved copy"], "Weather-driven content gives the campaign a relevant same-day touchpoint."),
    ],
    "market-intelligence": [
      decision("market-gap", "Revenue", "Build the first low-saturation service page: Water Heater Replacement or IAQ", "High", "Targets services with less market competition.", annualHigh, baseConfidence + 5, "Moderate", "2 hours", ["Service confirmation", "CMS access"], "Market Intelligence shows where the contractor can compete without saying what everyone else says."),
      decision("market-positioning", "Brand", `Test neighborhood comfort positioning in ${city}`, "Medium", "Differentiates from generic fast-service messaging.", annualMedium, baseConfidence, "Moderate", "90 minutes", ["Brand approval"], "The market is crowded with repair claims; neighborhood specificity creates a more ownable position."),
    ],
    "deploy-center": [
      decision("deploy-google-ads", "Google Ads", "Export Google Ads assets and complete launch QA", "High", "Moves approved recommendations into deployment.", annualHigh, baseConfidence + 3, "Moderate", "1 hour", ["Revenue Engine", "Google Ads access"], "Deploy Center should convert strategy into launch-ready files and checks."),
      decision("deploy-gtm", "CRM", "Install or verify GTM, call tracking, and form tracking", "High", "Enables performance learning across future recommendations.", annualHigh, baseConfidence + 2, "Moderate", "1 hour", ["Website access", "GTM access"], "Without tracking, the platform cannot learn which decisions produce revenue."),
    ],
    "client-workspace": [
      decision("workspace-next-task", "CRM", "Convert the highest-priority recommendation into an owner task", "High", "Creates accountability and moves the client forward.", annualMedium, baseConfidence, "Easy", "10 minutes", ["Task owner"], "The workspace should preserve decisions, task status, and outcomes over time."),
      decision("workspace-health", "Website", "Fix the lowest client health category before adding new campaigns", "Medium", "Removes operational bottlenecks that reduce campaign ROI.", annualMedium, baseConfidence - 3, "Moderate", "1 hour", ["Access checklist"], "Client health determines whether more traffic can become more revenue."),
    ],
    reports: [
      decision("reports-launch", "Brand", "Send the client a launch report with one approved next action", "Medium", "Aligns the client on priorities and expected impact.", annualMedium, baseConfidence, "Easy", "30 minutes", ["Report review"], "Reports should create decisions, not just summarize activity."),
      decision("reports-memory", "Revenue", "Log report outcomes into Intelligence Memory", "Medium", "Improves month-over-month recommendations.", annualMedium, baseConfidence, "Easy", "10 minutes", ["Performance notes"], "Monthly learning makes the operating system more valuable over time."),
    ],
    settings: [
      decision("settings-profile", "Brand", "Complete missing business profile fields before generating more assets", "High", "Prevents unsupported claims and weak campaign copy.", annualMedium, baseConfidence, "Easy", "20 minutes", ["Client input"], "Clean inputs make every downstream decision safer and more specific."),
      decision("settings-access", "CRM", "Complete the access checklist for Ads, Analytics, GBP, Search Console, Website, and HighLevel", "High", "Unlocks deployment and performance learning.", annualHigh, baseConfidence + 2, "Moderate", "45 minutes", ["Client access"], "Decision software needs implementation access to become a marketing operating system."),
    ],
  };
  return map[section].map((item) => ({ ...common, ...item, confidenceScore: item.confidenceScore }));
}

function decision(
  id: string,
  category: DecisionRecommendation["category"],
  recommendedAction: string,
  priority: DecisionRecommendation["priority"],
  expectedImpact: string,
  estimatedRevenueOpportunity: string,
  confidenceScore: number,
  difficulty: DecisionRecommendation["difficulty"],
  estimatedTime: string,
  dependencies: string[],
  reasoning: string,
): DecisionRecommendation {
  return {
    id,
    category,
    recommendedAction,
    priority,
    expectedImpact,
    estimatedRevenueOpportunity,
    confidenceScore: clampScore(confidenceScore),
    difficulty,
    estimatedTime,
    dependencies,
    reasoning,
  };
}

function decisionMemoryKey(analysis: BusinessProfile, contractorUrl: string) {
  return `hvac-growth-os:decision-engine:${domainLabel(contractorUrl || analysis.companyName || "client")}`;
}

function loadDecisionMemory(key: string): {
  statuses: Record<string, DecisionStatus>;
  outcomes: Record<string, string>;
  history: Array<{ decision: string; date: string; status: DecisionStatus; outcome: string; performance: string }>;
} {
  if (typeof window === "undefined") return { statuses: {}, outcomes: {}, history: [] };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { statuses: {}, outcomes: {}, history: [] };
    const parsed = JSON.parse(raw) as ReturnType<typeof loadDecisionMemory>;
    return {
      statuses: parsed.statuses ?? {},
      outcomes: parsed.outcomes ?? {},
      history: parsed.history ?? [],
    };
  } catch {
    return { statuses: {}, outcomes: {}, history: [] };
  }
}

function saveDecisionMemory(key: string, value: ReturnType<typeof loadDecisionMemory>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function avg(values: number[]) {
  const cleanValues = values.filter((value) => Number.isFinite(value));
  return cleanValues.length ? cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length : 0;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function clampScore(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function scoreSignal(text: string, words: string[], points: number) {
  return words.some((word) => text.includes(word)) ? points : 0;
}

function serviceNames(analysis: BusinessProfile, fallback: string[]) {
  const detected = analysis.services.filter((service) => /ac|air|hvac|heat|repair|install|replace|maintenance/i.test(service));
  return detected.length ? detected.slice(0, 5) : fallback;
}

function domainLabel(url: string) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split(".")[0];
  }
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : "")
    .join(" ");
}

function linesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}
