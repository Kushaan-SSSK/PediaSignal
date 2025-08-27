import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - running without database connection");
  console.warn("Create .env.local with DATABASE_URL for full functionality");
}

// Create a fallback database interface when DATABASE_URL is not available
const createFallbackDB = () => {
  return {
    insert: (table: any) => ({ 
      values: () => ({ 
        returning: () => {
          // Return different object structures based on table
          if (table === 'users') {
            return [{ 
              id: Math.floor(Math.random() * 1000000),
              username: 'fallback',
              email: 'fallback@example.com',
              password: 'fallback',
              role: 'medical_student',
              firstName: null,
              lastName: null,
              profileImageUrl: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }];
          } else if (table === 'simulations') {
            return [{
              id: Math.floor(Math.random() * 1000000),
              userId: 1,
              caseType: 'fallback',
              stage: 1,
              vitals: {},
              interventions: [],
              aiExplanations: [],
              status: 'active',
              evidenceSources: [],
              objectiveHits: [],
              riskFlags: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }];
          } else if (table === 'xray_analyses') {
            return [{
              id: Math.floor(Math.random() * 1000000),
              userId: 1,
              filename: 'fallback.jpg',
              imageData: 'fallback',
              abuseLikelihood: 0.5,
              fractureType: null,
              explanation: 'Fallback analysis',
              confidenceScore: 0.5,
              createdAt: new Date()
            }];
          } else if (table === 'misinfo_logs') {
            return [{
              id: Math.floor(Math.random() * 1000000),
              title: 'Fallback Title',
              content: 'Fallback content',
              source: 'fallback.com',
              platform: 'fallback',
              riskScore: 0.5,
              category: 'fallback',
              detectedAt: new Date()
            }];
          } else if (table === 'chat_conversations') {
            return [{
              id: Math.floor(Math.random() * 1000000),
              sessionId: 'fallback-session',
              parentMessage: 'Fallback message',
              aiResponse: 'Fallback response',
              riskLevel: 'low',
              recommendedAction: 'none',
              createdAt: new Date()
            }];
          } else if (table === 'waitlist') {
            return [{
              id: Math.floor(Math.random() * 1000000),
              name: 'Fallback User',
              email: 'fallback@example.com',
              role: 'medical_student',
              status: 'pending',
              createdAt: new Date(),
              updatedAt: new Date()
            }];
          }
          // Default fallback
          return [{ id: Math.floor(Math.random() * 1000000) }];
        } 
      }) 
    }),
    select: () => ({ 
      from: (table: any) => ({ 
        where: () => [] 
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({ 
          returning: () => [] 
        }) 
      }) 
    }),
    delete: () => ({ 
      where: () => ({}) 
    })
  };
};

export const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
export const db = process.env.DATABASE_URL && pool ? drizzle(pool, { schema }) : createFallbackDB();