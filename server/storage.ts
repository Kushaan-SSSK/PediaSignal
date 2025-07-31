import { 
  users, 
  simulations,
  xrayAnalyses, 
  misinfoLogs, 
  chatConversations,
  waitlist,
  type User, 
  type InsertUser,
  type Simulation,
  type InsertSimulation,
  type XrayAnalysis,
  type InsertXrayAnalysis,
  type MisinfoLog,
  type InsertMisinfoLog,
  type ChatConversation,
  type InsertChatConversation,
  type Waitlist,
  type InsertWaitlist
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { encryption } from "./security";

// Simple encryption helper using the alt methods (crypto-js based)
const encryptData = (data: any) => {
  if (!data) return data;
  if (typeof data === 'string') {
    return encryption.encryptPHIAlt(data);
  }
  if (typeof data === 'object') {
    return encryption.encryptPHIAlt(JSON.stringify(data));
  }
  return encryption.encryptPHIAlt(String(data));
};

const decryptData = (encryptedData: any) => {
  if (!encryptedData) return encryptedData;
  const decrypted = encryption.decryptPHIAlt(encryptedData);
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

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
  
  // Waitlist operations
  addToWaitlist(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistEntries(): Promise<Waitlist[]>;
  updateWaitlistStatus(id: number, status: string): Promise<void>;
  deleteWaitlistEntry(id: number): Promise<void>;
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
    // Encrypt sensitive medical simulation data (AES-256 PHI protection)
    const encryptedSimulation = {
      ...simulation,
      vitals: simulation.vitals ? encryptData(simulation.vitals) : simulation.vitals,
      interventions: simulation.interventions ? encryptData(simulation.interventions) : simulation.interventions
    };
    
    const [newSimulation] = await db.insert(simulations).values(encryptedSimulation).returning();
    
    // Decrypt for return value
    return {
      ...newSimulation,
      vitals: newSimulation.vitals ? decryptData(newSimulation.vitals) : newSimulation.vitals,
      interventions: newSimulation.interventions ? decryptData(newSimulation.interventions) : newSimulation.interventions
    };
  }

  async updateSimulation(id: number, updates: Partial<Simulation>): Promise<Simulation> {
    // Encrypt sensitive updates
    const encryptedUpdates = {
      ...updates,
      vitals: updates.vitals ? encryptData(updates.vitals) : updates.vitals,
      interventions: updates.interventions ? encryptData(updates.interventions) : updates.interventions,
      updatedAt: new Date()
    };
    
    const [updatedSimulation] = await db
      .update(simulations)
      .set(encryptedUpdates)
      .where(eq(simulations.id, id))
      .returning();
    
    // Decrypt for return value
    return {
      ...updatedSimulation,
      vitals: updatedSimulation.vitals ? decryptData(updatedSimulation.vitals) : updatedSimulation.vitals,
      interventions: updatedSimulation.interventions ? decryptData(updatedSimulation.interventions) : updatedSimulation.interventions
    };
  }

  async getSimulation(id: number): Promise<Simulation | undefined> {
    const [simulation] = await db.select().from(simulations).where(eq(simulations.id, id));
    if (!simulation) return undefined;
    
    // Decrypt sensitive medical data for return
    return {
      ...simulation,
      vitals: simulation.vitals ? decryptData(simulation.vitals) : simulation.vitals,
      interventions: simulation.interventions ? decryptData(simulation.interventions) : simulation.interventions
    };
  }

  async getUserSimulations(userId: number): Promise<Simulation[]> {
    const simulationsData = await db
      .select()
      .from(simulations)
      .where(eq(simulations.userId, userId))
      .orderBy(desc(simulations.createdAt));
    
    // Decrypt sensitive medical data for return
    return simulationsData.map((simulation: any) => ({
      ...simulation,
      vitals: simulation.vitals ? decryptData(simulation.vitals) : simulation.vitals,
      interventions: simulation.interventions ? decryptData(simulation.interventions) : simulation.interventions
    }));
  }

  async createXrayAnalysis(analysis: InsertXrayAnalysis): Promise<XrayAnalysis> {
    // Encrypt sensitive medical data before storing (AES-256 PHI protection)
    const encryptedAnalysis = {
      ...analysis,
      imageData: analysis.imageData ? encryptData(analysis.imageData) : analysis.imageData
    };
    
    const [newAnalysis] = await db.insert(xrayAnalyses).values(encryptedAnalysis).returning();
    
    // Decrypt for return value
    return {
      ...newAnalysis,
      imageData: newAnalysis.imageData ? decryptData(newAnalysis.imageData) : newAnalysis.imageData
    };
  }

  async getXrayAnalyses(userId: number): Promise<XrayAnalysis[]> {
    const analyses = await db
      .select()
      .from(xrayAnalyses)
      .where(eq(xrayAnalyses.userId, userId))
      .orderBy(desc(xrayAnalyses.createdAt));
    
    // Decrypt sensitive medical data for return
    return analyses.map((analysis: any) => ({
      ...analysis,
      imageData: analysis.imageData ? decryptData(analysis.imageData) : analysis.imageData
    }));
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
    // Encrypt sensitive medical conversation data (AES-256 PHI protection)
    const encryptedConversation = {
      ...conversation,
      parentMessage: conversation.parentMessage ? encryptData(conversation.parentMessage) : conversation.parentMessage,
      aiResponse: conversation.aiResponse ? encryptData(conversation.aiResponse) : conversation.aiResponse
    };
    
    const [newConversation] = await db.insert(chatConversations).values(encryptedConversation).returning();
    
    // Decrypt for return value
    return {
      ...newConversation,
      parentMessage: newConversation.parentMessage ? decryptData(newConversation.parentMessage) : newConversation.parentMessage,
      aiResponse: newConversation.aiResponse ? decryptData(newConversation.aiResponse) : newConversation.aiResponse
    };
  }

  async getChatHistory(sessionId: string): Promise<ChatConversation[]> {
    const conversations = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.sessionId, sessionId))
      .orderBy(chatConversations.createdAt);
    
    // Decrypt sensitive medical conversation data for return
    return conversations.map((conversation: any) => ({
      ...conversation,
      parentMessage: conversation.parentMessage ? decryptData(conversation.parentMessage) : conversation.parentMessage,
      aiResponse: conversation.aiResponse ? decryptData(conversation.aiResponse) : conversation.aiResponse
    }));
  }

  // Waitlist operations
  async addToWaitlist(entry: InsertWaitlist): Promise<Waitlist> {
    const [newEntry] = await db
      .insert(waitlist)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getWaitlistEntries(): Promise<Waitlist[]> {
    return await db.select()
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt));
  }

  async updateWaitlistStatus(id: number, status: string): Promise<void> {
    await db
      .update(waitlist)
      .set({ status, updatedAt: new Date() })
      .where(eq(waitlist.id, id));
  }

  async deleteWaitlistEntry(id: number): Promise<void> {
    await db.delete(waitlist).where(eq(waitlist.id, id));
  }
}

export const storage = new DatabaseStorage();
