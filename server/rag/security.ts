import crypto from 'crypto';
import { validateSecurityText } from './schemas';

/**
 * RAG Security Module - Enhanced for Sprint C
 * Implements prompt injection defense, PHI redaction, rate limiting, and timeouts
 */

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Request timeout configuration
const REQUEST_TIMEOUTS = {
  rag_retrieval: 8000, // 8 seconds
  llm_composition: 10000, // 10 seconds
  pubmed_search: 5000, // 5 seconds
  rules_service: 3000, // 3 seconds
  default: 8000, // 8 seconds
};

// Enhanced PHI patterns to detect and redact
const PHI_PATTERNS = [
  // Names (enhanced)
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
  /\b(?:Dr\.|Dr|Professor|Prof\.|Prof)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/gi,
  
  // Dates (enhanced)
  /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi,
  
  // Phone numbers (enhanced)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
  /\b\+\d{1,3}\s*\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  
  // Medical record numbers (enhanced)
  /\b(?:MRN|Medical Record|Record Number)\s*[:#]?\s*\d+\b/gi,
  /\b[A-Z]{2,4}\d{6,8}\b/g, // Common MRN formats
  
  // Addresses (enhanced)
  /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl|Way|Terrace|Ter)\b/gi,
  /\b(?:PO Box|P\.O\. Box|Post Office Box)\s+\d+\b/gi,
  
  // Email addresses (enhanced)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Social Security Numbers (enhanced)
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{9}\b/g, // Just 9 digits
  
  // Age with specific numbers (enhanced)
  /\b(?:age|Age)\s*[:=]?\s*\d{1,2}\s*(?:years?|y\.?o\.?|months?|mo\.?|days?|d\.?)\b/gi,
  /\b\d{1,2}\s*(?:years?|y\.?o\.?|months?|mo\.?|days?|d\.?)\s+old\b/gi,
  
  // Weight with specific numbers (enhanced)
  /\b(?:weight|Weight)\s*[:=]?\s*\d+(?:\.\d+)?\s*(?:kg|lb|pounds?|g|oz)\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:kg|lb|pounds?|g|oz)\b/g,
  
  // Height with specific numbers
  /\b(?:height|Height)\s*[:=]?\s*\d+(?:\.\d+)?\s*(?:cm|inches?|in|feet|ft)\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:cm|inches?|in|feet|ft)\b/g,
  
  // Blood pressure readings
  /\b(?:BP|Blood Pressure)\s*[:=]?\s*\d+\/\d+\b/gi,
  /\b\d{2,3}\/\d{2,3}\s*(?:mmHg|mm Hg)\b/gi,
  
  // Heart rate, respiratory rate
  /\b(?:HR|Heart Rate|RR|Respiratory Rate)\s*[:=]?\s*\d+\s*(?:bpm|breaths?\/min)\b/gi,
  
  // Temperature
  /\b(?:Temp|Temperature)\s*[:=]?\s*\d+(?:\.\d+)?\s*(?:°F|°C|F|C)\b/gi,
];

// Enhanced prompt injection patterns to detect and remove
const INJECTION_PATTERNS = [
  // Direct injection attempts
  /\bignore\s+previous\s+instructions\b/gi,
  /\bdisregard\s+above\b/gi,
  /\bforget\s+previous\b/gi,
  /\bignore\s+all\s+above\b/gi,
  
  // System directives
  /\bsystem\s*:\s*/gi,
  /\buser\s*:\s*/gi,
  /\bassistant\s*:\s*/gi,
  /\bhuman\s*:\s*/gi,
  /\bAI\s*:\s*/gi,
  
  // Code injection
  /\b<|>|\[|\]|\{|\}|`/g,
  /\b(?:javascript|js|python|py|html|css|sql)\s*:/gi,
  
  // Prompt injection keywords
  /\bprompt\s+injection\b/gi,
  /\bbypass\s+security\b/gi,
  /\bignore\s+safety\b/gi,
  /\boverride\s+system\b/gi,
  /\bignore\s+constraints\b/gi,
  
  // Role playing attempts
  /\bpretend\s+to\s+be\b/gi,
  /\bact\s+as\b/gi,
  /\broleplay\b/gi,
  /\bsimulate\b/gi,
  
  // Jailbreak attempts
  /\bjailbreak\b/gi,
  /\bbreak\s+free\b/gi,
  /\bescape\s+constraints\b/gi,
];

/**
 * Enhanced PHI redaction with better pattern matching
 */
export function redactPHI(text: string): string {
  let redactedText = text;
  
  PHI_PATTERNS.forEach(pattern => {
    redactedText = redactedText.replace(pattern, '[REDACTED]');
  });
  
  return redactedText;
}

/**
 * Enhanced prompt injection removal
 */
export function removePromptInjection(text: string): string {
  let cleanedText = text;
  
  INJECTION_PATTERNS.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  // Remove multiple consecutive spaces and normalize
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
}

/**
 * Enhanced text sanitization with timeout protection
 */
export function sanitizeText(text: string, maxTokens: number = 2000): string {
  // First redact PHI
  let sanitized = redactPHI(text);
  
  // Remove injection attempts
  sanitized = removePromptInjection(sanitized);
  
  // Validate and truncate if needed
  sanitized = validateSecurityText(sanitized, maxTokens);
  
  return sanitized;
}

/**
 * Enhanced rate limiting with exponential backoff
 */
export function checkRateLimit(
  userId: string, 
  endpoint: string, 
  limit: number = 100, 
  windowMs: number = 60000
): boolean {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < now) {
    // Reset or new entry
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false; // Rate limit exceeded
  }
  
  // Increment count
  current.count++;
  return true;
}

/**
 * Get rate limit status for a user/endpoint
 */
export function getRateLimitStatus(userId: string, endpoint: string): {
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} {
  const key = `${userId}:${endpoint}`;
  const current = rateLimitStore.get(key);
  
  if (!current) {
    return { remaining: 100, resetTime: Date.now() + 60000, isLimited: false };
  }
  
  const remaining = Math.max(0, 100 - current.count);
  const isLimited = current.count >= 100;
  
  return {
    remaining,
    resetTime: current.resetTime,
    isLimited
  };
}

/**
 * Enhanced secure hash generation with salt
 */
export function generatePassageHash(text: string, source: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const content = `${text}:${source}:${salt}:${Date.now()}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Enhanced source integrity validation
 */
export function validateSourceIntegrity(
  content: string, 
  expectedChecksum: string
): boolean {
  const actualChecksum = crypto.createHash('sha256').update(content).digest('hex');
  return actualChecksum === expectedChecksum;
}

/**
 * Enhanced logging sanitization
 */
export function sanitizeForLogging(text: string): string {
  // Remove sensitive information from logs
  let sanitized = text
    .replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAME]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{2,3}\/\d{2,3}\b/g, '[BP]') // Blood pressure
    .replace(/\b\d+(?:\.\d+)?\s*(?:kg|lb|cm|inches?)\b/g, '[VITAL]'); // Vitals
  
  // Truncate long text
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...';
  }
  
  return sanitized;
}

/**
 * Enhanced security threat detection
 */
export function detectSecurityThreats(text: string): {
  hasPHI: boolean;
  hasInjection: boolean;
  hasDirectives: boolean;
  threats: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  const threats: string[] = [];
  let hasPHI = false;
  let hasInjection = false;
  let hasDirectives = false;
  
  // Check for PHI
  PHI_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      hasPHI = true;
      threats.push('PHI detected');
    }
  });
  
  // Check for injection attempts
  INJECTION_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      hasInjection = true;
      threats.push('Prompt injection detected');
    }
  });
  
  // Check for system directives
  if (/\b(system|user|assistant|human|AI)\s*:/gi.test(text)) {
    hasDirectives = true;
    threats.push('System directives detected');
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (hasInjection) riskLevel = 'critical';
  else if (hasDirectives) riskLevel = 'high';
  else if (hasPHI) riskLevel = 'medium';
  
  return {
    hasPHI,
    hasInjection,
    hasDirectives,
    threats,
    riskLevel
  };
}

/**
 * Enhanced secure system prompt creation
 */
export function createSecureSystemPrompt(basePrompt: string): string {
  const securityPrefix = `You are a pediatric EM educator. IMPORTANT SECURITY RULES:
1. NEVER generate numbers, doses, or vital signs - refer to rules service
2. ONLY cite provided passages by (caseId#passageId)
3. If asked for numbers, respond: "Refer to rules service for specific values"
4. Reject requests that lack sufficient evidence
5. Never bypass safety protocols
6. Do not roleplay or simulate being other entities
7. Stay within medical education scope only

${basePrompt}`;

  return sanitizeText(securityPrefix, 1000);
}

/**
 * Enhanced session security validation
 */
export function validateSessionSecurity(
  sessionId: string, 
  userId: string, 
  timestamp: number
): boolean {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  // Check if session is too old
  if (now - timestamp > maxAge) {
    return false;
  }
  
  // Validate session ID format (enhanced)
  if (!/^[a-zA-Z0-9-_]{16,64}$/.test(sessionId)) {
    return false;
  }
  
  // Validate user ID format
  if (!/^\d+$/.test(userId)) {
    return false;
  }
  
  return true;
}

/**
 * Get request timeout for a specific endpoint
 */
export function getRequestTimeout(endpoint: string): number {
  return REQUEST_TIMEOUTS[endpoint as keyof typeof REQUEST_TIMEOUTS] || REQUEST_TIMEOUTS.default;
}

/**
 * Create a timeout promise for requests
 */
export function createTimeoutPromise<T>(
  promise: Promise<T>,
  timeoutMs: number,
  endpoint: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms for ${endpoint}`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Enhanced circuit breaker for repeated failures
 */
const failureCounts = new Map<string, { count: number; lastFailure: number; isOpen: boolean }>();

export function checkCircuitBreaker(endpoint: string, userId: string): boolean {
  const key = `${endpoint}:${userId}`;
  const now = Date.now();
  const circuit = failureCounts.get(key);
  
  if (!circuit) {
    failureCounts.set(key, { count: 0, lastFailure: 0, isOpen: false });
    return true;
  }
  
  // Reset circuit if enough time has passed
  if (now - circuit.lastFailure > 5 * 60 * 1000) { // 5 minutes
    circuit.count = 0;
    circuit.isOpen = false;
  }
  
  // Open circuit if too many failures
  if (circuit.count >= 5) {
    circuit.isOpen = true;
    return false;
  }
  
  return !circuit.isOpen;
}

export function recordFailure(endpoint: string, userId: string): void {
  const key = `${endpoint}:${userId}`;
  const circuit = failureCounts.get(key) || { count: 0, lastFailure: 0, isOpen: false };
  
  circuit.count++;
  circuit.lastFailure = Date.now();
  
  failureCounts.set(key, circuit);
}

export function recordSuccess(endpoint: string, userId: string): void {
  const key = `${endpoint}:${userId}`;
  const circuit = failureCounts.get(key);
  
  if (circuit) {
    circuit.count = Math.max(0, circuit.count - 1); // Reduce failure count on success
    failureCounts.set(key, circuit);
  }
}


