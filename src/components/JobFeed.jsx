import { useState } from "react";
import { ExternalLink, Link, Plus, Check } from "lucide-react";
import { FEED_DATE, FEED_JOBS } from "../data/feedData";

const TIER_CONFIG = {
  top:     { label: "🎯 Top Priority",    scoreRange: "8–10", border: "#c98a3e", badge: "#c98a3e", badgeBg: "#c98a3e22" },
  strong:  { label: "✅ Strong Match",    scoreRange: "6–7",  border: "#3e7dc9", badge: "#3e7dc9", badgeBg: "#3e7dc922" },
  monitor: { label: "📋 Worth Monitoring", scoreRange: "4–5", border: "#6b6759", badge: "#8a8578", badgeBg: "#8a857822" },
};

const TAG_COLORS = {
  "AI-native": "#a83ec9", "AI": "#a83ec9", "AI Unicorn": "#a83ec9", "LLM": "#a83ec9",
  "Design Engineer": "#3e7dc9", "React": "#3e7dc9",
  "India": "#3ec97a", "India Remote": "#3ec97a",
  "Remote": "#6b6b6b", "Global Remote": "#6b6b6b",
  "Lead": "#c98a3e", "Staff": "#c98a3e", "Senior": "#8a8578",
  "Design Systems": "#3e7dc9",
};

function tagColor(tag) {
  for (const key of Object.keys(TAG_COLORS)) {
    if (tag.includes(key)) return TAG_COLORS[key];
  }
  return "#4a4738";
}

export default function JobFeed({ onAddToTracker }) {
  const [added, setAdded] = useState({});
  const top     = FEED_JOBS.filter((j) => j.tier === "top");
  const strong  = FEED_JOBS.filter((j) => j.tier === "strong");
  const monitor = FEED_JOBS.filter((j) => j.tier === "monitor");

  const totalSalaryJobs = FEED_JOBS.filter((j) => j.salary !== "Unlisted").length;
  const topPick = FEED_JOBS[0];

  const handleAdd = async (job) => {
    await onAddToTracker(job);
    setAdded((prev) => ({ ...prev, [job.id]: true }));
  };

  return (
    <div className="space-y-8">
      {/* ── Summary bar ── */}
      <div className="bg-[#1d1c15] border border-[#2e2c22] rounded-lg px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c98a3e]">daily digest</p>
            <p className="text-lg font-semibold mt-0.5">
              {new Date(FEED_DATE).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-5 text-center">
            <div>
              <p className="text-2xl font-semibold">{FEED_JOBS.length}</p>
              <p className="text-[10px] text-[#6b6759] uppercase tracking-wide">roles found</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{top.length}</p>
              <p className="text-[10px] text-[#6b6759] uppercase tracking-wide">top picks</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalSalaryJobs}</p>
              <p className="text-[10px] text-[#6b6759] uppercase tracking-wide">salary listed</p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#2e2c22] pt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-[#6b6759]">Top pick today:</span>
          <span className="text-[#e8e3d3] font-medium">{topPick.company} — {topPick.role}</span>
          <span className="text-[#6b6759]">Apply to today:</span>
          <span className="text-[#c98a3e]">{top.slice(0, 3).map((j) => j.company).join(" · ")}</span>
        </div>
      </div>

      {/* ── Sources note ── */}
      <p className="text-[11px] text-[#4a4738] -mt-4">
        Sources: TopStartups · YC Work at a Startup · Greenhouse · Lovable Careers · Built In · UIUX Jobs Board · LinkedIn · Remotive
      </p>

      {/* ── Tier sections ── */}
      {[{ key: "top", jobs: top }, { key: "strong", jobs: strong }, { key: "monitor", jobs: monitor }].map(({ key, jobs }) => (
        <TierSection key={key} tier={key} jobs={jobs} added={added} onAdd={handleAdd} />
      ))}

      {/* ── Weekly actions ── */}
      <WeeklyActions />
    </div>
  );
}

function TierSection({ tier, jobs, added, onAdd }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold">{cfg.label}</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: cfg.badge, background: cfg.badgeBg }}>
          Score {cfg.scoreRange}
        </span>
        <span className="text-[10px] text-[#4a4738]">{jobs.length} role{jobs.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} added={added[job.id]} onAdd={onAdd} tier={tier} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, added, onAdd, tier }) {
  const cfg = TIER_CONFIG[tier];

  return (
    <div
      className="bg-[#1d1c15] border rounded-lg overflow-hidden"
      style={{ borderColor: "#2e2c22", borderLeftWidth: 3, borderLeftColor: cfg.badge }}
    >
      {/* Main row */}
      <div className="px-4 py-3 flex items-start gap-4">
        {/* Score */}
        <div
          className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold"
          style={{ background: cfg.badgeBg, color: cfg.badge }}
        >
          {job.score}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{job.company}</p>
            <span className="text-[#6b6759]">—</span>
            <p className="text-sm text-[#c4bfb0]">{job.role}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-[11px] text-[#6b6759]">
            <span>{job.location}</span>
            {job.salary !== "Unlisted" && (
              <span className="text-[#3ec97a] font-medium">{job.salary}</span>
            )}
          </div>
          {/* Match reason */}
          <p className="text-[12px] text-[#8a8578] mt-1.5 leading-relaxed">{job.matchReason}</p>
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {job.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ color: tagColor(t), background: tagColor(t) + "22" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <button
            onClick={() => onAdd(job)}
            disabled={added}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap"
            style={
              added
                ? { background: "#3ec97a22", color: "#3ec97a" }
                : { background: "#c98a3e22", color: "#c98a3e" }
            }
          >
            {added ? <Check size={11} /> : <Plus size={11} />}
            {added ? "Added" : "Add to Tracker"}
          </button>
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-[#3e7dc9] hover:underline"
          >
            View JD <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Contact row */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-[#4a4738]">Contact:</span>
        <a
          href={job.contact.linkedin}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-[#8a8578] hover:text-[#e8e3d3] transition-colors"
        >
          <Link size={11} />
          <span className="font-medium">{job.contact.name}</span>
          <span className="text-[#4a4738]">· {job.contact.title}</span>
        </a>
      </div>
    </div>
  );
}

function WeeklyActions() {
  const today = new Date(FEED_DATE);
  const isFriday = today.getDay() === 5;
  if (!isFriday) return null;

  return (
    <div className="bg-[#1d1c15] border border-[#2e2c22] rounded-lg px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#c98a3e] mb-2">🔄 Friday Weekly Actions</p>
      <ul className="text-sm text-[#8a8578] space-y-1.5 list-disc list-inside">
        <li>Check previously flagged roles — are Cortex, Respan, GoCharting still open?</li>
        <li>Cold outreach candidates: Circle (Sid Yadav), Fireflies AI (Sam Udotong), Cortex (Anish Dhar)</li>
        <li>Add to monitoring: Vercel (Design Engineer), Intercom (Sr. Product Designer)</li>
      </ul>
    </div>
  );
}
