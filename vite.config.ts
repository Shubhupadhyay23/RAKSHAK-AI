import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: any[] = [react()];

  // Only add Express plugin in development
  if (mode === "development") {
    plugins.push(expressPlugin());
  }

  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      // Dynamically import server only in dev mode
      try {
        const { createServer } = await import("./server");
        const app = createServer();
        server.middlewares.use(app);
      } catch (error: any) {
        console.warn("[Dev Server] Express middleware not available:", error.message);
      }
    },
  };
}
