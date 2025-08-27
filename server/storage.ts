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
  // Temporarily disable encryption for development
  if (process.env.NODE_ENV === 'development') {
    return data;
  }
  
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
  // Temporarily disable decryption for development
  if (process.env.NODE_ENV === 'development') {
    return encryptedData;
  }
  
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
    if (!user || typeof user !== 'object') return undefined;
    const typedUser = user as any;
    if (!typedUser.username || !typedUser.email) return undefined;
    return typedUser as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user || typeof user !== 'object') return undefined;
    const typedUser = user as any;
    if (!typedUser.username || !typedUser.email) return undefined;
    return typedUser as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || typeof user !== 'object') return undefined;
    const typedUser = user as any;
    if (!typedUser.username || !typedUser.email) return undefined;
    return typedUser as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    if (!user || typeof user !== 'object') {
      throw new Error('Failed to create user');
    }
    const typedUser = user as any;
    if (!typedUser.username) {
      throw new Error('Failed to create user - missing username');
    }
    return typedUser as User;
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    try {
      // Try to use database first
      const encryptedSimulation = {
        ...simulation,
        vitals: simulation.vitals ? encryptData(simulation.vitals) : simulation.vitals,
        interventions: simulation.interventions ? encryptData(simulation.interventions) : simulation.interventions
      };
      
      const [newSimulation] = await db.insert(simulations).values(encryptedSimulation).returning();
      if (!newSimulation || typeof newSimulation !== 'object') {
        throw new Error('Failed to create simulation');
      }
      
      const typedSimulation = newSimulation as any;
      if (!typedSimulation.userId || !typedSimulation.caseType) {
        throw new Error('Failed to create simulation - missing required fields');
      }
      
      // Decrypt for return value
      return {
        ...typedSimulation,
        vitals: typedSimulation.vitals ? decryptData(typedSimulation.vitals) : typedSimulation.vitals,
        interventions: typedSimulation.interventions ? decryptData(typedSimulation.interventions) : typedSimulation.interventions
      } as Simulation;
    } catch (dbError) {
      console.warn('Database unavailable, using in-memory fallback:', dbError);
      
      // Fallback: create simulation in memory
      const fallbackSimulation: Simulation = {
        id: Math.floor(Math.random() * 1000000),
        userId: simulation.userId,
        caseType: simulation.caseType,
        stage: simulation.stage || 1,
        vitals: simulation.vitals || {},
        interventions: simulation.interventions || [],
        aiExplanations: simulation.aiExplanations || [],
        status: simulation.status || 'active',
        evidenceSources: simulation.evidenceSources || [],
        objectiveHits: simulation.objectiveHits || [],
        riskFlags: simulation.riskFlags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return fallbackSimulation;
    }
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
    
    if (!updatedSimulation || !updatedSimulation.userId) {
      throw new Error('Failed to update simulation');
    }
    
    // Decrypt for return value
    return {
      ...updatedSimulation,
      vitals: updatedSimulation.vitals ? decryptData(updatedSimulation.vitals) : updatedSimulation.vitals,
      interventions: updatedSimulation.interventions ? decryptData(updatedSimulation.interventions) : updatedSimulation.interventions
    } as Simulation;
  }

  async getSimulation(id: number): Promise<Simulation | undefined> {
    const [simulation] = await db.select().from(simulations).where(eq(simulations.id, id));
    if (!simulation || typeof simulation !== 'object') return undefined;
    
    const typedSimulation = simulation as any;
    if (!typedSimulation.userId) return undefined;
    
    // Decrypt sensitive medical data for return
    return {
      ...typedSimulation,
      vitals: typedSimulation.vitals ? decryptData(typedSimulation.vitals) : typedSimulation.vitals,
      interventions: typedSimulation.interventions ? decryptData(typedSimulation.interventions) : typedSimulation.interventions
    } as Simulation;
  }

  async getUserSimulations(userId: number): Promise<Simulation[]> {
    const simulationsData = await db
      .select()
      .from(simulations)
      .where(eq(simulations.userId, userId));
    
    // Decrypt sensitive medical data for return
    return simulationsData
      .filter((simulation: any) => simulation && simulation.userId)
      .map((simulation: any) => ({
        ...simulation,
        vitals: simulation.vitals ? decryptData(simulation.vitals) : simulation.vitals,
        interventions: simulation.interventions ? decryptData(simulation.interventions) : simulation.interventions
      })) as Simulation[];
  }

  async createXrayAnalysis(analysis: InsertXrayAnalysis): Promise<XrayAnalysis> {
    // Encrypt sensitive medical data before storing (AES-256 PHI protection)
    const encryptedAnalysis = {
      ...analysis,
      imageData: analysis.imageData ? encryptData(analysis.imageData) : analysis.imageData
    };
    
    const [newAnalysis] = await db.insert(xrayAnalyses).values(encryptedAnalysis).returning();
    if (!newAnalysis || typeof newAnalysis !== 'object') {
      throw new Error('Failed to create xray analysis');
    }
    
    const typedAnalysis = newAnalysis as any;
    if (!typedAnalysis.userId || !typedAnalysis.filename) {
      throw new Error('Failed to create xray analysis - missing required fields');
    }
    
    // Decrypt for return value
    return {
      ...typedAnalysis,
      imageData: typedAnalysis.imageData ? decryptData(typedAnalysis.imageData) : typedAnalysis.imageData
    } as XrayAnalysis;
  }

  async getXrayAnalyses(userId: number): Promise<XrayAnalysis[]> {
    const analyses = await db
      .select()
      .from(xrayAnalyses)
      .where(eq(xrayAnalyses.userId, userId));
    
    // Decrypt sensitive medical data for return
    if (Array.isArray(analyses)) {
      return analyses
        .filter((analysis: any) => analysis && analysis.userId)
        .map((analysis: any) => ({
          ...analysis,
          imageData: analysis.imageData ? decryptData(analysis.imageData) : analysis.imageData
        })) as XrayAnalysis[];
    }
    return [];
  }

  async createMisinfoLog(log: InsertMisinfoLog): Promise<MisinfoLog> {
    const [newLog] = await db.insert(misinfoLogs).values(log).returning();
    if (!newLog || typeof newLog !== 'object') {
      throw new Error('Failed to create misinfo log');
    }
    const typedLog = newLog as any;
    if (!typedLog.title) {
      throw new Error('Failed to create misinfo log - missing title');
    }
    return typedLog as MisinfoLog;
  }

  async getRecentMisinfoLogs(limit = 50): Promise<MisinfoLog[]> {
    const logs = await db
      .select()
      .from(misinfoLogs);
    
    if (Array.isArray(logs)) {
      return logs
        .filter((log: any) => log && log.title)
        .slice(0, limit) as MisinfoLog[];
    }
    return [];
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    // Encrypt sensitive medical conversation data (AES-256 PHI protection)
    const encryptedConversation = {
      ...conversation,
      parentMessage: conversation.parentMessage ? encryptData(conversation.parentMessage) : conversation.parentMessage,
      aiResponse: conversation.aiResponse ? encryptData(conversation.aiResponse) : conversation.aiResponse
    };
    
    const [newConversation] = await db.insert(chatConversations).values(encryptedConversation).returning();
    if (!newConversation || typeof newConversation !== 'object') {
      throw new Error('Failed to create chat conversation');
    }
    
    const typedConversation = newConversation as any;
    if (!typedConversation.sessionId) {
      throw new Error('Failed to create chat conversation - missing sessionId');
    }
    
    // Decrypt for return value
    return {
      ...typedConversation,
      parentMessage: typedConversation.parentMessage ? decryptData(typedConversation.parentMessage) : typedConversation.parentMessage,
      aiResponse: typedConversation.aiResponse ? decryptData(typedConversation.aiResponse) : typedConversation.aiResponse
    } as ChatConversation;
  }

  async getChatHistory(sessionId: string): Promise<ChatConversation[]> {
    const conversations = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.sessionId, sessionId));
    
    // Decrypt sensitive medical conversation data for return
    if (Array.isArray(conversations)) {
      return conversations
        .filter((conversation: any) => conversation && conversation.sessionId)
        .map((conversation: any) => ({
          ...conversation,
          parentMessage: conversation.parentMessage ? decryptData(conversation.parentMessage) : conversation.parentMessage,
          aiResponse: conversation.aiResponse ? decryptData(conversation.aiResponse) : conversation.aiResponse
        })) as ChatConversation[];
    }
    return [];
  }

  // Waitlist operations
  async addToWaitlist(entry: InsertWaitlist): Promise<Waitlist> {
    const [newEntry] = await db
      .insert(waitlist)
      .values(entry)
      .returning();
    if (!newEntry || typeof newEntry !== 'object') {
      throw new Error('Failed to add to waitlist');
    }
    const typedEntry = newEntry as any;
    if (!typedEntry.email) {
      throw new Error('Failed to add to waitlist - missing email');
    }
    return typedEntry as Waitlist;
  }

  async getWaitlistEntries(): Promise<Waitlist[]> {
    const entries = await db.select()
      .from(waitlist);
    
    if (Array.isArray(entries)) {
      return entries.filter((entry: any) => entry && entry.email) as Waitlist[];
    }
    return [];
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
