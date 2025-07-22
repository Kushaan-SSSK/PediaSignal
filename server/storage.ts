import { 
  users, 
  simulations,
  xrayAnalyses, 
  misinfoLogs, 
  chatConversations,
  type User, 
  type InsertUser,
  type Simulation,
  type InsertSimulation,
  type XrayAnalysis,
  type InsertXrayAnalysis,
  type MisinfoLog,
  type InsertMisinfoLog,
  type ChatConversation,
  type InsertChatConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Simulation operations
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  updateSimulation(id: number, updates: Partial<Simulation>): Promise<Simulation>;
  getSimulation(id: number): Promise<Simulation | undefined>;
  getUserSimulations(userId: number): Promise<Simulation[]>;
  
  // X-ray analysis operations
  createXrayAnalysis(analysis: InsertXrayAnalysis): Promise<XrayAnalysis>;
  getXrayAnalyses(userId: number): Promise<XrayAnalysis[]>;
  
  // Misinformation monitoring
  createMisinfoLog(log: InsertMisinfoLog): Promise<MisinfoLog>;
  getRecentMisinfoLogs(limit?: number): Promise<MisinfoLog[]>;
  
  // Chat conversations
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getChatHistory(sessionId: string): Promise<ChatConversation[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [newSimulation] = await db.insert(simulations).values(simulation).returning();
    return newSimulation;
  }

  async updateSimulation(id: number, updates: Partial<Simulation>): Promise<Simulation> {
    const [updatedSimulation] = await db
      .update(simulations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(simulations.id, id))
      .returning();
    return updatedSimulation;
  }

  async getSimulation(id: number): Promise<Simulation | undefined> {
    const [simulation] = await db.select().from(simulations).where(eq(simulations.id, id));
    return simulation;
  }

  async getUserSimulations(userId: number): Promise<Simulation[]> {
    return await db
      .select()
      .from(simulations)
      .where(eq(simulations.userId, userId))
      .orderBy(desc(simulations.createdAt));
  }

  async createXrayAnalysis(analysis: InsertXrayAnalysis): Promise<XrayAnalysis> {
    const [newAnalysis] = await db.insert(xrayAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async getXrayAnalyses(userId: number): Promise<XrayAnalysis[]> {
    return await db
      .select()
      .from(xrayAnalyses)
      .where(eq(xrayAnalyses.userId, userId))
      .orderBy(desc(xrayAnalyses.createdAt));
  }

  async createMisinfoLog(log: InsertMisinfoLog): Promise<MisinfoLog> {
    const [newLog] = await db.insert(misinfoLogs).values(log).returning();
    return newLog;
  }

  async getRecentMisinfoLogs(limit = 50): Promise<MisinfoLog[]> {
    return await db
      .select()
      .from(misinfoLogs)
      .orderBy(desc(misinfoLogs.detectedAt))
      .limit(limit);
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [newConversation] = await db.insert(chatConversations).values(conversation).returning();
    return newConversation;
  }

  async getChatHistory(sessionId: string): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.sessionId, sessionId))
      .orderBy(chatConversations.createdAt);
  }
}

export const storage = new DatabaseStorage();
