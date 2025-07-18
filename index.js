var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  crafts: () => crafts,
  events: () => events,
  insertCraftSchema: () => insertCraftSchema,
  insertEventSchema: () => insertEventSchema,
  insertTeamMemberSchema: () => insertTeamMemberSchema,
  insertVolunteerSchema: () => insertVolunteerSchema,
  teamMembers: () => teamMembers,
  volunteers: () => volunteers
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  age: integer("age"),
  school: text("school"),
  interests: text("interests").array(),
  availability: text("availability"),
  serviceHours: boolean("service_hours").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var crafts = pgTable("crafts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  materials: text("materials").array(),
  instructions: text("instructions").notNull(),
  difficulty: text("difficulty").notNull(),
  timeToComplete: text("time_to_complete").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow()
});
var teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  isLeader: boolean("is_leader").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location"),
  imageUrl: text("image_url"),
  attendees: integer("attendees").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var insertVolunteerSchema = createInsertSchema(volunteers).omit({
  id: true,
  createdAt: true
});
var insertCraftSchema = createInsertSchema(crafts).omit({
  id: true,
  createdAt: true
});
var insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  async createVolunteer(insertVolunteer) {
    const [volunteer] = await db.insert(volunteers).values({
      ...insertVolunteer,
      phone: insertVolunteer.phone || null,
      age: insertVolunteer.age || null,
      school: insertVolunteer.school || null,
      interests: insertVolunteer.interests || null,
      availability: insertVolunteer.availability || null,
      serviceHours: insertVolunteer.serviceHours || null,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return volunteer;
  }
  async getVolunteers() {
    return await db.select().from(volunteers);
  }
  async getCrafts() {
    return await db.select().from(crafts);
  }
  async getCraftById(id) {
    const [craft] = await db.select().from(crafts).where(eq(crafts.id, id));
    return craft || void 0;
  }
  async createCraft(insertCraft) {
    const [craft] = await db.insert(crafts).values({
      ...insertCraft,
      materials: insertCraft.materials || null,
      imageUrl: insertCraft.imageUrl || null,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return craft;
  }
  async getTeamMembers() {
    return await db.select().from(teamMembers);
  }
  async createTeamMember(insertTeamMember) {
    const [teamMember] = await db.insert(teamMembers).values({
      ...insertTeamMember,
      imageUrl: insertTeamMember.imageUrl || null,
      bio: insertTeamMember.bio || null,
      isLeader: insertTeamMember.isLeader || null,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return teamMember;
  }
  async getEvents() {
    return await db.select().from(events);
  }
  async createEvent(insertEvent) {
    const [event] = await db.insert(events).values({
      ...insertEvent,
      imageUrl: insertEvent.imageUrl || null,
      location: insertEvent.location || null,
      attendees: insertEvent.attendees || null,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return event;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.post("/api/volunteers", async (req, res) => {
    try {
      const validatedData = insertVolunteerSchema.parse(req.body);
      const volunteer = await storage.createVolunteer(validatedData);
      res.json(volunteer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid volunteer data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create volunteer" });
      }
    }
  });
  app2.get("/api/volunteers", async (req, res) => {
    try {
      const volunteers2 = await storage.getVolunteers();
      res.json(volunteers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch volunteers" });
    }
  });
  app2.get("/api/crafts", async (req, res) => {
    try {
      const crafts2 = await storage.getCrafts();
      res.json(crafts2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crafts" });
    }
  });
  app2.get("/api/crafts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const craft = await storage.getCraftById(id);
      if (!craft) {
        return res.status(404).json({ error: "Craft not found" });
      }
      res.json(craft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch craft" });
    }
  });
  app2.post("/api/crafts", async (req, res) => {
    try {
      const validatedData = insertCraftSchema.parse(req.body);
      const craft = await storage.createCraft(validatedData);
      res.json(craft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid craft data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create craft" });
      }
    }
  });
  app2.get("/api/team", async (req, res) => {
    try {
      const teamMembers2 = await storage.getTeamMembers();
      res.json(teamMembers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });
  app2.post("/api/team", async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const teamMember = await storage.createTeamMember(validatedData);
      res.json(teamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid team member data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create team member" });
      }
    }
  });
  app2.get("/api/events", async (req, res) => {
    try {
      const events2 = await storage.getEvents();
      res.json(events2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid event data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create event" });
      }
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
