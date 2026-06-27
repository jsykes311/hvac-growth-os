import type {
  AnalyzedPage,
  BusinessProfile,
  PpcAdGroup,
  PpcCampaign,
  PpcCsvExport,
  PpcKeyword,
  PpcLandingPageRecommendation,
  PpcManualOverrides,
  PpcPlan,
  PpcResponsiveSearchAdAsset,
} from "@/lib/types";

const NEGATIVE_KEYWORDS = [
  "jobs",
  "career",
  "salary",
  "school",
  "training",
  "certification",
  "diy",
  "manual",
  "parts",
  "wholesale",
  "used",
  "home depot",
  "lowes",
  "reddit",
  "youtube",
  "free",
  "course",
  "classes",
];

const SERVICE_ALIASES = {
  acRepair: ["ac repair", "air conditioning repair", "cooling repair"],
  hvacRepair: ["hvac repair", "hvac service", "heating and cooling repair"],
  heatingRepair: ["heating repair", "heater repair", "heating service"],
  furnaceRepair: ["furnace repair", "furnace service"],
  installation: ["installation", "replacement", "ac installation", "furnace installation"],
  heatPumps: ["heat pump", "heat pumps"],
  maintenance: ["maintenance", "tune-up", "tune up", "maintenance plan"],
  waterHeaters: ["water heater", "water heaters"],
  indoorAirQuality: ["indoor air quality", "iaq", "air quality"],
  financing: ["financing", "payment", "monthly"],
  emergency: ["emergency", "same-day", "same day", "24-hour", "24 hour"],
};

type PpcPlannerInput = {
  profile: BusinessProfile;
  websiteUrl: string;
  scrapedPages: AnalyzedPage[];
  overrides?: PpcManualOverrides;
};

export function createPpcPlan({
  profile,
  websiteUrl,
  scrapedPages,
  overrides = {},
}: PpcPlannerInput): PpcPlan {
  const businessName = clean(overrides.businessName) || profile.companyName || "HVAC Company";
  const phoneNumber = clean(overrides.phoneNumber) || profile.phone;
  const serviceCities = cleanList(overrides.serviceCities).length
    ? cleanList(overrides.serviceCities)
    : profile.serviceAreas;
  const primaryMarket = serviceCities[0] || "Primary Market";
  const services = mergeUnique(profile.services, cleanList(overrides.servicesToPrioritize));
  const normalizedServiceText = services.join(" ").toLowerCase();
  const financing = overrides.financing ?? (profile.financingMentioned || hasAny(normalizedServiceText, SERVICE_ALIASES.financing));
  const emergencyService = overrides.emergencyService ?? (profile.emergencyServiceMentioned || hasAny(normalizedServiceText, SERVICE_ALIASES.emergency));
  const maintenancePlans = profile.maintenancePlanMentioned || hasAny(normalizedServiceText, SERVICE_ALIASES.maintenance);
  const waterHeaters = hasAny(normalizedServiceText, SERVICE_ALIASES.waterHeaters);
  const heatPumps = hasAny(normalizedServiceText, SERVICE_ALIASES.heatPumps);
  const indoorAirQuality = hasAny(normalizedServiceText, SERVICE_ALIASES.indoorAirQuality);
  const monthlyBudget = normalizeBudget(overrides.monthlyBudget);
  const existingLandingPages = scrapedPages.map((page) => ({
    label: page.label,
    title: page.title,
    url: page.url,
  }));

  const detected = {
    businessName,
    phoneNumber,
    services,
    serviceCities,
    financing,
    emergencyService,
    maintenancePlans,
    waterHeaters,
    heatPumps,
    indoorAirQuality,
    trustSignals: buildTrustSignals(profile, { financing, emergencyService, maintenancePlans }),
    ctas: buildCtas(profile, { financing }),
    existingLandingPages,
  };

  const campaigns = buildCampaigns({
    businessName,
    financing,
    emergencyService,
    monthlyBudget,
    normalizedServiceText,
    primaryMarket,
  });
  const adGroups = buildAdGroups(campaigns, {
    financing,
    emergencyService,
    heatPumps,
    indoorAirQuality,
    maintenancePlans,
    normalizedServiceText,
    waterHeaters,
  });
  const keywords = buildKeywords(adGroups, businessName, primaryMarket, Boolean(overrides.broadMatchEnabled));
  const responsiveSearchAds = buildResponsiveSearchAds(adGroups, {
    businessName,
    emergencyService,
    financing,
    freeEstimates: Boolean(overrides.freeEstimates),
    licensedAndInsured: Boolean(overrides.licensedAndInsured),
    phoneNumber,
    primaryMarket,
  });
  const assets = buildAssets(adGroups, detected, websiteUrl);
  const landingPageRecommendations = buildLandingPageRecommendations(adGroups, existingLandingPages, businessName, primaryMarket);
  const report = buildReport(campaigns, landingPageRecommendations, detected, monthlyBudget, primaryMarket);
  const negativeKeywords = NEGATIVE_KEYWORDS.map((negativeKeyword) => ({
    negativeKeyword,
    matchType: "Phrase" as const,
  }));
  const csvExports = buildCsvExports({
    campaigns,
    keywords,
    negativeKeywords,
    responsiveSearchAds,
    assets,
    landingPageRecommendations,
  });

  return {
    detected,
    campaignStrategy: campaigns,
    campaigns,
    adGroups,
    keywords,
    negativeKeywords,
    responsiveSearchAds,
    assets,
    landingPageRecommendations,
    report,
    csvExports,
  };
}

function buildCampaigns({
  businessName,
  financing,
  emergencyService,
  monthlyBudget,
  normalizedServiceText,
  primaryMarket,
}: {
  businessName: string;
  financing: boolean;
  emergencyService: boolean;
  monthlyBudget: number;
  normalizedServiceText: string;
  primaryMarket: string;
}) {
  const hasAcRepair = hasAny(normalizedServiceText, SERVICE_ALIASES.acRepair);
  const hasRepair = hasAcRepair || hasAny(normalizedServiceText, SERVICE_ALIASES.hvacRepair) || hasAny(normalizedServiceText, SERVICE_ALIASES.heatingRepair);
  const hasInstall = hasAny(normalizedServiceText, SERVICE_ALIASES.installation);
  const rows: PpcCampaign[] = [
    {
      campaign: `Search | Brand | ${businessName}`,
      campaignType: "Search",
      dailyBudget: dailyBudget(monthlyBudget, 0.1),
      priority: "High",
      whyRecommended: "Protect branded demand and send existing searchers to the clearest call and booking path.",
    },
  ];

  if (hasAcRepair) {
    rows.push({
      campaign: `Search | AC Repair | ${primaryMarket}`,
      campaignType: "Search",
      dailyBudget: dailyBudget(monthlyBudget, 0.25),
      priority: "High",
      whyRecommended: "AC repair is a high-intent service supported by the scraped service profile.",
    });
  }

  if (hasRepair) {
    rows.push({
      campaign: `Search | HVAC Repair | ${primaryMarket}`,
      campaignType: "Search",
      dailyBudget: dailyBudget(monthlyBudget, 0.18),
      priority: "High",
      whyRecommended: "Captures homeowners searching for heating, cooling, and general HVAC service help.",
    });
  }

  if (hasInstall) {
    rows.push({
      campaign: `Search | Installation | ${primaryMarket}`,
      campaignType: "Search",
      dailyBudget: dailyBudget(monthlyBudget, 0.22),
      priority: "High",
      whyRecommended: "Installation and replacement searches carry strong revenue potential and align with service signals.",
    });
  }

  if (emergencyService) {
    rows.push({
      campaign: `Search | Emergency HVAC | ${primaryMarket}`,
      campaignType: "Search",
      dailyBudget: dailyBudget(monthlyBudget, 0.15),
      priority: "Medium",
      whyRecommended: "Emergency or same-day service language supports urgent search intent.",
    });
  }

  if (financing) {
    rows.push({
      campaign: `Search | Financing | ${primaryMarket}`,
      campaignType: "Search",
      dailyBudget: dailyBudget(monthlyBudget, 0.1),
      priority: "Medium",
      whyRecommended: "Financing content supports replacement searches from homeowners with budget concerns.",
    });
  }

  return rows;
}

function buildAdGroups(
  campaigns: PpcCampaign[],
  flags: {
    emergencyService: boolean;
    financing: boolean;
    heatPumps: boolean;
    indoorAirQuality: boolean;
    maintenancePlans: boolean;
    normalizedServiceText: string;
    waterHeaters: boolean;
  },
) {
  const rows: PpcAdGroup[] = [];

  for (const item of campaigns) {
    if (item.campaign.includes("| Brand |")) rows.push({ campaign: item.campaign, adGroup: "Brand" });
    if (item.campaign.includes("| AC Repair |")) {
      rows.push({ campaign: item.campaign, adGroup: "AC Repair" });
      if (flags.maintenancePlans) rows.push({ campaign: item.campaign, adGroup: "Maintenance" });
    }
    if (item.campaign.includes("| HVAC Repair |")) {
      rows.push({ campaign: item.campaign, adGroup: "HVAC Repair" });
      if (hasAny(flags.normalizedServiceText, SERVICE_ALIASES.heatingRepair)) rows.push({ campaign: item.campaign, adGroup: "Heating Repair" });
      if (hasAny(flags.normalizedServiceText, SERVICE_ALIASES.furnaceRepair)) rows.push({ campaign: item.campaign, adGroup: "Furnace Repair" });
      if (flags.indoorAirQuality) rows.push({ campaign: item.campaign, adGroup: "Indoor Air Quality" });
    }
    if (item.campaign.includes("| Installation |")) {
      rows.push({ campaign: item.campaign, adGroup: "Installation" });
      if (flags.heatPumps) rows.push({ campaign: item.campaign, adGroup: "Heat Pumps" });
      if (flags.waterHeaters) rows.push({ campaign: item.campaign, adGroup: "Water Heaters" });
    }
    if (item.campaign.includes("| Emergency HVAC |") && flags.emergencyService) {
      rows.push({ campaign: item.campaign, adGroup: "Emergency Service" });
    }
    if (item.campaign.includes("| Financing |") && flags.financing) {
      rows.push({ campaign: item.campaign, adGroup: "Financing" });
    }
  }

  return rows;
}

function buildKeywords(adGroups: PpcAdGroup[], businessName: string, city: string, broadMatchEnabled: boolean) {
  const templates: Record<string, string[]> = {
    Brand: [businessName, `${businessName} phone`, `${businessName} reviews`],
    "AC Repair": [`ac repair ${city}`, `air conditioning repair ${city}`, `fix ac ${city}`],
    "HVAC Repair": [`hvac repair ${city}`, `hvac service ${city}`, `heating and cooling repair ${city}`],
    "Heating Repair": [`heating repair ${city}`, `heater repair ${city}`, `heat repair near me`],
    "Furnace Repair": [`furnace repair ${city}`, `furnace service ${city}`, `gas furnace repair ${city}`],
    Installation: [`hvac installation ${city}`, `ac installation ${city}`, `furnace installation ${city}`],
    "Heat Pumps": [`heat pump repair ${city}`, `heat pump installation ${city}`, `heat pump service ${city}`],
    Maintenance: [`ac tune up ${city}`, `hvac maintenance ${city}`, `hvac maintenance plan ${city}`],
    "Water Heaters": [`water heater installation ${city}`, `water heater replacement ${city}`, `hvac water heater ${city}`],
    Financing: [`hvac financing ${city}`, `ac financing ${city}`, `furnace financing ${city}`],
    "Emergency Service": [`emergency hvac ${city}`, `emergency ac repair ${city}`, `same day hvac repair ${city}`],
    "Indoor Air Quality": [`indoor air quality ${city}`, `air purifier installation ${city}`, `hvac air quality ${city}`],
  };
  const rows: PpcKeyword[] = [];

  for (const group of adGroups) {
    for (const keyword of templates[group.adGroup] ?? []) {
      rows.push(keywordRow(group, `[${keyword}]`, "Exact"));
      rows.push(keywordRow(group, `"${keyword}"`, "Phrase"));
      if (broadMatchEnabled) rows.push(keywordRow(group, keyword, "Broad"));
    }
  }

  return rows;
}

function keywordRow(group: PpcAdGroup, keyword: string, matchType: PpcKeyword["matchType"]): PpcKeyword {
  return {
    campaign: group.campaign,
    adGroup: group.adGroup,
    keyword,
    matchType,
    intentLevel: matchType === "Broad" ? "Test" : group.adGroup === "Maintenance" ? "Medium" : "High",
    notes: matchType === "Broad" ? "Broad match enabled by manual override." : "No broad match by default.",
  };
}

function buildResponsiveSearchAds(
  adGroups: PpcAdGroup[],
  context: {
    businessName: string;
    emergencyService: boolean;
    financing: boolean;
    freeEstimates: boolean;
    licensedAndInsured: boolean;
    phoneNumber: string;
    primaryMarket: string;
  },
) {
  const rows: PpcResponsiveSearchAdAsset[] = [];

  for (const group of adGroups) {
    for (const headline of buildHeadlines(group.adGroup, context)) {
      rows.push({
        campaign: group.campaign,
        adGroup: group.adGroup,
        assetType: "Headline",
        text: limit(headline, 30),
        length: limit(headline, 30).length,
        notes: "Kept at 30 characters or less where possible.",
      });
    }

    for (const description of buildDescriptions(group.adGroup, context)) {
      rows.push({
        campaign: group.campaign,
        adGroup: group.adGroup,
        assetType: "Description",
        text: limit(description, 90),
        length: limit(description, 90).length,
        notes: "Avoids unverifiable claims.",
      });
    }
  }

  return rows;
}

function buildHeadlines(adGroup: string, context: { businessName: string; emergencyService: boolean; financing: boolean; freeEstimates: boolean; licensedAndInsured: boolean; primaryMarket: string }) {
  if (adGroup === "Financing") {
    return [
      `HVAC Financing ${context.primaryMarket}`,
      "Low Monthly Payments",
      "Apply For Financing",
      "Comfort Now, Pay Over Time",
      "Fast Approval Options",
      "Replace With Financing",
      "AC Financing Help",
      "Furnace Financing",
      "Budget Friendly HVAC",
      "Financing Available",
      "Start Your Application",
      "Home Comfort Financing",
      "Repair Financing",
      "Install Financing",
      "Apply Today",
    ];
  }

  const service = adGroup === "Brand" ? "HVAC Service" : adGroup;
  const base = [
    `${service} In ${context.primaryMarket}`,
    `${context.primaryMarket} HVAC Pros`,
    "Schedule Service Today",
    `Call ${context.businessName}`,
    context.emergencyService ? "Emergency HVAC Help" : "Fast HVAC Help",
    "Upfront Pricing",
    "Book HVAC Service",
    "Heating And Cooling",
    "Local HVAC Team",
    "Trusted Home Comfort",
    "Get Comfort Back",
    "Repair And Install",
    "Service For Your Home",
    "Comfort Starts Here",
    "Request Service",
  ];

  if (context.freeEstimates) base[5] = "Free Estimates";
  if (context.licensedAndInsured) base[8] = "Licensed HVAC Team";
  return base;
}

function buildDescriptions(
  adGroup: string,
  context: { businessName: string; emergencyService: boolean; financing: boolean; phoneNumber: string; primaryMarket: string },
) {
  if (adGroup === "Financing") {
    return [
      "Explore HVAC financing with manageable payments for repair or replacement.",
      `${context.businessName} helps ${context.primaryMarket} homeowners move forward.`,
      "Apply today and get options for heating and cooling projects.",
      "Keep cash available while getting the comfort your home needs.",
    ];
  }

  const service = adGroup === "Brand" ? "HVAC service" : adGroup.toLowerCase();
  const urgency = context.emergencyService ? "same-day and emergency HVAC help" : "reliable heating and cooling help";
  return [
    `Need ${service} in ${context.primaryMarket}? Call for ${urgency}.`,
    "Get clear options, upfront pricing, and a local team focused on comfort.",
    `${context.businessName} serves ${context.primaryMarket} and nearby areas.`,
    "Schedule service today and get your comfort issue moving.",
  ];
}

function buildAssets(adGroups: PpcAdGroup[], detected: PpcPlan["detected"], websiteUrl: string): PpcPlan["assets"] {
  const campaigns = Array.from(new Set(adGroups.map((group) => group.campaign)));
  const pageLookup = createPageLookup(detected.existingLandingPages, websiteUrl);
  const calloutTexts = [
    "Upfront Pricing",
    "Local HVAC Team",
    "Heating And Cooling",
    "Schedule Service",
    detected.financing ? "Financing Available" : "",
    detected.emergencyService ? "Emergency Service" : "",
    detected.maintenancePlans ? "Maintenance Plans" : "",
  ].filter(Boolean);

  return {
    callouts: campaigns.flatMap((campaign) => calloutTexts.map((callout) => ({ campaign, callout }))),
    sitelinks: campaigns.flatMap((campaign) => [
      sitelink(campaign, "Schedule Service", "Request HVAC service", "Choose a time to talk", pageLookup.contact),
      sitelink(campaign, "HVAC Financing", "See payment options", "Apply for home comfort", pageLookup.financing),
      sitelink(campaign, "Maintenance Plan", "Protect the system", "See tune-up options", pageLookup.maintenance),
      sitelink(campaign, "Service Areas", "Local HVAC help", "See nearby coverage", pageLookup.about),
    ]),
    structuredSnippets: campaigns.map((campaign) => ({
      campaign,
      header: "Services",
      values: detected.services.slice(0, 10).join(", "),
    })),
    displayPaths: adGroups.map((group) => ({
      campaign: group.campaign,
      adGroup: group.adGroup,
      path1: slugPart(detected.serviceCities[0] || "local"),
      path2: slugPart(group.adGroup),
    })),
  };
}

function buildLandingPageRecommendations(
  adGroups: PpcAdGroup[],
  existingLandingPages: PpcPlan["detected"]["existingLandingPages"],
  businessName: string,
  primaryMarket: string,
) {
  return adGroups.map((group): PpcLandingPageRecommendation => {
    const existingPage = bestLandingPage(group.adGroup, existingLandingPages);
    const needsNewPage = !existingPage;
    const recommendation = needsNewPage
      ? group.adGroup === "Water Heaters" || group.adGroup === "Emergency Service"
        ? "Create dedicated landing page; existing support is promotional or partial."
        : "Create dedicated landing page."
      : "Use existing page.";

    return {
      campaign: group.campaign,
      adGroup: group.adGroup,
      bestExistingLandingPage: existingPage?.url ?? "",
      recommendation,
      suggestedPageTitle: `${group.adGroup} in ${primaryMarket} | ${businessName}`,
      suggestedH1: `${group.adGroup} in ${primaryMarket}, GA`,
      suggestedCta: group.adGroup === "Financing" ? "Apply Today" : "Schedule Service Today",
      metaDescription: limit(
        `Need ${group.adGroup.toLowerCase()} in ${primaryMarket}? Contact ${businessName} for reliable HVAC options, clear pricing, and local service.`,
        155,
      ),
    };
  });
}

function buildReport(
  campaigns: PpcCampaign[],
  landingPages: PpcLandingPageRecommendation[],
  detected: PpcPlan["detected"],
  monthlyBudget: number,
  primaryMarket: string,
): PpcPlan["report"] {
  const missingPages = landingPages
    .filter((page) => page.recommendation.startsWith("Create"))
    .map((page) => `${page.adGroup}: ${page.suggestedPageTitle}`);

  return {
    recommendedLaunchCampaigns: campaigns.map((campaign) => `${campaign.campaign}: $${campaign.dailyBudget}/day, ${campaign.priority} priority`),
    budgetRecommendation: `Start with $${monthlyBudget.toLocaleString()}/month. Put most spend into repair and installation intent first, then scale financing and emergency campaigns after conversion data is clean.`,
    servicesPrioritized: detected.services,
    searchIntentAnalysis: [
      `Highest intent: AC repair, HVAC repair, furnace repair, emergency service, and installation searches in ${primaryMarket}.`,
      "Mid-funnel intent: financing, maintenance plan, heat pump, indoor air quality, and tune-up searches.",
      `Brand intent: protect ${detected.businessName} searches and route existing demand to calls and booking.`,
    ],
    missingLandingPages: missingPages.length ? missingPages : ["No major gaps for the initial launch set."],
    trackingRecommendations: [
      "Verify phone click, form submit, financing click, and booking events in Google Tag Manager and GA4.",
      "Use call tracking numbers at the campaign or landing-page level.",
      "Import qualified calls and submitted forms as primary Google Ads conversions.",
      "Use separate conversion actions for financing applications and maintenance plan signups.",
    ],
    nextSteps: [
      "Launch exact and phrase match only.",
      "Add the starter HVAC negative keyword list before go-live.",
      "Review search terms twice weekly for the first month.",
      "Build missing landing pages before scaling specialty campaigns.",
    ],
  };
}

function buildCsvExports(input: {
  assets: PpcPlan["assets"];
  campaigns: PpcCampaign[];
  keywords: PpcKeyword[];
  landingPageRecommendations: PpcLandingPageRecommendation[];
  negativeKeywords: PpcPlan["negativeKeywords"];
  responsiveSearchAds: PpcResponsiveSearchAdAsset[];
}): PpcCsvExport[] {
  return [
    csvExport("campaign_structure.csv", "Campaign structure", input.campaigns, {
      campaign: "Campaign",
      campaignType: "Campaign Type",
      dailyBudget: "Daily Budget",
      priority: "Priority",
      whyRecommended: "Why Recommended",
    }),
    csvExport("keywords.csv", "Keywords", input.keywords, {
      campaign: "Campaign",
      adGroup: "Ad Group",
      keyword: "Keyword",
      matchType: "Match Type",
      intentLevel: "Intent Level",
      notes: "Notes",
    }),
    csvExport("negative_keywords.csv", "Negative keywords", input.negativeKeywords, {
      negativeKeyword: "Negative Keyword",
      matchType: "Match Type",
    }),
    csvExport("responsive_search_ads.csv", "Responsive search ads", input.responsiveSearchAds, {
      campaign: "Campaign",
      adGroup: "Ad Group",
      assetType: "Asset Type",
      text: "Text",
      length: "Length",
      notes: "Notes",
    }),
    csvExport("callouts.csv", "Callouts", input.assets.callouts, {
      campaign: "Campaign",
      callout: "Callout",
    }),
    csvExport("sitelinks.csv", "Sitelinks", input.assets.sitelinks, {
      campaign: "Campaign",
      sitelinkText: "Sitelink Text",
      description1: "Description 1",
      description2: "Description 2",
      finalUrl: "Final URL",
    }),
    csvExport("landing_page_recommendations.csv", "Landing pages", input.landingPageRecommendations, {
      campaign: "Campaign",
      adGroup: "Ad Group",
      bestExistingLandingPage: "Best Existing Landing Page",
      recommendation: "Recommendation",
      suggestedPageTitle: "Suggested Page Title",
      suggestedH1: "Suggested H1",
      suggestedCta: "Suggested CTA",
      metaDescription: "Meta Description",
    }),
  ];
}

function csvExport<T extends Record<string, unknown>>(fileName: string, label: string, rows: T[], columns: Record<keyof T & string, string>): PpcCsvExport {
  const csv = toCsv(rows, columns);
  return {
    fileName,
    label,
    dataUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
  };
}

function toCsv<T extends Record<string, unknown>>(rows: T[], columns: Record<keyof T & string, string>) {
  const keys = Object.keys(columns) as Array<keyof T & string>;
  const header = keys.map((key) => csvCell(columns[key])).join(",");
  const body = rows.map((row) => keys.map((key) => csvCell(row[key])).join(","));
  return [header, ...body].join("\n");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function buildTrustSignals(
  profile: BusinessProfile,
  flags: { emergencyService: boolean; financing: boolean; maintenancePlans: boolean },
) {
  return mergeUnique(profile.differentiators, [
    profile.phone ? "Clear phone CTA" : "",
    flags.financing ? "Financing available" : "",
    flags.emergencyService ? "Emergency or same-day service" : "",
    flags.maintenancePlans ? "Maintenance plan" : "",
  ]);
}

function buildCtas(profile: BusinessProfile, flags: { financing: boolean }) {
  return ["Schedule Service Today", "Call Now", "Contact Us", flags.financing ? "Apply Today" : ""].filter(Boolean);
}

function bestLandingPage(adGroup: string, pages: PpcPlan["detected"]["existingLandingPages"]) {
  const topicMap: Record<string, string[]> = {
    Brand: ["contact", "home"],
    "AC Repair": ["ac repair", "ac-repair", "cooling"],
    "HVAC Repair": ["hvac", "service"],
    "Heating Repair": ["heating", "furnace"],
    "Furnace Repair": ["furnace"],
    Installation: ["installation", "install"],
    "Heat Pumps": ["heat pump", "heat-pump"],
    Maintenance: ["maintenance", "tune"],
    "Water Heaters": ["water heater", "water-heater"],
    Financing: ["financing"],
    "Emergency Service": ["emergency", "contact"],
    "Indoor Air Quality": ["indoor air quality", "indoor-air-quality", "iaq"],
  };
  const topics = topicMap[adGroup] ?? [adGroup.toLowerCase()];
  return pages.find((page) => {
    const haystack = `${page.label} ${page.title} ${page.url}`.toLowerCase();
    return topics.some((topic) => haystack.includes(topic));
  });
}

function createPageLookup(pages: PpcPlan["detected"]["existingLandingPages"], websiteUrl: string) {
  return {
    about: pageByTopic(pages, ["about"]) || websiteUrl,
    contact: pageByTopic(pages, ["contact"]) || websiteUrl,
    financing: pageByTopic(pages, ["financing"]) || websiteUrl,
    maintenance: pageByTopic(pages, ["maintenance"]) || websiteUrl,
  };
}

function pageByTopic(pages: PpcPlan["detected"]["existingLandingPages"], topics: string[]) {
  return pages.find((page) => topics.some((topic) => `${page.label} ${page.title} ${page.url}`.toLowerCase().includes(topic)))?.url;
}

function sitelink(campaign: string, sitelinkText: string, description1: string, description2: string, finalUrl: string) {
  return { campaign, sitelinkText, description1, description2, finalUrl };
}

function dailyBudget(monthlyBudget: number, share: number) {
  return Number(((monthlyBudget * share) / 30.4).toFixed(2));
}

function normalizeBudget(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 3000;
}

function mergeUnique(...lists: string[][]) {
  return Array.from(new Set(lists.flat().map(clean).filter(Boolean)));
}

function cleanList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => clean(String(item))).filter(Boolean) : [];
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function limit(value: string, maxLength: number) {
  return value.length <= maxLength ? value : value.slice(0, maxLength).trim();
}

function slugPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 15) || "hvac";
}
