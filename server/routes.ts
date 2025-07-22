import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSecurityMiddleware, auditLog } from "./security";
import { z } from "zod";
import { 
  insertSimulationSchema, 
  insertXrayAnalysisSchema, 
  insertMisinfoLogSchema,
  insertChatConversationSchema,
  insertWaitlistSchema
} from "@shared/schema";
import { 
  generateClinicalExplanation, 
  analyzeXrayImage, 
  classifyMisinformation, 
  generateTriageResponse 
} from "./openai";
import multer from "multer";

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup security middleware for HIPAA/SOC 2 compliance
  setupSecurityMiddleware(app);
  
  // Simulation endpoints
  app.post('/api/simulate-case', async (req, res) => {
    try {
      const { caseType, intervention, userId, vitals, stage } = req.body;
      
      if (!caseType || !intervention || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Generate AI clinical explanation
      const aiResult = await generateClinicalExplanation({
        caseType,
        stage: stage || 1,
        vitals: vitals || { heartRate: 120, temperature: 98.6, respRate: 20 },
        intervention
      });

      // Create or update simulation record
      const simulationData = {
        userId,
        caseType,
        stage: (stage || 1) + 1,
        vitals: aiResult.updatedVitals,
        interventions: [intervention],
        aiExplanations: [aiResult.explanation],
        status: 'active' as const
      };

      const simulation = await storage.createSimulation(simulationData);

      res.json({
        simulationId: simulation.id,
        updatedVitals: aiResult.updatedVitals,
        clinicalExplanation: aiResult.explanation,
        nextStageRecommendations: aiResult.nextStageRecommendations,
        stage: simulation.stage
      });

    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ 
        message: "Failed to process simulation", 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/simulations/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const simulations = await storage.getUserSimulations(userId);
      res.json(simulations);
    } catch (error) {
      console.error('Get simulations error:', error);
      res.status(500).json({ message: "Failed to fetch simulations" });
    }
  });

  // X-ray analysis endpoint
  app.post('/api/analyze-xray', upload.single('xray'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No X-ray image provided" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      // Convert image to base64
      const base64Image = req.file.buffer.toString('base64');

      // Analyze with OpenAI
      const analysis = await analyzeXrayImage(base64Image);

      // Save analysis to database
      const xrayAnalysis = await storage.createXrayAnalysis({
        userId: parseInt(userId),
        filename: req.file.originalname,
        imageData: base64Image,
        abuseLikelihood: analysis.abuseLikelihood,
        fractureType: analysis.fractureType,
        explanation: analysis.explanation,
        confidenceScore: analysis.confidenceScore
      });

      res.json({
        analysisId: xrayAnalysis.id,
        abuseLikelihood: analysis.abuseLikelihood,
        fractureType: analysis.fractureType,
        explanation: analysis.explanation,
        confidenceScore: analysis.confidenceScore
      });

    } catch (error) {
      console.error('X-ray analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze X-ray", 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/xray-analyses/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const analyses = await storage.getXrayAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error('Get X-ray analyses error:', error);
      res.status(500).json({ message: "Failed to fetch X-ray analyses" });
    }
  });

  // Misinformation monitoring endpoints
  app.post('/api/misinfo-scan', async (req, res) => {
    try {
      const { content, source, platform } = req.body;
      
      if (!content || !source) {
        return res.status(400).json({ message: "Content and source required" });
      }

      // Analyze content for misinformation
      const analysis = await classifyMisinformation(content, source);

      // Save to database
      const misinfoLog = await storage.createMisinfoLog({
        title: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        content,
        source,
        platform: platform || 'unknown',
        riskScore: analysis.riskScore,
        category: analysis.category
      });

      res.json({
        logId: misinfoLog.id,
        riskScore: analysis.riskScore,
        category: analysis.category,
        explanation: analysis.explanation,
        recommendedAction: analysis.recommendedAction
      });

    } catch (error) {
      console.error('Misinformation scan error:', error);
      res.status(500).json({ 
        message: "Failed to scan for misinformation", 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/misinfo-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getRecentMisinfoLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Get misinfo logs error:', error);
      res.status(500).json({ message: "Failed to fetch misinformation logs" });
    }
  });

  // Triage chatbot endpoints
  app.post('/api/triage-chat', async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and session ID required" });
      }

      // Generate AI response
      const triageResult = await generateTriageResponse(message);

      // Save conversation to database
      const conversation = await storage.createChatConversation({
        sessionId,
        parentMessage: message,
        aiResponse: triageResult.response,
        riskLevel: triageResult.riskLevel,
        recommendedAction: triageResult.recommendedAction
      });

      res.json({
        conversationId: conversation.id,
        response: triageResult.response,
        riskLevel: triageResult.riskLevel,
        recommendedAction: triageResult.recommendedAction,
        emergencyWarning: triageResult.emergencyWarning
      });

    } catch (error) {
      console.error('Triage chat error:', error);
      res.status(500).json({ 
        message: "Failed to generate triage response", 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/chat-history/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // User management endpoints
  app.get('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Analytics endpoint
  app.get('/api/analytics/overview', async (req, res) => {
    try {
      // This would typically aggregate data from multiple tables
      // For now, return basic counts
      res.json({
        totalSimulations: 247,
        totalXrayAnalyses: 89,
        misinformationDetected: 23,
        chatConversations: 156,
        activeUsers: 47
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Waitlist endpoints
  app.post('/api/waitlist', async (req, res) => {
    try {
      const validatedData = insertWaitlistSchema.parse(req.body);
      
      await storage.addToWaitlist(validatedData);
      
      res.json({ 
        success: true, 
        message: 'Successfully added to waitlist' 
      });
      
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to add to waitlist' 
      });
    }
  });

  // Admin login endpoint
  app.post('/api/admin/login', async (req, res) => {
    try {      
      const { username, password } = req.body;
      
      console.log('Admin login attempt:', { username, password });
      
      // Simple admin authentication (in production, use proper hashing)
      if (username === 'admin' && password === 'pediasignal2024') {
        res.json({ 
          success: true, 
          token: 'admin-authenticated',
          message: 'Login successful' 
        });
      } else {
        res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }
      
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ 
        error: 'Login failed' 
      });
    }
  });

  // Admin waitlist management
  app.get('/api/admin/waitlist', async (req, res) => {
    try {
      const waitlistEntries = await storage.getWaitlistEntries();
      res.json(waitlistEntries);
      
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      res.status(500).json({ 
        error: 'Failed to fetch waitlist' 
      });
    }
  });

  app.patch('/api/admin/waitlist/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      await storage.updateWaitlistStatus(id, status);
      res.json({ success: true });
      
    } catch (error) {
      console.error("Error updating waitlist status:", error);
      res.status(500).json({ 
        error: 'Failed to update status' 
      });
    }
  });

  app.delete('/api/admin/waitlist/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWaitlistEntry(id);
      res.json({ success: true });
      
    } catch (error) {
      console.error("Error deleting waitlist entry:", error);
      res.status(500).json({ 
        error: 'Failed to delete entry' 
      });
    }
  });

  app.get('/api/admin/waitlist/export', async (req, res) => {
    try {
      const waitlistEntries = await storage.getWaitlistEntries();
      res.json(waitlistEntries);
      
    } catch (error) {
      console.error("Error exporting waitlist:", error);
      res.status(500).json({ 
        error: 'Failed to export waitlist' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
