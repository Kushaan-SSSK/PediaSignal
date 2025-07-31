// PediaSignal AI Chrome Extension - Background Service Worker

const PEDIASIGNAL_API = 'https://pediasignal-ai.kushaan-sharma.repl.co'; // Update with your actual Replit URL
const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

// Pediatric-related keywords for content detection
const PEDIATRIC_KEYWORDS = [
  'pediatric', 'pediatrics', 'children', 'child', 'infant', 'baby', 'babies', 'toddler',
  'newborn', 'kids', 'vaccination', 'vaccine', 'immunization', 'childhood', 'developmental',
  'growth', 'formula', 'breastfeeding', 'fever', 'cough', 'ear infection', 'rash',
  'allergies', 'asthma', 'autism', 'adhd', 'developmental delay', 'milestones',
  'pediatrician', 'child health', 'infant care', 'child development', 'child safety'
];

// Medical misinformation patterns
const MISINFORMATION_PATTERNS = [
  'vaccines cause autism',
  'natural immunity better than vaccines',
  'essential oils cure',
  'detox removes toxins',
  'big pharma conspiracy',
  'doctors hiding cure',
  'homeopathy treats',
  'alternative medicine cures',
  'government coverup',
  'natural healing'
];

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('PediaSignal AI Monitor installed');
  
  // Initialize storage
  chrome.storage.local.set({
    isEnabled: true,
    detectionCount: 0,
    lastScan: null,
    riskAlerts: []
  });
});

// Message handler from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'analyzePage':
      analyzePage(request.data, sender.tab)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'getStatus':
      getMonitorStatus()
        .then(status => sendResponse({ success: true, data: status }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'toggleMonitor':
      toggleMonitor(request.enabled)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'sendFeedback':
      sendUserFeedback(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'getScientificReferences':
      getScientificReferences(request.query)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

// Analyze page content for pediatric misinformation
async function analyzePage(pageData, tab) {
  try {
    // Check if page contains pediatric content
    const hasPediatricContent = detectPediatricContent(pageData.text);
    
    if (!hasPediatricContent) {
      return {
        isPediatricRelated: false,
        riskLevel: 'none',
        message: 'No pediatric health content detected'
      };
    }
    
    // Analyze for misinformation patterns
    const analysis = await analyzeForMisinformation(pageData);
    
    // Update storage with results
    await updateStorageWithAnalysis(analysis, tab);
    
    // Update badge based on risk level
    updateBadge(analysis.riskLevel, tab.id);
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing page:', error);
    throw error;
  }
}

// Detect if page contains pediatric-related content
function detectPediatricContent(text) {
  const lowerText = text.toLowerCase();
  return PEDIATRIC_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// Analyze text for misinformation patterns
async function analyzeForMisinformation(pageData) {
  const text = pageData.text.toLowerCase();
  const url = pageData.url;
  const title = pageData.title;
  
  let riskScore = 0;
  let detectedPatterns = [];
  let riskFactors = [];
  let flaggedClaims = [];
  
  // Check for misinformation patterns
  MISINFORMATION_PATTERNS.forEach(pattern => {
    if (text.includes(pattern.toLowerCase())) {
      riskScore += 2;
      detectedPatterns.push(pattern);
      riskFactors.push(`Potential misinformation pattern: "${pattern}"`);
      
      // Find the actual text in the content
      const textIndex = text.indexOf(pattern.toLowerCase());
      const originalText = pageData.text.substring(textIndex, textIndex + pattern.length);
      
      flaggedClaims.push({
        text: originalText,
        pattern: pattern,
        explanation: `This statement matches a known misinformation pattern about "${pattern}"`,
        recommendation: 'Verify this information with reliable medical sources',
        sources: []
      });
    }
  });
  
  // Check for suspicious language indicators
  const suspiciousTerms = [
    'doctors don\'t want you to know',
    'pharmaceutical companies hide',
    'natural cure they don\'t want',
    'miracle cure',
    'secret remedy',
    'government conspiracy',
    'big pharma lies'
  ];
  
  suspiciousTerms.forEach(term => {
    if (text.includes(term)) {
      riskScore += 1;
      riskFactors.push(`Suspicious language: "${term}"`);
      
      const textIndex = text.indexOf(term);
      const originalText = pageData.text.substring(textIndex, textIndex + term.length);
      
      flaggedClaims.push({
        text: originalText,
        pattern: term,
        explanation: `This language uses suspicious terms that often indicate misinformation`,
        recommendation: 'Be cautious of claims using sensationalist language',
        sources: []
      });
    }
  });
  
  // Try to analyze with PediaSignal AI API (if available)
  let aiAnalysis = null;
  try {
    aiAnalysis = await callPediaSignalAPI(pageData);
    
    // Use AI analysis if available
    if (aiAnalysis && aiAnalysis.riskScore !== undefined) {
      riskScore = aiAnalysis.riskScore * 10; // Scale to 0-10
      riskLevel = aiAnalysis.severity || 'low';
      
      // Extract flagged claims from AI analysis
      if (aiAnalysis.explanation) {
        flaggedClaims.push({
          text: 'AI-detected concern',
          pattern: 'AI Analysis',
          explanation: aiAnalysis.explanation,
          recommendation: aiAnalysis.recommendedAction || 'Review this information carefully',
          sources: aiAnalysis.scientificReferences || []
        });
      }
    }
  } catch (error) {
    console.warn('API analysis unavailable:', error.message);
  }
  
  // Determine risk level if not set by AI
  if (!aiAnalysis) {
    if (riskScore >= 4) riskLevel = 'high';
    else if (riskScore >= 2) riskLevel = 'medium';
    else riskLevel = 'low';
  }
  
  return {
    isPediatricRelated: true,
    riskLevel,
    riskScore,
    detectedPatterns,
    riskFactors,
    flaggedClaims,
    url,
    title,
    timestamp: new Date().toISOString(),
    aiAnalysis
  };
}

// Call PediaSignal AI API for advanced analysis
async function callPediaSignalAPI(pageData) {
  try {
    const response = await fetch(`${PEDIASIGNAL_API}/api/misinfo-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: pageData.text,
        source: pageData.url,
        platform: 'web',
        userId: 'extension-user'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Enhance with scientific references if high risk
    if (result.riskScore > 0.4) {
      try {
        const references = await getScientificReferences(pageData.text);
        result.scientificReferences = references;
      } catch (error) {
        console.warn('Failed to get scientific references:', error);
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to analyze with AI: ${error.message}`);
  }
}

// Get scientific references from PubMed
async function getScientificReferences(query) {
  try {
    // Search PubMed for relevant articles
    const searchUrl = `${PUBMED_API}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=5&sort=relevance`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error('PubMed search failed');
    }
    
    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult.idlist;
    
    if (!pmids || pmids.length === 0) {
      return [];
    }
    
    // Get article details
    const summaryUrl = `${PUBMED_API}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    
    if (!summaryResponse.ok) {
      throw new Error('PubMed summary failed');
    }
    
    const summaryData = await summaryResponse.json();
    const articles = [];
    
    for (const pmid of pmids) {
      const article = summaryData.result[pmid];
      if (article) {
        articles.push({
          title: article.title || 'No title available',
          authors: article.authors ? article.authors.map(a => a.name).join(', ') : 'Unknown authors',
          journal: article.fulljournalname || 'Unknown journal',
          pubDate: article.pubdate || 'Unknown date',
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          abstract: article.abstract || 'No abstract available'
        });
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Error fetching scientific references:', error);
    return [];
  }
}

// Send user feedback to API
async function sendUserFeedback(feedbackData) {
  try {
    const response = await fetch(`${PEDIASIGNAL_API}/api/misinfo-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });
    
    if (!response.ok) {
      throw new Error(`Feedback API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to send feedback: ${error.message}`);
  }
}

// Update storage with analysis results
async function updateStorageWithAnalysis(analysis, tab) {
  const storage = await chrome.storage.local.get(['detectionCount', 'riskAlerts']);
  
  const newCount = (storage.detectionCount || 0) + 1;
  const alerts = storage.riskAlerts || [];
  
  // Add high-risk alerts to storage
  if (analysis.riskLevel === 'high') {
    alerts.unshift({
      ...analysis,
      tabId: tab.id,
      tabTitle: tab.title,
      id: Date.now()
    });
    
    // Keep only last 50 alerts
    if (alerts.length > 50) {
      alerts.splice(50);
    }
  }
  
  await chrome.storage.local.set({
    detectionCount: newCount,
    riskAlerts: alerts,
    lastScan: new Date().toISOString()
  });
}

// Update extension badge
function updateBadge(riskLevel, tabId) {
  let badgeText = '';
  let badgeColor = '#666666';
  
  switch (riskLevel) {
    case 'high':
      badgeText = '⚠';
      badgeColor = '#ef4444';
      break;
    case 'medium':
      badgeText = '!';
      badgeColor = '#f59e0b';
      break;
    case 'low':
      badgeText = '✓';
      badgeColor = '#10b981';
      break;
  }
  
  chrome.action.setBadgeText({ text: badgeText, tabId });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
}

// Get current monitor status
async function getMonitorStatus() {
  const storage = await chrome.storage.local.get([
    'isEnabled', 'detectionCount', 'lastScan', 'riskAlerts'
  ]);
  
  return {
    isEnabled: storage.isEnabled !== false,
    detectionCount: storage.detectionCount || 0,
    lastScan: storage.lastScan,
    alertCount: (storage.riskAlerts || []).length
  };
}

// Toggle monitor on/off
async function toggleMonitor(enabled) {
  await chrome.storage.local.set({ isEnabled: enabled });
  
  if (!enabled) {
    // Clear all badges when disabled
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    });
  }
  
  return { isEnabled: enabled };
}

// Tab update listener to clear badge when navigating away
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});