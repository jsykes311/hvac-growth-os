"use client";

import {
  ArrowLeft,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  Loader2,
  Megaphone,
  Palette,
  Search,
  Bot,
  Download,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";
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
type ApiError = { error?: string };
type ReadinessItem = {
  complete: boolean;
  detail: string;
  label: string;
};

const CAMPAIGN_GOALS = [
  "Book more service calls",
  "Promote replacement installs",
  "Sell maintenance plans",
  "Grow emergency repair leads",
  "Launch financing offer",
];

export function HvacGrowthApp() {
  const [contractorUrl, setContractorUrl] = useState("");
  const [view, setView] = useState<View>("home");
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
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <Header />

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
              onBack={() => {
                setView("home");
                setError("");
              }}
              onCreateCampaign={handleCreateCampaign}
              onCreatePpcPlan={handleCreatePpcPlan}
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

function Header() {
  return (
    <header className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-ink text-white">
          <ChartNoAxesCombined className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-black leading-tight text-ink">HVAC Growth OS</p>
          <p className="text-xs font-medium text-graphite/70">Contractor growth intelligence</p>
        </div>
      </div>
      <p className="hidden text-sm font-semibold text-graphite/70 sm:block">Live website analysis</p>
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
        <Eyebrow>Lead engine scanner</Eyebrow>
        <h1 className="max-w-3xl text-5xl font-black leading-[1.02] text-ink sm:text-6xl">
          Turn an HVAC website into a growth plan.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite">
          Enter a contractor URL. HVAC Growth OS scrapes the core pages, analyzes the brand, and returns a business profile ready for campaign creation.
        </p>
      </section>

      <Panel className="w-full">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <FieldLabel>Contractor website URL</FieldLabel>
            <input
              className="h-14 w-full rounded-md border border-ink/15 bg-white px-4 text-base text-ink outline-none transition placeholder:text-graphite/40 focus:border-flame focus:ring-4 focus:ring-flame/15"
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
  onBack,
  onCreateCampaign,
  onCreatePpcPlan,
  onUpdateAnalysis,
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
  onBack: () => void;
  onCreateCampaign: (event: FormEvent<HTMLFormElement>) => void;
  onCreatePpcPlan: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateAnalysis: (analysis: BusinessProfile) => void;
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
            <p className="mt-2 text-sm leading-6 text-graphite/70">
              These came from the website scan. Adjust them if the scrape picked up the wrong colors before creating the campaign.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ColorPicker
                label="Primary"
                onChange={(value) => updateBrandColor("primaryColor", value)}
                value={analysis.primaryColor}
              />
              <ColorPicker
                label="Secondary"
                onChange={(value) => updateBrandColor("secondaryColor", value)}
                value={analysis.secondaryColor}
              />
              <ColorPicker
                label="Accent"
                onChange={(value) => updateBrandColor("accentColor", value)}
                value={analysis.accentColor}
              />
            </div>
            {analysis.heroImageUrl && (
              <div className="mt-5 overflow-hidden rounded-lg border border-ink/10 bg-white">
                <img
                  className="h-40 w-full object-cover"
                  src={analysis.heroImageUrl}
                  alt={`${analysis.companyName} campaign hero visual`}
                />
              </div>
            )}
            <p className="mt-4 text-sm leading-6 text-graphite">{analysis.brandStyle || "No brand style found."}</p>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-black text-ink">Differentiators</h2>
          <BulletList values={analysis.differentiators} emptyText="No differentiators found." />
        </Panel>

        <Panel>
          <h2 className="text-lg font-black text-ink">Top 5 Growth Opportunities</h2>
          <ol className="mt-4 space-y-3">
            {analysis.topGrowthOpportunities.map((item, index) => (
              <li className="flex gap-3 text-sm leading-6 text-graphite" key={item}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-black text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SeoAnalysisPanel analysis={analysis} />
        <AiSeoAnalysisPanel analysis={analysis} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileEditor
          analysis={analysis}
          onListChange={updateProfileList}
          onUpdate={updateProfileField}
        />
        <AnalysisQualityPanel
          readinessItems={readinessItems}
          readinessScore={readinessScore}
          scrapedPages={scrapedPages}
        />
      </div>

      <PpcPlannerPanel
        analysis={analysis}
        isCreatingPpcPlan={isCreatingPpcPlan}
        onCreatePpcPlan={onCreatePpcPlan}
        overrides={ppcOverrides}
        ppcPlan={ppcPlan}
        setOverrides={setPpcOverrides}
      />

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
            <article className="rounded-md border border-ink/10 bg-frost p-4" key={item.campaignKey}>
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
              <article className="rounded-md border border-ink/10 bg-frost p-4" key={campaign.campaign}>
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-ink/10 bg-frost p-4">
      <p className="text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "Ready" | "Needs Work" | "Not Recommended" }) {
  const className =
    status === "Ready"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "Needs Work"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-black ${className}`}>
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
      <div className="mt-3 overflow-hidden rounded-md border border-ink/10 bg-white">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="bg-frost text-graphite/70">
            <tr>
              {columns.map((column) => (
                <th className="px-3 py-2 font-black" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-t border-ink/10" key={`${title}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td className="truncate px-3 py-2 font-medium text-graphite" key={`${cell}-${cellIndex}`} title={cell}>
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
    <div className="rounded-md bg-ink px-4 py-3 text-center text-white">
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

function linesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}
