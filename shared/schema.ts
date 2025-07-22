import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
