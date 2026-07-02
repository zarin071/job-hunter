import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  Plus,
  ExternalLink,
  Trash2,
  Search,
  ChevronDown,
  IndianRupee,
  Globe,
  Building2,
  Mail,
  Copy,
  Check,
  Rss,
  ClipboardList,
} from "lucide-react";
import JobFeed from "./JobFeed";

const EMAIL_TYPES = ["Founding", "Design Eng", "Senior"];

function buildEmail(type, { company, role, contactName }) {
  const hi = contactName ? `Hi ${contactName.split(" ")[0]},` : "Hi,";
  const co = company || "[Company]";
  const ro = role || "this role";

  if (type === "Founding") return `Subject: Founding Designer — Zarin Solanki

${hi}

I came across ${co} and wanted to reach out directly. With 10+ years in product and UX design — owning end-to-end design at early-stage and growth-stage products — I think I'd be a strong first design hire.

I move fast between strategy and pixels: systems thinking, interaction craft, and shipping real product.

Portfolio (WIP): zortfolio.framer.website
LinkedIn: linkedin.com/in/zarin-solanki

Would love a 15-minute conversation if there's a fit.

— Zarin`;

  if (type === "Design Eng") return `Subject: Design Engineer — Zarin Solanki

${hi}

I'm a designer who codes — 10+ years in UI/UX with strong Figma-to-production fluency, design systems, and a genuine interest in working at the code boundary. Saw ${co} is hiring a ${ro} and wanted to reach out directly.

Portfolio: zortfolio.framer.website
LinkedIn: linkedin.com/in/zarin-solanki

If you're still evaluating candidates, I'd love 15 minutes.

— Zarin`;

  return `Subject: Senior Product Designer — Zarin Solanki

${hi}

I've spent 10+ years designing at the intersection of complex systems and user clarity — design systems, 0-to-1 product, and AI-native workflows. Saw ${co} is hiring a ${ro} and the work resonated.

I work fully remote and am available now.

Portfolio: zortfolio.framer.website
LinkedIn: linkedin.com/in/zarin-solanki

Open to a short call if timing works.

— Zarin`;
}

const OWNER_ID = "zarin-solo"; // fixed ID — no login needed
const STAGES = ["Researching", "Contacted", "Replied", "Interviewing", "Offer", "Closed"];
const STAGE_COLOR = {
  Researching: "#8a8578",
  Contacted: "#c98a3e",
  Replied: "#3e7dc9",
  Interviewing: "#a83ec9",
  Offer: "#3ec97a",
  Closed: "#6b6b6b",
};
const REMOTE_TYPES = ["India Remote", "Global Remote", "Gulf / Dubai", "Pune Hybrid", "Other"];

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("tracker"); // "tracker" | "feed"

  useEffect(() => {
    const q = query(collection(db, "jobEntries"), where("uid", "==", OWNER_ID));
    let firstLoad = true;
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.updated?.seconds || 0) - (a.updated?.seconds || 0));
        if (firstLoad) {
          firstLoad = false;
          rows
            .filter((e) => !e.company?.trim() && !e.role?.trim())
            .forEach((e) => deleteDoc(doc(db, "jobEntries", e.id)));
        }
        setEntries(rows);
        setLoaded(true);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoaded(true);
      }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => (filter === "All" ? true : e.stage === filter))
      .filter((e) => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return (
          (e.company || "").toLowerCase().includes(q) ||
          (e.role || "").toLowerCase().includes(q) ||
          (e.contactName || "").toLowerCase().includes(q)
        );
      });
  }, [entries, filter, searchQuery]);

  const counts = useMemo(() => {
    const c = { All: entries.length };
    STAGES.forEach((s) => (c[s] = entries.filter((e) => e.stage === s).length));
    return c;
  }, [entries]);

  const addNew = async () => {
    const docRef = await addDoc(collection(db, "jobEntries"), {
      uid: OWNER_ID,
      company: "",
      role: "",
      remoteType: "India Remote",
      salary: "",
      contactName: "",
      contactChannel: "",
      jdLink: "",
      stage: "Researching",
      notes: "",
      emailType: "Founding",
      updated: serverTimestamp(),
    });
    setEditing(docRef.id);
  };

  const update = async (id, patch) => {
    await updateDoc(doc(db, "jobEntries", id), { ...patch, updated: serverTimestamp() });
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, "jobEntries", id));
    if (editing === id) setEditing(null);
  };

  const addFromFeed = async (job) => {
    const docRef = await addDoc(collection(db, "jobEntries"), {
      uid: OWNER_ID,
      company: job.company,
      role: job.role,
      remoteType: job.remoteType || "Global Remote",
      salary: job.salary !== "Unlisted" ? job.salary : "",
      contactName: job.contact.name,
      contactChannel: job.contact.linkedin,
      jdLink: job.url,
      stage: "Researching",
      notes: job.matchReason,
      emailType: job.emailType || "Senior",
      updated: serverTimestamp(),
    });
    setActiveTab("tracker");
    setEditing(docRef.id);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#15140f] flex items-center justify-center">
        <p className="text-[#8a8578] text-sm tracking-wide">loading roster…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15140f] text-[#e8e3d3] font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c98a3e] mb-2">
              role roster
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">The Hunt Log</h1>
            <p className="text-sm text-[#8a8578] mt-1">
              Staff / Lead Product Design · Design Systems · AI Product Design · Design Engineer
            </p>
          </div>
          {activeTab === "tracker" && (
            <button
              onClick={addNew}
              className="flex items-center gap-2 bg-[#c98a3e] hover:bg-[#e09c4a] text-[#15140f] px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add role
            </button>
          )}
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#1d1c15] border border-[#2e2c22] rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "tracker"
                ? "bg-[#2e2c22] text-[#e8e3d3]"
                : "text-[#6b6759] hover:text-[#8a8578]"
            }`}
          >
            <ClipboardList size={14} />
            My Tracker
            <span className="text-[10px] opacity-60">{entries.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "feed"
                ? "bg-[#2e2c22] text-[#e8e3d3]"
                : "text-[#6b6759] hover:text-[#8a8578]"
            }`}
          >
            <Rss size={14} />
            Daily Feed
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c98a3e22] text-[#c98a3e]">21 new</span>
          </button>
        </div>

        {/* ── TRACKER TAB ── */}
        {activeTab === "tracker" && (
          <>
            <div className="relative mb-6">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6759]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, role, contact…"
                className="w-full bg-[#1d1c15] border border-[#2e2c22] rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-[#6b6759] focus:outline-none focus:border-[#c98a3e]"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {["All", ...STAGES].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filter === s
                      ? "bg-[#e8e3d3] text-[#15140f] border-[#e8e3d3]"
                      : "border-[#2e2c22] text-[#8a8578] hover:border-[#4a4738]"
                  }`}
                >
                  {s} <span className="opacity-60">{counts[s] ?? 0}</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="border border-dashed border-[#2e2c22] rounded-lg py-16 text-center">
                <p className="text-[#6b6759] text-sm">
                  {entries.length === 0
                    ? "No roles logged yet. Hit 'Add role' or browse the Daily Feed."
                    : "Nothing matches that filter."}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {filtered.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  isEditing={editing === e.id}
                  onToggle={() => {
                    if (editing === e.id && !e.company?.trim() && !e.role?.trim()) {
                      remove(e.id);
                    } else {
                      setEditing(editing === e.id ? null : e.id);
                    }
                  }}
                  onChange={(patch) => update(e.id, patch)}
                  onDelete={() => remove(e.id)}
                />
              ))}
            </div>

            <footer className="mt-10 text-center text-[10px] text-[#4a4738] tracking-wide">
              synced to Firebase · {entries.length} role{entries.length !== 1 ? "s" : ""} tracked
            </footer>
          </>
        )}

        {/* ── DAILY FEED TAB ── */}
        {activeTab === "feed" && (
          <JobFeed onAddToTracker={addFromFeed} />
        )}
      </div>
    </div>
  );
}

function EntryCard({ entry, isEditing, onToggle, onChange, onDelete }) {
  return (
    <div className="bg-[#1d1c15] border border-[#2e2c22] rounded-lg overflow-hidden">
      {/* Row summary */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#211f17]"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: STAGE_COLOR[entry.stage] }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {entry.company || "Untitled company"}{" "}
            <span className="text-[#6b6759] font-normal">
              {entry.role ? `— ${entry.role}` : ""}
            </span>
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-[#8a8578] hidden sm:inline shrink-0">
          {entry.remoteType}
        </span>
        <span
          className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full shrink-0"
          style={{
            color: STAGE_COLOR[entry.stage],
            backgroundColor: STAGE_COLOR[entry.stage] + "1a",
          }}
        >
          {entry.stage}
        </span>
        <ChevronDown
          size={15}
          className={`text-[#6b6759] transition-transform shrink-0 ${isEditing ? "rotate-180" : ""}`}
        />
      </div>

      {/* Expanded edit form */}
      {isEditing && (
        <div className="px-4 pb-4 pt-1 border-t border-[#2e2c22] grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Company" icon={<Building2 size={12} />}>
            <input
              value={entry.company}
              onChange={(e) => onChange({ company: e.target.value })}
              className="input"
              placeholder="e.g. Figma"
            />
          </Field>
          <Field label="Role title">
            <input
              value={entry.role}
              onChange={(e) => onChange({ role: e.target.value })}
              className="input"
              placeholder="e.g. Staff Product Designer"
            />
          </Field>
          <Field label="Remote type" icon={<Globe size={12} />}>
            <select
              value={entry.remoteType}
              onChange={(e) => onChange({ remoteType: e.target.value })}
              className="input"
            >
              {REMOTE_TYPES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Salary band" icon={<IndianRupee size={12} />}>
            <input
              value={entry.salary}
              onChange={(e) => onChange({ salary: e.target.value })}
              className="input"
              placeholder="e.g. 45–55 LPA / $130–150k"
            />
          </Field>
          <Field label="Contact name">
            <input
              value={entry.contactName}
              onChange={(e) => onChange({ contactName: e.target.value })}
              className="input"
              placeholder="Hiring manager / recruiter name"
            />
          </Field>
          <Field label="Contact channel">
            <input
              value={entry.contactChannel}
              onChange={(e) => onChange({ contactChannel: e.target.value })}
              className="input"
              placeholder="LinkedIn URL / email address"
            />
          </Field>
          <Field label="JD link">
            <input
              value={entry.jdLink}
              onChange={(e) => onChange({ jdLink: e.target.value })}
              className="input"
              placeholder="https://…"
            />
          </Field>
          <Field label="Stage">
            <select
              value={entry.stage}
              onChange={(e) => onChange({ stage: e.target.value })}
              className="input"
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea
                value={entry.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                className="input min-h-[60px] resize-y"
                placeholder="Outreach sent, referral name, interview notes…"
              />
            </Field>
          </div>

          {/* Cold email panel */}
          <div className="md:col-span-2">
            <ColdEmailPanel entry={entry} onChange={onChange} />
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-1">
            {entry.jdLink ? (
              <a
                href={entry.jdLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#3e7dc9] hover:underline flex items-center gap-1"
              >
                Open JD <ExternalLink size={11} />
              </a>
            ) : (
              <span />
            )}
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-[#c9573e] hover:text-[#e06e54]"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          background: #15140f;
          border: 1px solid #2e2c22;
          border-radius: 6px;
          padding: 7px 10px;
          font-size: 13px;
          color: #e8e3d3;
        }
        .input:focus {
          outline: none;
          border-color: #c98a3e;
        }
        .input::placeholder {
          color: #4a4738;
        }
      `}</style>
    </div>
  );
}

function ColdEmailPanel({ entry, onChange }) {
  const [copied, setCopied] = useState(false);
  const type = entry.emailType || "Founding";
  const emailText = buildEmail(type, entry);

  const copy = () => {
    navigator.clipboard?.writeText(emailText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-[#2e2c22] rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#15140f] border-b border-[#2e2c22]">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#6b6759]">
          <Mail size={11} />
          Cold email
        </span>
        <div className="flex gap-1">
          {EMAIL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ emailType: t })}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                type === t
                  ? "bg-[#c98a3e] text-[#15140f]"
                  : "text-[#6b6759] hover:text-[#8a8578]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Email body */}
      <div className="relative">
        <pre className="px-3 py-3 text-[12px] text-[#c4bfb0] leading-relaxed whitespace-pre-wrap font-mono">
          {emailText}
        </pre>
        <button
          onClick={copy}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[#2e2c22] hover:bg-[#3a3828] text-[#8a8578] hover:text-[#e8e3d3] transition-colors"
        >
          {copied ? <Check size={11} className="text-[#3ec97a]" /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-[#6b6759] mb-1 flex items-center gap-1">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
