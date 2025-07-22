// PediaSignal AI Chrome Extension - Background Service Worker

const PEDIASIGNAL_API = 'https://your-domain.replit.app'; // Replace with actual API endpoint

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
  
  // Check for misinformation patterns
  MISINFORMATION_PATTERNS.forEach(pattern => {
    if (text.includes(pattern.toLowerCase())) {
      riskScore += 2;
      detectedPatterns.push(pattern);
      riskFactors.push(`Potential misinformation pattern: "${pattern}"`);
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
    }
  });
  
  // Determine risk level
  let riskLevel = 'low';
  if (riskScore >= 4) riskLevel = 'high';
  else if (riskScore >= 2) riskLevel = 'medium';
  
  // Try to analyze with PediaSignal AI API (if available)
  let aiAnalysis = null;
  try {
    aiAnalysis = await callPediaSignalAPI(pageData);
  } catch (error) {
    console.warn('API analysis unavailable:', error.message);
  }
  
  return {
    isPediatricRelated: true,
    riskLevel,
    riskScore,
    detectedPatterns,
    riskFactors,
    url,
    title,
    timestamp: new Date().toISOString(),
    aiAnalysis
  };
}

// Call PediaSignal AI API for advanced analysis
async function callPediaSignalAPI(pageData) {
  try {
    const response = await fetch(`${PEDIASIGNAL_API}/api/misinfo-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: pageData.text,
        url: pageData.url,
        title: pageData.title
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to analyze with AI: ${error.message}`);
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