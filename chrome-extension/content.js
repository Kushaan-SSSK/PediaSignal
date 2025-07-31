// PediaSignal AI Chrome Extension - Content Script v2.0

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

// Enhanced content extraction using Readability-like heuristics
function extractPageContent() {
  // Try to find the main article content
  let mainContent = '';
  let articleElement = null;
  
  // Priority selectors for main content
  const contentSelectors = [
    'article',
    '[role="main"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content',
    'main',
    '.main-content'
  ];
  
  // Find the best content container
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.length > 500) {
      articleElement = element;
      mainContent = element.textContent;
      break;
    }
  }
  
  // Fallback to body content if no article found
  if (!mainContent) {
    mainContent = document.body.innerText || document.body.textContent || '';
  }
  
  // Clean up the content
  const cleanContent = mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  return {
    url: window.location.href,
    title: document.title,
    text: cleanContent,
    domain: window.location.hostname,
    timestamp: new Date().toISOString(),
    articleElement: articleElement,
    hasArticleContent: !!articleElement
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

// Handle detected pediatric content with inline highlighting
function handlePediatricContent(analysis) {
  console.log('PediaSignal AI: Pediatric content detected', analysis);
  
  // Show notification for high-risk content
  if (analysis.riskLevel === 'high') {
    showRiskWarning(analysis);
  }
  
  // Add visual indicator to page
  if (analysis.riskLevel !== 'low') {
    addPageIndicator(analysis.riskLevel);
  }
  
  // Highlight problematic statements inline
  if (analysis.flaggedClaims && analysis.flaggedClaims.length > 0) {
    highlightFlaggedClaims(analysis.flaggedClaims, analysis.riskLevel);
  }
}

// Highlight flagged claims with inline spans and tooltips
function highlightFlaggedClaims(claims, riskLevel) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script and style tags
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  claims.forEach(claim => {
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      if (text.toLowerCase().includes(claim.text.toLowerCase())) {
        highlightTextInNode(textNode, claim, riskLevel);
      }
    });
  });
}

// Highlight specific text within a text node
function highlightTextInNode(textNode, claim, riskLevel) {
  const text = textNode.textContent;
  const claimText = claim.text.toLowerCase();
  const startIndex = text.toLowerCase().indexOf(claimText);
  
  if (startIndex === -1) return;
  
  const parent = textNode.parentNode;
  const beforeText = text.substring(0, startIndex);
  const highlightedText = text.substring(startIndex, startIndex + claim.text.length);
  const afterText = text.substring(startIndex + claim.text.length);
  
  // Create text fragments
  const fragments = [];
  
  if (beforeText) {
    fragments.push(document.createTextNode(beforeText));
  }
  
  // Create highlighted span
  const span = document.createElement('span');
  span.className = `pediasignal-highlight pediasignal-${riskLevel}`;
  span.textContent = highlightedText;
  span.title = `PediaSignal AI: ${claim.explanation}`;
  
  // Add data attributes for tooltip
  span.setAttribute('data-pediasignal-claim', claim.text);
  span.setAttribute('data-pediasignal-explanation', claim.explanation);
  span.setAttribute('data-pediasignal-recommendation', claim.recommendation);
  span.setAttribute('data-pediasignal-sources', JSON.stringify(claim.sources || []));
  
  // Add hover event for detailed tooltip
  span.addEventListener('mouseenter', (e) => {
    showDetailedTooltip(e, claim, riskLevel);
  });
  
  span.addEventListener('mouseleave', hideDetailedTooltip);
  
  fragments.push(span);
  
  if (afterText) {
    fragments.push(document.createTextNode(afterText));
  }
  
  // Replace the original text node
  fragments.forEach(fragment => parent.insertBefore(fragment, textNode));
  parent.removeChild(textNode);
}

// Show detailed tooltip with scientific references
function showDetailedTooltip(event, claim, riskLevel) {
  const tooltip = document.createElement('div');
  tooltip.id = 'pediasignal-tooltip';
  tooltip.className = `pediasignal-tooltip pediasignal-${riskLevel}`;
  
  const riskColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };
  
  tooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="risk-indicator" style="background: ${riskColors[riskLevel]}"></span>
      <span class="risk-level">${riskLevel.toUpperCase()} RISK</span>
    </div>
    <div class="tooltip-content">
      <div class="claim-text">"${claim.text}"</div>
      <div class="explanation">${claim.explanation}</div>
      <div class="recommendation">${claim.recommendation}</div>
      ${claim.sources && claim.sources.length > 0 ? `
        <div class="sources">
          <strong>Scientific References:</strong>
          <ul>
            ${claim.sources.map(source => `<li><a href="${source.url}" target="_blank">${source.title}</a></li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    <div class="tooltip-footer">
      <button class="feedback-btn agree" data-claim="${claim.text}">Agree</button>
      <button class="feedback-btn disagree" data-claim="${claim.text}">Disagree</button>
    </div>
  `;
  
  // Position tooltip
  const rect = event.target.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.top = `${rect.bottom + 10}px`;
  tooltip.style.zIndex = '10001';
  
  document.body.appendChild(tooltip);
  
  // Add feedback event listeners
  tooltip.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const feedback = e.target.classList.contains('agree') ? 'agree' : 'disagree';
      sendFeedback(claim.text, feedback);
      hideDetailedTooltip();
    });
  });
}

// Hide detailed tooltip
function hideDetailedTooltip() {
  const tooltip = document.getElementById('pediasignal-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

// Send user feedback to background script
function sendFeedback(claimText, feedback) {
  chrome.runtime.sendMessage({
    action: 'sendFeedback',
    data: {
      claim: claimText,
      feedback: feedback,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
  });
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