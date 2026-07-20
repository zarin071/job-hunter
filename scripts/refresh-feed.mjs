/**
 * refresh-feed.mjs
 * Fetches live remote design roles from Jobicy's public API,
 * scores them against Zarin's profile, and writes src/data/feedData.js.
 * Runs on `npm run dev` start + once a month while dev server is running.
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/data/feedData.js");

// ─── Scoring config ────────────────────────────────────────────────────────────

const MUST_HAVE = [
  "product designer", "ux designer", "ui designer", "design engineer",
  "founding designer", "design lead", "lead designer", "staff designer",
  "design systems", "ui/ux", "ux/ui", "conversational designer",
  "design technologist",
];

const BOOST = [
  "ai", "llm", "figma", "react", "cursor", "tailwind", "framer",
  "design system", "design engineer", "startup", "interaction",
  "0 to 1", "zero to one", "founding", "staff", "lead", "principal",
  // Archetype signals Zarin is targeting
  "production react", "typescript", "token", "component library",
  "conversational", "generative", "gen-ai", "genai", "b2b", "b2c",
];

// Roles that clearly land in one of Zarin's four target archetypes get an
// extra point so they rank above generic product-design listings.
const TARGET_ARCHETYPE_RE =
  /design engineer|design technologist|production react|ships production|design system|token|component library|conversational|gen[- ]?ai|generative|\bllm\b|ai[- ]native/;

const BLOCKERS = [
  "game design", "gameplay", "3d artist", "cad designer", "autocad",
  "prepress", "animation studio", "video editor", "broadcast designer",
];

// Title-level blockers (checked against title only, not full description)
const TITLE_BLOCKERS = ["junior", "internship", "intern ", " intern"];

const INDIA_BOOST = ["india", "apac", "worldwide", "anywhere", "global"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function scoreJob(j) {
  const title = (j.jobTitle || "").toLowerCase();
  const level = (j.jobLevel || "").toLowerCase();
  const desc = stripHtml(j.jobDescription || j.jobExcerpt || "").toLowerCase();
  const text = `${title} ${desc}`;
  const geo = (j.jobGeo || "").toLowerCase();

  // Hard blocks on full text
  if (BLOCKERS.some((b) => text.includes(b))) return 0;

  // Title-level blocks (junior/internship)
  if (TITLE_BLOCKERS.some((b) => ` ${title} `.includes(b))) return 0;
  if (level.includes("entry")) return 0;

  // Must match at least one design keyword in title
  if (!MUST_HAVE.some((kw) => title.includes(kw))) return 0;

  let pts = 3; // base score

  // Boost: cap at 3 total from keyword matches
  let boostPts = 0;
  for (const kw of BOOST) {
    if (text.includes(kw)) boostPts++;
    if (boostPts >= 3) break;
  }
  pts += boostPts;

  // Salary boost
  const salMin = parseSalaryUSD(j);
  if (salMin && salMin >= 100000) pts++;
  if (salMin && salMin >= 160000) pts++;

  // Level boost
  if (level.includes("staff") || level.includes("principal")) pts += 2;
  else if (level.includes("senior") || level.includes("lead")) pts++;

  // India / APAC / worldwide boost
  if (INDIA_BOOST.some((loc) => geo.includes(loc))) pts++;

  // Target-archetype boost (Design Engineer / Design Systems / AI Product)
  if (TARGET_ARCHETYPE_RE.test(text)) pts++;

  return Math.min(pts, 10);
}

// Buckets a role into one of Zarin's four target archetypes.
function archetypeFromJob(j) {
  const text = `${j.jobTitle} ${stripHtml(j.jobExcerpt || j.jobDescription || "")}`.toLowerCase();
  if (/design engineer|design technologist|production react|ships production|front[- ]?end|typescript|\breact\b/.test(text)) return "Design Engineer";
  if (/design system|token|component library|primitives/.test(text)) return "Design Systems";
  if (/\bai\b|\bllm\b|gen[- ]?ai|generative|conversational|prompt|ai[- ]native/.test(text)) return "AI Product";
  return "Generalist";
}

function parseSalaryUSD(j) {
  if (!j.salaryMin) return null;
  const currency = (j.salaryCurrency || "").toUpperCase();
  const period = (j.salaryPeriod || "").toLowerCase();
  let annual = parseFloat(j.salaryMin);
  if (period === "hourly") annual *= 2080;
  if (period === "monthly") annual *= 12;
  // Rough conversion
  if (currency === "GBP") annual *= 1.27;
  if (currency === "EUR") annual *= 1.09;
  if (currency === "CAD") annual *= 0.73;
  return annual;
}

function formatSalary(j) {
  if (!j.salaryMin) return "Unlisted";
  const cur = j.salaryCurrency || "USD";
  const sym = cur === "USD" ? "$" : cur === "GBP" ? "£" : cur === "EUR" ? "€" : cur + " ";
  const period = (j.salaryPeriod || "").toLowerCase();
  const fmt = (n) => {
    const k = Math.round(n / 1000);
    return k >= 10 ? `${k}K` : `${Math.round(n)}`;
  };
  const base = `${sym}${fmt(j.salaryMin)}${j.salaryMax ? `–${sym}${fmt(j.salaryMax)}` : ""}`;
  if (period === "hourly") return `${base}/hr`;
  if (period === "monthly") return `${base}/mo`;
  return base; // yearly assumed
}

function tierFromScore(pts) {
  if (pts >= 8) return "top";
  if (pts >= 6) return "strong";
  return "monitor";
}

function emailTypeFromTitle(title) {
  const t = title.toLowerCase();
  if (t.includes("founding")) return "Founding";
  if (t.includes("engineer") || t.includes("technologist")) return "Design Eng";
  return "Senior";
}

function tagsFromJob(j) {
  const text = `${j.jobTitle} ${j.jobExcerpt || ""}`.toLowerCase();
  const t = [];
  if (text.includes("design system")) t.push("Design Systems");
  if (text.includes("engineer") || text.includes("technologist")) t.push("Design Engineer");
  if (text.includes("ai") || text.includes("llm")) t.push("AI");
  if (text.includes("react")) t.push("React");
  const geo = (j.jobGeo || "").toLowerCase();
  if (geo.includes("india") || geo.includes("apac")) t.push("India");
  if (text.includes("founding") || text.includes("first designer")) t.push("Founding");
  const level = (j.jobLevel || "").toLowerCase();
  if (level.includes("staff") || level.includes("principal") || text.includes("staff")) t.push("Staff");
  else if (level.includes("senior") || text.includes("senior")) t.push("Senior");
  if (text.includes("lead")) t.push("Lead");
  t.push("Remote");
  return [...new Set(t)];
}

function remoteTypeFromJob(j) {
  const geo = (j.jobGeo || "").toLowerCase();
  if (geo.includes("india")) return "India Remote";
  if (geo.includes("dubai") || geo.includes("uae") || geo.includes("gulf")) return "Gulf / Dubai";
  return "Global Remote";
}

function matchReasonFromJob(j, pts) {
  const text = `${j.jobTitle} ${stripHtml(j.jobExcerpt || j.jobDescription || "")}`.toLowerCase();
  const reasons = [];
  if (text.includes("design system")) reasons.push("design systems scope");
  if (text.includes("ai") || text.includes("llm")) reasons.push("AI-native workflow");
  if (text.includes("react") || text.includes("engineer")) reasons.push("code/design boundary");
  if (text.includes("founding") || text.includes("first designer")) reasons.push("founding design role");
  if (text.includes("figma")) reasons.push("Figma-first stack");
  if (text.includes("startup")) reasons.push("startup environment");
  if (pts >= 9) reasons.push("top-tier match for your hybrid profile");
  if (reasons.length === 0) reasons.push("strong product design role");
  return `${j.companyName} — ${reasons.join(", ")}.`;
}

// ─── Fetch ─────────────────────────────────────────────────────────────────────

const TAGS = ["designer", "product-designer", "ux-designer", "ui-designer", "design-engineer", "design-systems"];

async function fetchJobicy() {
  const seen = new Set();
  const all = [];
  await Promise.all(
    TAGS.map(async (tag) => {
      try {
        const res = await fetch(
          `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${tag}`,
          { headers: { "User-Agent": "hunt-log/1.0" }, signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) return;
        const data = await res.json();
        for (const j of data.jobs || []) {
          if (!seen.has(j.id)) { seen.add(j.id); all.push(j); }
        }
      } catch (e) {
        console.warn(`[feed] tag=${tag} failed:`, e.message);
      }
    })
  );
  return all;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("[feed] Refreshing daily feed…");
  const jobs = await fetchJobicy();
  console.log(`[feed] Fetched ${jobs.length} raw roles from Jobicy`);

  const scored = jobs
    .map((j) => ({ j, pts: scoreJob(j) }))
    .filter(({ pts }) => pts >= 4)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 24);

  if (scored.length === 0) {
    console.warn("[feed] No matching roles — keeping existing feedData.js");
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const feedJobs = scored.map(({ j, pts }) => ({
    id: `live-${j.id}`,
    company: j.companyName,
    role: j.jobTitle,
    location: j.jobGeo || "Remote",
    remoteType: remoteTypeFromJob(j),
    salary: formatSalary(j),
    score: pts,
    tier: tierFromScore(pts),
    matchReason: matchReasonFromJob(j, pts),
    contact: {
      name: `${j.companyName} Careers`,
      title: "Hiring Team",
      linkedin: `https://www.linkedin.com/company/${j.companyName.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, "")}/jobs`,
    },
    url: j.url,
    tags: tagsFromJob(j),
    archetype: archetypeFromJob(j),
    emailType: emailTypeFromTitle(j.jobTitle),
  }));

  // Prioritise India-based roles above the rest (score order preserved within each group)
  const isIndiaJob = (j) =>
    `${j.location} ${j.remoteType} ${j.tags.join(" ")}`.toLowerCase().includes("india");
  feedJobs.sort((a, b) => Number(isIndiaJob(b)) - Number(isIndiaJob(a)));

  const topCount = feedJobs.filter((j) => j.tier === "top").length;
  const strongCount = feedJobs.filter((j) => j.tier === "strong").length;
  const monitorCount = feedJobs.filter((j) => j.tier === "monitor").length;

  const src = `// Auto-generated by scripts/refresh-feed.mjs — do not edit by hand
// Last refreshed: ${new Date().toISOString()}

export const FEED_DATE = "${today}";

// tier: "top" = 8-10 | "strong" = 6-7 | "monitor" = 4-5
export const FEED_JOBS = ${JSON.stringify(feedJobs, null, 2)};
`;

  writeFileSync(OUT, src, "utf-8");
  console.log(
    `[feed] ✓ ${feedJobs.length} roles written (${topCount} top, ${strongCount} strong, ${monitorCount} monitor)`
  );
}

run().catch((e) => {
  console.error("[feed] Fatal:", e);
  process.exit(1);
});
