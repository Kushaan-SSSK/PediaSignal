import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
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
import { 
  getRandomCase, 
  getAvailableCategories, 
  getCasesByCategory,
  evaluateSimulation,
  caseBank,
  type SimulationSession,
  type CaseDefinition
} from "./caseBank";
import multer from "multer";
import axios from 'axios';
import * as cheerio from 'cheerio';

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
  
  // Favicon route
  app.get('/favicon.jpg', (req, res) => {
    const faviconPath = path.join(process.cwd(), 'client', 'public', 'favicon.jpg');
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      res.status(404).send('Favicon not found');
    }
  });
  
  // Enhanced Simulation endpoints
  app.post('/api/start-simulation', async (req, res) => {
    try {
      const { category, userId } = req.body;
      
      if (!category || !userId) {
        return res.status(400).json({ message: "Category and userId required" });
      }

      // Get random case for the category
      const caseDefinition = getRandomCase(category);
      
      // Create simulation session
      const sessionId = `sim_${Date.now()}_${userId}`;
      const session: SimulationSession = {
        id: sessionId,
        userId,
        caseId: caseDefinition.id,
        startTime: new Date(),
        currentStage: 1,
        vitals: caseDefinition.initialVitals,
        appliedInterventions: [],
        timestamps: [],
        status: 'active'
      };

      // Store session (in production, this would go to database)
      // For now, we'll store in memory or use existing storage
      const simulationData = {
        userId,
        caseType: caseDefinition.id,
        stage: 1,
        vitals: caseDefinition.initialVitals,
        interventions: [],
        aiExplanations: [],
        status: 'active' as const
      };

      const simulation = await storage.createSimulation(simulationData);

      res.json({
        sessionId,
        simulationId: simulation.id,
        caseDefinition,
        currentStage: 1,
        vitals: caseDefinition.initialVitals,
        availableInterventions: caseDefinition.stages[0].availableInterventions,
        timeLimit: caseDefinition.stages[0].timeLimit,
        criticalActions: caseDefinition.stages[0].criticalActions
      });

    } catch (error) {
      console.error('Start simulation error:', error);
      res.status(500).json({ 
        message: "Failed to start simulation", 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/simulate-case', async (req, res) => {
    try {
      const { caseType, intervention, userId, vitals, stage, sessionId } = req.body;
      
      if (!caseType || !intervention || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get case definition
      const caseDefinition = caseBank.find(c => c.id === caseType);
      if (!caseDefinition) {
        return res.status(400).json({ message: "Invalid case type" });
      }

      // Generate AI clinical explanation
      const aiResult = await generateClinicalExplanation({
        caseType,
        stage: stage || 1,
        vitals: vitals || { heartRate: 120, temperature: 98.6, respRate: 20 },
        intervention
      });

      // Update vitals based on intervention
      const updatedVitals = { ...aiResult.updatedVitals };
      
      // Check for branching conditions
      const currentStage = caseDefinition.stages.find(s => s.stage === (stage || 1));
      let nextStage = (stage || 1) + 1;
      
      if (currentStage) {
        for (const condition of currentStage.branchingConditions) {
          if (intervention.includes(condition.condition) || 
              condition.condition === 'time_elapsed' ||
              condition.condition === 'vital_change') {
            nextStage = condition.nextStage;
            Object.assign(updatedVitals, condition.vitalsChange);
            break;
          }
        }
      }

      // Create or update simulation record
      const simulationData = {
        userId,
        caseType,
        stage: nextStage,
        vitals: updatedVitals,
        interventions: [intervention],
        aiExplanations: [aiResult.explanation],
        status: 'active' as const
      };

      const simulation = await storage.createSimulation(simulationData);

      // Get next stage info
      const nextStageInfo = caseDefinition.stages.find(s => s.stage === nextStage);
      
      res.json({
        simulationId: simulation.id,
        updatedVitals,
        clinicalExplanation: aiResult.explanation,
        nextStageRecommendations: aiResult.nextStageRecommendations,
        stage: nextStage,
        availableInterventions: nextStageInfo?.availableInterventions || [],
        timeLimit: nextStageInfo?.timeLimit,
        criticalActions: nextStageInfo?.criticalActions || [],
        isCompleted: nextStage > caseDefinition.stages.length
      });

    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ 
        message: "Failed to process simulation", 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/evaluate-simulation', async (req, res) => {
    try {
      const { sessionId, caseId, appliedInterventions, timestamps } = req.body;
      
      if (!sessionId || !caseId || !appliedInterventions) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get case definition
      const caseDefinition = caseBank.find(c => c.id === caseId);
      if (!caseDefinition) {
        return res.status(400).json({ message: "Invalid case ID" });
      }

      // Create session object for evaluation
      const session: SimulationSession = {
        id: sessionId,
        userId: 1, // This would come from auth
        caseId,
        startTime: new Date(),
        currentStage: caseDefinition.stages.length,
        vitals: caseDefinition.initialVitals,
        appliedInterventions,
        timestamps: timestamps || [],
        status: 'completed'
      };

      // Evaluate simulation
      const feedback = evaluateSimulation(session, caseDefinition);

      res.json({
        sessionId,
        feedback,
        caseDefinition: {
          name: caseDefinition.name,
          learningObjectives: caseDefinition.learningObjectives,
          references: caseDefinition.references
        }
      });

    } catch (error) {
      console.error('Evaluation error:', error);
      res.status(500).json({ 
        message: "Failed to evaluate simulation", 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/simulation-categories', async (req, res) => {
    try {
      const categories = getAvailableCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/simulation-cases/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const cases = getCasesByCategory(category);
      res.json(cases);
    } catch (error) {
      console.error('Get cases error:', error);
      res.status(500).json({ message: "Failed to fetch cases" });
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

  // Enhanced X-ray analysis endpoint
  app.post('/api/analyze-xray', upload.single('xray'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No X-ray image provided" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/dicom'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          message: "Invalid file type. Only JPEG, PNG, and DICOM files are allowed" 
        });
      }

      if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
        return res.status(400).json({ 
          message: "File too large. Maximum size is 10MB" 
        });
      }

      // Preprocess image (basic validation)
      const base64Image = req.file.buffer.toString('base64');
      
      // Check if image is valid base64
      if (!base64Image || base64Image.length < 1000) {
        return res.status(400).json({ 
          message: "Invalid image data" 
        });
      }

      // Analyze with OpenAI
      const analysis = await analyzeXrayImage(base64Image);

      // Validate analysis results
      if (analysis.confidenceScore < 0.1) {
        return res.status(400).json({ 
          message: "Unable to analyze image. Please ensure it's a clear pediatric X-ray." 
        });
      }

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

      // Log analysis for audit trail
      auditLog.logDataAccess(parseInt(userId).toString(), 'xray_analysis', xrayAnalysis.id.toString(), req.ip || 'unknown');

      res.json({
        analysisId: xrayAnalysis.id,
        abuseLikelihood: analysis.abuseLikelihood,
        fractureType: analysis.fractureType,
        explanation: analysis.explanation,
        confidenceScore: analysis.confidenceScore,
        riskLevel: analysis.abuseLikelihood > 0.7 ? 'high' : 
                   analysis.abuseLikelihood > 0.4 ? 'medium' : 'low',
        recommendations: analysis.abuseLikelihood > 0.7 ? 
          'Immediate consultation with child protection team recommended' :
          analysis.abuseLikelihood > 0.4 ? 
          'Consider additional imaging and clinical correlation' :
          'Continue routine clinical assessment'
      });

    } catch (error) {
      console.error('X-ray analysis error:', error);
      
      // Provide specific error messages
      let errorMessage = "Failed to analyze X-ray";
      if (error instanceof Error) {
        if (error.message.includes('API')) {
          errorMessage = "AI analysis service temporarily unavailable. Please try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Analysis timed out. Please try with a smaller image.";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: (error as Error).message 
      });
    }
  });

  // Get X-ray analysis by ID
  app.get('/api/xray-analysis/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analyses = await storage.getXrayAnalyses(1); // Using userId 1 for now
      const analysis = analyses.find(a => a.id === id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Get X-ray analysis error:', error);
      res.status(500).json({ message: "Failed to fetch analysis" });
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

  // Enhanced Misinformation monitoring endpoints
  app.post('/api/misinfo-scan', async (req, res) => {
    try {
      const { content, source, platform, userId } = req.body;
      
      if (!content || !source) {
        return res.status(400).json({ message: "Content and source required" });
      }

      // Validate content length
      if (content.length < 10) {
        return res.status(400).json({ message: "Content too short for analysis" });
      }

      if (content.length > 10000) {
        return res.status(400).json({ message: "Content too long. Maximum 10,000 characters." });
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

      // Log for audit trail
      auditLog.logDataAccess(userId || 'anonymous', 'misinfo_scan', misinfoLog.id.toString(), req.ip || 'unknown');

      res.json({
        logId: misinfoLog.id,
        riskScore: analysis.riskScore,
        category: analysis.category,
        explanation: analysis.explanation,
        recommendedAction: analysis.recommendedAction,
        severity: analysis.riskScore > 0.8 ? 'critical' : 
                  analysis.riskScore > 0.6 ? 'high' : 
                  analysis.riskScore > 0.4 ? 'medium' : 'low',
        flaggedForReview: analysis.riskScore > 0.6
      });

    } catch (error) {
      console.error('Misinformation scan error:', error);
      res.status(500).json({ 
        message: "Failed to scan for misinformation", 
        error: (error as Error).message 
      });
    }
  });

  // Web scraping endpoint
  app.post('/api/scrape-and-analyze', async (req, res) => {
    try {
      const { url, platform } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Fetch content from URL
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract main content
      let content = '';
      
      // Try to find article content
      const article = $('article').first();
      if (article.length > 0) {
        content = article.text().trim();
      } else {
        // Fallback to main content areas
        const mainContent = $('main, .content, .post-content, .article-content, .entry-content').first();
        if (mainContent.length > 0) {
          content = mainContent.text().trim();
        } else {
          // Last resort: get body text
          content = $('body').text().trim();
        }
      }

      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit to 5000 characters

      if (!content) {
        return res.status(400).json({ error: 'Could not extract content from URL' });
      }

      // Extract title
      const title = $('title').first().text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled';

           // Analyze the scraped content
     const analysisResult = await classifyMisinformation(content, url);

           // Store the result
     const logId = await storage.createMisinfoLog({
       title,
       content,
       source: url,
       platform: platform || 'web',
       riskScore: analysisResult.riskScore,
       category: analysisResult.category
     });

           // Log the data access
     auditLog.logDataAccess('anonymous', 'misinfo_scan', logId.toString(), req.ip || 'unknown');

      res.json({
        ...analysisResult,
        logId,
        scrapedContent: content.substring(0, 200) + '...',
        title
      });

    } catch (error) {
      console.error('Web scraping error:', error);
      res.status(500).json({ 
        error: 'Failed to scrape and analyze content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User feedback endpoint for extension
  app.post('/api/misinfo-feedback', async (req, res) => {
    try {
      const { claim, feedback, url, timestamp, userId } = req.body;
      
      if (!claim || !feedback || !url) {
        return res.status(400).json({ message: "Claim, feedback, and URL required" });
      }

      // Validate feedback type
      if (!['agree', 'disagree'].includes(feedback)) {
        return res.status(400).json({ message: "Feedback must be 'agree' or 'disagree'" });
      }

      // Save feedback to database (you may need to add a feedback table)
      const feedbackLog = {
        claim,
        feedback,
        url,
        timestamp: timestamp || new Date().toISOString(),
        userId: userId || 'extension-user',
        source: 'chrome-extension'
      };

      // For now, we'll log it (you can add a proper feedback table later)
      console.log('User feedback received:', feedbackLog);

      // Log for audit trail
      auditLog.logDataAccess(userId || 'extension-user', 'misinfo_feedback', 'feedback', req.ip || 'unknown');

      res.json({
        success: true,
        message: "Feedback received",
        feedbackId: Date.now().toString()
      });

    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ 
        message: "Failed to process feedback", 
        error: (error as Error).message 
      });
    }
  });

  // Batch misinformation scanning
  app.post('/api/misinfo-scan-batch', async (req, res) => {
    try {
      const { contents } = req.body;
      
      if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ message: "Contents array required" });
      }

      if (contents.length > 10) {
        return res.status(400).json({ message: "Maximum 10 items per batch" });
      }

      const results = [];
      
      for (const item of contents) {
        try {
          const analysis = await classifyMisinformation(item.content, item.source);
          
          const misinfoLog = await storage.createMisinfoLog({
            title: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
            content: item.content,
            source: item.source,
            platform: item.platform || 'unknown',
            riskScore: analysis.riskScore,
            category: analysis.category
          });

          results.push({
            logId: misinfoLog.id,
            riskScore: analysis.riskScore,
            category: analysis.category,
            explanation: analysis.explanation,
            recommendedAction: analysis.recommendedAction
          });
        } catch (error) {
          results.push({
            error: "Failed to analyze item",
            content: item.content.substring(0, 50) + "..."
          });
        }
      }

      res.json({ results });

    } catch (error) {
      console.error('Batch misinformation scan error:', error);
      res.status(500).json({ 
        message: "Failed to process batch scan", 
        error: (error as Error).message 
      });
    }
  });

  // Get misinformation statistics
  app.get('/api/misinfo-stats', async (req, res) => {
    try {
      const logs = await storage.getRecentMisinfoLogs(1000);
      
      const stats = {
        totalScans: logs.length,
        highRiskCount: logs.filter(log => log.riskScore > 0.6).length,
        criticalCount: logs.filter(log => log.riskScore > 0.8).length,
        categoryBreakdown: logs.reduce((acc, log) => {
          acc[log.category] = (acc[log.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageRiskScore: logs.length > 0 ? 
          logs.reduce((sum, log) => sum + log.riskScore, 0) / logs.length : 0,
        recentTrend: logs.slice(-10).map(log => ({
          date: log.detectedAt,
          riskScore: log.riskScore
        }))
      };

      res.json(stats);
    } catch (error) {
      console.error('Get misinfo stats error:', error);
      res.status(500).json({ message: "Failed to fetch statistics" });
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
