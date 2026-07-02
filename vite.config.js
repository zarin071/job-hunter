import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFRESH_SCRIPT = path.join(__dirname, "scripts/refresh-feed.mjs");
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function feedRefreshPlugin() {
  function runRefresh(label) {
    console.log(`\n[feed] ${label}`);
    const proc = spawn("node", [REFRESH_SCRIPT], { stdio: "inherit" });
    proc.on("error", (err) => console.error("[feed] spawn error:", err.message));
  }

  return {
    name: "feed-refresh",
    configureServer(server) {
      // Refresh immediately when dev server starts
      runRefresh("Startup refresh…");

      // Refresh every 12 hours while dev server is running
      const timer = setInterval(
        () => runRefresh("12-hour refresh…"),
        TWELVE_HOURS
      );

      server.httpServer?.on("close", () => clearInterval(timer));
    },
  };
}

export default defineConfig({
  plugins: [react(), feedRefreshPlugin()],
  base: "/job-tracker/",
});
