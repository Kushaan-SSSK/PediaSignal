// PediaSignal AI Chrome Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
});

// Initialize popup interface
async function initializePopup() {
  try {
    // Load current status
    await loadStatus();
    
    // Setup event listeners
    setupEventListeners();
    
    // Analyze current page
    await analyzeCurrentPage();
    
    // Load recent alerts
    await loadRecentAlerts();
    
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Failed to load extension data');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Monitor toggle
  const toggle = document.getElementById('monitor-toggle');
  toggle.addEventListener('change', handleToggleChange);
  
  // Analyze button
  const analyzeBtn = document.getElementById('analyze-btn');
  analyzeBtn.addEventListener('click', handleAnalyzeClick);
  
  // Report button
  const reportBtn = document.getElementById('report-btn');
  reportBtn.addEventListener('click', handleReportClick);
  
  // Settings and about links
  document.getElementById('settings-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  });
  
  document.getElementById('about-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://your-domain.replit.app/about' });
  });
}

// Load current status
async function loadStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    
    if (response.success) {
      const status = response.data;
      updateStatusDisplay(status);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Failed to load status:', error);
    showError('Failed to load status');
  }
}

// Update status display
function updateStatusDisplay(status) {
  const toggle = document.getElementById('monitor-toggle');
  const statusText = document.getElementById('status-text');
  const scanCount = document.getElementById('scan-count');
  const alertCount = document.getElementById('alert-count');
  
  toggle.checked = status.isEnabled;
  statusText.textContent = status.isEnabled ? 'Active' : 'Disabled';
  statusText.className = status.isEnabled ? 'status-value enabled' : 'status-value disabled';
  scanCount.textContent = status.detectionCount;
  alertCount.textContent = status.alertCount;
}

// Handle toggle change
async function handleToggleChange(event) {
  const enabled = event.target.checked;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'toggleMonitor',
      enabled: enabled
    });
    
    if (response.success) {
      updateStatusDisplay(response.data);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Failed to toggle monitor:', error);
    // Revert toggle state
    event.target.checked = !enabled;
    showError('Failed to toggle monitor');
  }
}

// Analyze current page
async function analyzeCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      updatePageStatus('Not available for this page');
      return;
    }
    
    updatePageStatus('Analyzing...');
    
    // Get page content and analyze
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        url: window.location.href,
        title: document.title,
        text: document.body.innerText || document.body.textContent || ''
      })
    });
    
    if (results && results[0] && results[0].result) {
      const pageData = results[0].result;
      
      const response = await chrome.runtime.sendMessage({
        action: 'analyzePage',
        data: pageData
      });
      
      if (response.success) {
        updatePageAnalysis(response.data);
      } else {
        throw new Error(response.error);
      }
    }
    
  } catch (error) {
    console.error('Failed to analyze current page:', error);
    updatePageStatus('Analysis failed');
  }
}

// Update page analysis display
function updatePageAnalysis(analysis) {
  const pageStatus = document.getElementById('page-status');
  const pageDetails = document.getElementById('page-details');
  const riskLevel = document.getElementById('risk-level');
  const riskFactors = document.getElementById('risk-factors');
  
  if (!analysis.isPediatricRelated) {
    pageStatus.textContent = 'No pediatric health content detected';
    pageDetails.style.display = 'none';
    return;
  }
  
  pageStatus.textContent = 'Pediatric content detected';
  pageDetails.style.display = 'block';
  
  // Risk level
  riskLevel.textContent = `Risk Level: ${analysis.riskLevel.toUpperCase()}`;
  riskLevel.className = `risk-level ${analysis.riskLevel}`;
  
  // Risk factors
  if (analysis.riskFactors && analysis.riskFactors.length > 0) {
    riskFactors.innerHTML = `
      <strong>Risk Factors:</strong>
      <ul>
        ${analysis.riskFactors.map(factor => `<li>${factor}</li>`).join('')}
      </ul>
    `;
  } else {
    riskFactors.textContent = 'No specific risk factors identified';
  }
}

// Update page status
function updatePageStatus(status) {
  document.getElementById('page-status').textContent = status;
  document.getElementById('page-details').style.display = 'none';
}

// Handle analyze button click
async function handleAnalyzeClick() {
  const btn = document.getElementById('analyze-btn');
  btn.classList.add('loading');
  btn.disabled = true;
  
  try {
    await analyzeCurrentPage();
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// Handle report button click
async function handleReportClick() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const reportData = {
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    // Open report form in new tab
    const reportUrl = `https://your-domain.replit.app/report?data=${encodeURIComponent(JSON.stringify(reportData))}`;
    chrome.tabs.create({ url: reportUrl });
    
  } catch (error) {
    console.error('Failed to open report:', error);
    showError('Failed to open report form');
  }
}

// Load recent alerts
async function loadRecentAlerts() {
  try {
    const storage = await chrome.storage.local.get(['riskAlerts']);
    const alerts = storage.riskAlerts || [];
    
    if (alerts.length > 0) {
      displayRecentAlerts(alerts.slice(0, 5)); // Show top 5 recent alerts
      document.getElementById('alerts-section').style.display = 'block';
    }
    
  } catch (error) {
    console.error('Failed to load alerts:', error);
  }
}

// Display recent alerts
function displayRecentAlerts(alerts) {
  const alertsList = document.getElementById('alerts-list');
  
  alertsList.innerHTML = alerts.map(alert => `
    <div class="alert-item">
      <div class="alert-title">${alert.riskLevel.toUpperCase()} Risk Alert</div>
      <div class="alert-details">
        <div>${alert.title || 'Unknown Page'}</div>
        <div style="margin-top: 4px; font-size: 10px;">
          ${formatTimeAgo(alert.timestamp)}
        </div>
      </div>
    </div>
  `).join('');
}

// Format time ago
function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// Show error message
function showError(message) {
  const statusText = document.getElementById('status-text');
  const originalText = statusText.textContent;
  const originalClass = statusText.className;
  
  statusText.textContent = message;
  statusText.className = 'status-value disabled';
  
  setTimeout(() => {
    statusText.textContent = originalText;
    statusText.className = originalClass;
  }, 3000);
}