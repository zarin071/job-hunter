import { useState } from "react";
import { useAuth } from "../firebase/AuthContext";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#15140f] text-[#e8e3d3] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#c98a3e] mb-2 text-center">
          role roster
        </p>
        <h1 className="text-2xl font-semibold text-center mb-8">The Hunt Log</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6759]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-[#1d1c15] border border-[#2e2c22] rounded-md pl-9 pr-3 py-2.5 text-sm placeholder:text-[#6b6759] focus:outline-none focus:border-[#c98a3e]"
            />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6759]" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#1d1c15] border border-[#2e2c22] rounded-md pl-9 pr-3 py-2.5 text-sm placeholder:text-[#6b6759] focus:outline-none focus:border-[#c98a3e]"
            />
          </div>

          {error && <p className="text-xs text-[#e06e54]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#c98a3e] hover:bg-[#e09c4a] text-[#15140f] py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            {!busy && <ArrowRight size={14} />}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          className="w-full text-center text-xs text-[#8a8578] hover:text-[#e8e3d3] mt-5"
        >
          {mode === "login"
            ? "First time here? Create an account"
            : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
