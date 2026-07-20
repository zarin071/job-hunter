import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFRESH_SCRIPT = path.join(__dirname, "scripts/refresh-feed.mjs");
const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

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

      // Refresh once a month while dev server is running
      const timer = setInterval(
        () => runRefresh("Monthly refresh…"),
        ONE_MONTH
      );

      server.httpServer?.on("close", () => clearInterval(timer));
    },
  };
}

export default defineConfig({
  plugins: [react(), feedRefreshPlugin()],
  base: "/job-hunter/",
});
