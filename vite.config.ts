import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// `lovable-tagger` is a Lovable-only development aid; it is imported lazily so a
// plain checkout (or a CI build) never depends on it being installed.
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger() as never);
    } catch {
      // Not installed locally: development still works.
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: false,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
