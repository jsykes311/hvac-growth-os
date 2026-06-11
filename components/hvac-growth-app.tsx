"use client";

import {
  ArrowLeft,
  ChartNoAxesCombined,
  ClipboardList,
  Loader2,
  Megaphone,
  Palette,
  Download,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";
import type { BusinessProfile, CampaignImage, CampaignOutput } from "@/lib/types";
import { Button, Eyebrow, FieldLabel, Panel } from "@/components/ui";

type View = "home" | "results";
type ApiError = { error?: string };

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
  const [campaign, setCampaign] = useState<CampaignOutput | null>(null);
  const [campaignImage, setCampaignImage] = useState<CampaignImage | null>(null);
  const [goal, setGoal] = useState(CAMPAIGN_GOALS[0]);
  const [offer, setOffer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [error, setError] = useState("");

  const isReady = contractorUrl.trim().length > 3;

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady || isAnalyzing) return;

    setIsAnalyzing(true);
    setError("");
    setCampaign(null);
    setCampaignImage(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: contractorUrl }),
      });
      const payload = (await response.json()) as { profile?: BusinessProfile } & ApiError;

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Unable to analyze this website.");
      }

      setAnalysis(payload.profile);
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
              offer={offer}
              onBack={() => {
                setView("home");
                setError("");
              }}
              onCreateCampaign={handleCreateCampaign}
              onUpdateAnalysis={(nextAnalysis) => {
                setAnalysis(nextAnalysis);
                setCampaign(null);
                setCampaignImage(null);
              }}
              setGoal={setGoal}
              setOffer={setOffer}
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
  offer,
  onBack,
  onCreateCampaign,
  onUpdateAnalysis,
  setGoal,
  setOffer,
}: {
  analysis: BusinessProfile;
  campaign: CampaignOutput | null;
  campaignImage: CampaignImage | null;
  contractorUrl: string;
  error: string;
  goal: string;
  isCreatingCampaign: boolean;
  offer: string;
  onBack: () => void;
  onCreateCampaign: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateAnalysis: (analysis: BusinessProfile) => void;
  setGoal: (value: string) => void;
  setOffer: (value: string) => void;
}) {
  function updateBrandColor(field: "primaryColor" | "secondaryColor" | "accentColor", value: string) {
    onUpdateAnalysis({ ...analysis, [field]: value });
  }

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
          <h3 className="text-lg font-black text-ink">Campaign One-Pager</h3>
          <p className="text-sm font-medium text-graphite/70">
            Microf-style campaign creative with a hero section, proof points, CTA band, and logo when available.
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

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}
