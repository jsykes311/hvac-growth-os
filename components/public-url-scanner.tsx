"use client";

import { ArrowRight, Loader2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import type { BusinessProfile } from "@/lib/types";
import { Eyebrow, Panel } from "@/components/ui";

export function PublicUrlScanner() {
  const [url, setUrl] = useState("");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || isScanning) return;
    setError("");
    setProfile(null);
    setIsScanning(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; profile?: BusinessProfile } | null;
      if (!response.ok || !payload?.profile) throw new Error(payload?.error || "Unable to scan this URL.");
      setProfile(payload.profile);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to scan this URL.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <div className="background-effects" aria-hidden="true" />
      <div className="glow glow-one" aria-hidden="true" />
      <div className="glow glow-two" aria-hidden="true" />
      <div className="mx-auto w-full max-w-5xl py-10 sm:py-16">
        <div className="max-w-3xl">
          <Eyebrow>Free Website Intelligence Scan</Eyebrow>
          <h1 className="text-5xl font-black leading-[1.02] text-ink sm:text-6xl">Paste a URL. Get the growth gaps.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite">Scan any HVAC contractor website for service, local-search, conversion, and growth opportunities. No login, no dashboard treasure hunt.</p>
        </div>

        <Panel className="mt-9 max-w-4xl">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={scan}>
            <label className="sr-only" htmlFor="website-url">Website URL</label>
            <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-teal-600" /><input className="h-14 w-full rounded-xl border border-ink/15 bg-white px-12 text-base font-semibold text-ink outline-none transition placeholder:text-graphite/40 focus:border-teal-500 focus:ring-4 focus:ring-teal-100" id="website-url" onChange={(event) => setUrl(event.target.value)} placeholder="https://examplehvac.com" value={url} /></div>
            <button className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-ink to-flame px-6 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(25,184,181,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" disabled={!url.trim() || isScanning} type="submit">
              {isScanning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isScanning ? "Scanning site…" : "Scan website"}
            </button>
          </form>
          <p className="mt-3 text-xs font-medium text-graphite/65">Scans can take up to 90 seconds while we review the website. Try a real business site—not some cursed parked domain.</p>
          {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        </Panel>

        {profile && <ScanResults profile={profile} url={url} />}
      </div>
    </main>
  );
}

function ScanResults({ profile, url }: { profile: BusinessProfile; url: string }) {
  const score = Math.round((profile.growthScore + profile.seoAnalysis.score + profile.aiSeoAnalysis.score) / 3);
  return <section className="mt-7 space-y-5"><Panel><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Eyebrow>Scan complete</Eyebrow><h2 className="text-3xl font-black text-ink">{profile.companyName || new URL(url.startsWith("http") ? url : `https://${url}`).hostname}</h2><p className="mt-2 text-sm font-medium text-graphite/70">{profile.brandStyle || "Website growth profile generated."}</p></div><div className="rounded-2xl bg-teal-50 px-6 py-4 text-center"><strong className="block text-4xl font-black text-teal-700">{score}</strong><span className="text-[10px] font-black uppercase tracking-[.15em] text-teal-800">Growth score</span></div></div></Panel><div className="grid gap-5 lg:grid-cols-2"><ResultList eyebrow="Top growth opportunities" items={profile.topGrowthOpportunities} /><ResultList eyebrow="Local search opportunities" items={profile.seoAnalysis.localSeoGaps} /></div><Panel><Eyebrow>Recommended next moves</Eyebrow><div className="mt-4 grid gap-3 md:grid-cols-2">{profile.seoAnalysis.recommendedFixes.slice(0, 4).map((item) => <article className="rounded-xl border border-ink/10 bg-[#fbfbfa] p-4" key={`${item.problem}-${item.fix}`}><p className="text-xs font-black uppercase tracking-[.12em] text-copper">{item.priority} priority · {item.effort}</p><h3 className="mt-2 text-base font-black text-ink">{item.problem}</h3><p className="mt-2 text-sm leading-6 text-graphite/75">{item.fix}</p></article>)}</div><Link className="mt-5 inline-flex items-center gap-2 text-sm font-black text-teal-700 hover:text-ink" href="/">Open HVAC Growth OS <ArrowRight className="size-4" /></Link></Panel></section>;
}

function ResultList({ eyebrow, items }: { eyebrow: string; items: string[] }) { return <Panel><Eyebrow>{eyebrow}</Eyebrow><ul className="space-y-3">{items.slice(0, 5).map((item) => <li className="flex gap-3 text-sm leading-6 text-graphite/80" key={item}><span className="mt-2 size-2 shrink-0 rounded-full bg-amber-400" />{item}</li>)}</ul></Panel>; }
