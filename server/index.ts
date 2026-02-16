import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import * as eventsRoutes from "./routes/events";
import * as alertsRoutes from "./routes/alerts";
import * as ingestionRoutes from "./routes/ingestion";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  // Demo route (for testing)
  app.get("/api/demo", handleDemo);

  // Events routes
  app.get("/api/events", eventsRoutes.getEvents);
  app.get("/api/events/:id", eventsRoutes.getEvent);
  app.post("/api/events", eventsRoutes.createEvent);
  app.get("/api/events/type/:type", eventsRoutes.getEventsByType);
  app.get("/api/events/severity/:severity", eventsRoutes.getEventsBySeverity);

  // Alerts routes
  app.get("/api/alerts", alertsRoutes.getAlerts);
  app.get("/api/alerts/:id", alertsRoutes.getAlert);
  app.post("/api/alerts/:id/generate", alertsRoutes.generateAction);
  app.patch("/api/alerts/:id", alertsRoutes.updateAlert);
  app.post("/api/alerts/:id/acknowledge", alertsRoutes.acknowledgeAlert);
  app.post("/api/alerts/:id/resolve", alertsRoutes.resolveAlert);

  // Ingestion routes
  app.post("/api/ingestion/firms", ingestionRoutes.triggerFIRMSIngestion);
  app.get("/api/ingestion/status", ingestionRoutes.getIngestionStatus);

  return app;
}
