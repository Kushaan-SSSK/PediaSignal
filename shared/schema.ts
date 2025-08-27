import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("medical_student"), // medical_student, pediatrician, admin
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Simulation sessions
export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  caseType: text("case_type").notNull(), // febrile_seizure, respiratory_distress, etc.
  stage: integer("stage").notNull().default(1),
  vitals: jsonb("vitals").notNull(), // { heartRate: 145, temperature: 103.2, respRate: 32 }
  interventions: jsonb("interventions").notNull().default([]), // Array of applied interventions
  aiExplanations: jsonb("ai_explanations").notNull().default([]), // GPT-4 generated explanations
  status: text("status").notNull().default("active"), // active, paused, completed
  // New RAG fields
  evidenceSources: jsonb("evidence_sources").notNull().default([]), // Array of EvidenceRef
  objectiveHits: jsonb("objective_hits").notNull().default([]), // Array of objective strings
  riskFlags: jsonb("risk_flags").notNull().default([]), // Array of risk flag strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Base Passages (RAG text layer)
export const kbPassages = pgTable("kb_passages", {
  id: serial("id").primaryKey(),
  caseId: text("caseId").notNull(), // e.g., "aliem-case-01"
  stage: integer("stage").notNull(), // Simulation stage
  section: text("section").notNull(), // objectives | critical_actions | debrief | actor_prompts | pitfalls
  tags: jsonb("tags").notNull().default([]), // e.g., ["ICS1","red-flag","airway"]
  text: text("text").notNull(), // Chunked text content
  embedding: jsonb("embedding"), // Vector embedding (stored as JSON if not using pgvector)
  sourceCitation: text("sourceCitation").notNull(), // case title, page/section
  license: text("license").notNull().default("CC BY-NC-SA 4.0"),
  documentId: text("document_id"), // Reference to uploaded document
  passageHash: text("passage_hash"), // Hash for deduplication
  createdAt: timestamp("createdAt").defaultNow(),
});

// Knowledge Base Rules (deterministic rules layer)
export const kbRules = pgTable("kb_rules", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull(), // e.g., "aliem-case-01"
  kind: text("kind").notNull(), // 'drug_doses' | 'algo_steps' | 'vital_curves' | 'critical_actions'
  payload: jsonb("payload").notNull(), // Rule-specific data
  version: text("version").notNull(), // e.g., "aliem-rescu-peds-2021-03-29"
  checksum: text("checksum").notNull(), // Integrity of source
  documentId: text("document_id").notNull(), // Reference to uploaded document
  createdAt: timestamp("created_at").defaultNow(),
});

// X-ray analyses
export const xrayAnalyses = pgTable("xray_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  imageData: text("image_data").notNull(), // base64 encoded image
  abuseLikelihood: real("abuse_likelihood").notNull(), // 0-1 score
  fractureType: text("fracture_type"), // spiral, transverse, etc.
  explanation: text("explanation").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Misinformation monitoring logs
export const misinfoLogs = pgTable("misinfo_logs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(), // URL or platform
  platform: text("platform").notNull(), // facebook, tiktok, blog, etc.
  riskScore: real("risk_score").notNull(), // 0-1 misinformation risk
  category: text("category").notNull(), // vaccine, treatment, emergency_care
  detectedAt: timestamp("detected_at").defaultNow(),
});

// Chat conversations for triage bot
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  parentMessage: text("parent_message").notNull(),
  aiResponse: text("ai_response").notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high, emergency
  recommendedAction: text("recommended_action").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Telemetry: RAG query tracking
export const kbQueries = pgTable("kb_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: text("session_id").notNull(),
  query: text("query").notNull(),
  caseId: text("case_id"),
  stage: integer("stage"),
  section: text("section"),
  tags: jsonb("tags").notNull().default([]),
  passageIds: jsonb("passage_ids").notNull().default([]), // Array of retrieved passage IDs
  topK: integer("top_k").notNull().default(10),
  responseTime: integer("response_time"), // milliseconds
  cacheHit: boolean("cache_hit").default(false),
  evidenceSources: integer("evidence_sources").default(0), // Count of evidence sources returned
  objectiveHits: integer("objective_hits").default(0), // Count of objective hits
  riskFlags: integer("risk_flags").default(0), // Count of risk flags
  createdAt: timestamp("created_at").defaultNow(),
});

// Telemetry: Objective coverage tracking
export const objectiveCoverage = pgTable("objective_coverage", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull().references(() => simulations.id),
  objectiveId: text("objective_id").notNull(),
  objectiveText: text("objective_text").notNull(),
  status: text("status").notNull().default("not-met"), // not-met, partially, completed
  score: integer("score").notNull().default(0), // 0-100
  evidenceSources: jsonb("evidence_sources").notNull().default([]), // Array of EvidenceRef
  whatWentWell: jsonb("what_went_well").notNull().default([]), // Array of strings
  improvements: jsonb("improvements").notNull().default([]), // Array of strings
  timeToComplete: integer("time_to_complete"), // seconds
  interventionsApplied: jsonb("interventions_applied").notNull().default([]), // Array of intervention IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Waitlist for platform access
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  simulations: many(simulations),
  xrayAnalyses: many(xrayAnalyses),
}));

export const simulationRelations = relations(simulations, ({ one }) => ({
  user: one(users, {
    fields: [simulations.userId],
    references: [users.id],
  }),
}));

export const xrayAnalysisRelations = relations(xrayAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [xrayAnalyses.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertXrayAnalysisSchema = createInsertSchema(xrayAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertMisinfoLogSchema = createInsertSchema(misinfoLogs).omit({
  id: true,
  detectedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectWaitlistSchema = createSelectSchema(waitlist);

// Telemetry schemas
export const insertKbQuerySchema = createInsertSchema(kbQueries).omit({
  id: true,
  createdAt: true,
});

export const insertObjectiveCoverageSchema = createInsertSchema(objectiveCoverage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectKbQuerySchema = createSelectSchema(kbQueries);
export const selectObjectiveCoverageSchema = createSelectSchema(objectiveCoverage);

// Zod schemas for new tables
export const kbPassageInsertSchema = createInsertSchema(kbPassages);
export const kbPassageSelectSchema = createSelectSchema(kbPassages);

export const kbRuleInsertSchema = createInsertSchema(kbRules);
export const kbRuleSelectSchema = createSelectSchema(kbRules);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type XrayAnalysis = typeof xrayAnalyses.$inferSelect;
export type InsertXrayAnalysis = z.infer<typeof insertXrayAnalysisSchema>;
export type MisinfoLog = typeof misinfoLogs.$inferSelect;
export type InsertMisinfoLog = z.infer<typeof insertMisinfoLogSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;

// Type exports
export type KbPassage = z.infer<typeof kbPassageSelectSchema>;
export type KbRule = z.infer<typeof kbRuleSelectSchema>;

// Telemetry types
export type KbQuery = z.infer<typeof selectKbQuerySchema>;
export type InsertKbQuery = z.infer<typeof insertKbQuerySchema>;
export type ObjectiveCoverage = z.infer<typeof selectObjectiveCoverageSchema>;
export type InsertObjectiveCoverage = z.infer<typeof insertObjectiveCoverageSchema>;
