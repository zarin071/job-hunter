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
} from "lucide-react";

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

  useEffect(() => {
    const q = query(collection(db, "jobEntries"), where("uid", "==", OWNER_ID));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.updated?.seconds || 0) - (a.updated?.seconds || 0));
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
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c98a3e] mb-2">
              role roster
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">The Hunt Log</h1>
            <p className="text-sm text-[#8a8578] mt-1">
              Staff / Lead Product Design · Design Systems · AI Product Design · Design Engineer
            </p>
          </div>
          <button
            onClick={addNew}
            className="flex items-center gap-2 bg-[#c98a3e] hover:bg-[#e09c4a] text-[#15140f] px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add role
          </button>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6759]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, contact…"
            className="w-full bg-[#1d1c15] border border-[#2e2c22] rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-[#6b6759] focus:outline-none focus:border-[#c98a3e]"
          />
        </div>

        {/* Stage filters */}
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

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="border border-dashed border-[#2e2c22] rounded-lg py-16 text-center">
            <p className="text-[#6b6759] text-sm">
              {entries.length === 0
                ? "No roles logged yet. Hit 'Add role' to start."
                : "Nothing matches that filter."}
            </p>
          </div>
        )}

        {/* Entry list */}
        <div className="space-y-2">
          {filtered.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              isEditing={editing === e.id}
              onToggle={() => setEditing(editing === e.id ? null : e.id)}
              onChange={(patch) => update(e.id, patch)}
              onDelete={() => remove(e.id)}
            />
          ))}
        </div>

        <footer className="mt-10 text-center text-[10px] text-[#4a4738] tracking-wide">
          synced to Firebase · {entries.length} role{entries.length !== 1 ? "s" : ""} tracked
        </footer>
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
