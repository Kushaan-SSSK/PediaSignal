// PediaSignal AI Chrome Extension - Content Script

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Extract page content for analysis
function extractPageContent() {
  return {
    url: window.location.href,
    title: document.title,
    text: document.body.innerText || document.body.textContent || '',
    domain: window.location.hostname,
    timestamp: new Date().toISOString()
  };
}

// Check if monitor is enabled
async function isMonitorEnabled() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    return response.success && response.data.isEnabled;
  } catch (error) {
    console.error('Failed to check monitor status:', error);
    return false;
  }
}

// Analyze current page
async function analyzePage() {
  try {
    const enabled = await isMonitorEnabled();
    if (!enabled) return;
    
    const pageData = extractPageContent();
    
    // Skip analysis for certain domains
    const skipDomains = ['localhost', '127.0.0.1', 'chrome:', 'chrome-extension:', 'about:'];
    if (skipDomains.some(domain => pageData.domain.includes(domain))) {
      return;
    }
    
    // Send page data to background script for analysis
    const response = await chrome.runtime.sendMessage({
      action: 'analyzePage',
      data: pageData
    });
    
    if (response.success && response.data.isPediatricRelated) {
      handlePediatricContent(response.data);
    }
    
  } catch (error) {
    console.error('Page analysis failed:', error);
  }
}

// Handle detected pediatric content
function handlePediatricContent(analysis) {
  console.log('PediaSignal AI: Pediatric content detected', analysis);
  
  // Show notification for high-risk content
  if (analysis.riskLevel === 'high') {
    showRiskWarning(analysis);
  }
  
  // Add visual indicator to page (optional)
  if (analysis.riskLevel !== 'low') {
    addPageIndicator(analysis.riskLevel);
  }
}

// Show risk warning notification
function showRiskWarning(analysis) {
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'pediasignal-warning';
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    max-width: 300px;
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="font-size: 16px;">⚠️</div>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">PediaSignal AI Alert</div>
        <div style="font-size: 12px; opacity: 0.9;">
          Potential pediatric health misinformation detected on this page
        </div>
      </div>
    </div>
  `;
  
  // Remove existing notifications
  const existing = document.getElementById('pediasignal-warning');
  if (existing) existing.remove();
  
  document.body.appendChild(notification);
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }
  }, 8000);
  
  // Remove on click
  notification.addEventListener('click', () => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  });
}

// Add page indicator
function addPageIndicator(riskLevel) {
  // Create floating indicator
  const indicator = document.createElement('div');
  indicator.id = 'pediasignal-indicator';
  
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };
  
  const icons = {
    high: '⚠️',
    medium: '⚡',
    low: '✅'
  };
  
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    background: ${colors[riskLevel]};
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    cursor: pointer;
    transition: transform 0.2s ease;
  `;
  
  indicator.innerHTML = icons[riskLevel];
  indicator.title = `PediaSignal AI: ${riskLevel} risk pediatric content detected`;
  
  // Hover effect
  indicator.addEventListener('mouseenter', () => {
    indicator.style.transform = 'scale(1.1)';
  });
  
  indicator.addEventListener('mouseleave', () => {
    indicator.style.transform = 'scale(1)';
  });
  
  // Click to show more info
  indicator.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  // Remove existing indicator
  const existing = document.getElementById('pediasignal-indicator');
  if (existing) existing.remove();
  
  document.body.appendChild(indicator);
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (indicator && indicator.parentNode) {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }
  }, 30000);
}

// Debounced analysis function
const debouncedAnalyzePage = debounce(analyzePage, 2000);

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', debouncedAnalyzePage);
} else {
  // Page already loaded
  setTimeout(debouncedAnalyzePage, 1000);
}

// Monitor page changes (for SPAs)
let currentUrl = window.location.href;
new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(debouncedAnalyzePage, 2000);
  }
}).observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for scroll events to re-analyze content
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (document.body.scrollHeight > window.innerHeight * 2) {
      debouncedAnalyzePage();
    }
  }, 3000);
});