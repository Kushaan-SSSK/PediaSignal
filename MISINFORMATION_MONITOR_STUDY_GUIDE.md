# Misinformation Monitor System - Technical Study Guide

## System Overview

The Misinformation Monitor is an AI-powered content analysis system that detects and classifies pediatric health misinformation across web platforms. It uses GPT-4o to analyze content, assess risk levels, and provide detailed explanations of potentially harmful health claims.

## Data Flow Architecture

### Step 1: Content Input Methods
User selects analysis mode → Content entered via multiple channels → System validates input

**Three Input Methods:**
1. **Manual Content Entry**: Direct text paste into textarea
2. **Web Scraping**: URL input for automatic content extraction  
3. **Batch Processing**: Multiple items analyzed simultaneously

```typescript
const [batchMode, setBatchMode] = useState(false);
const [content, setContent] = useState('');
const [scrapeUrl, setScrapeUrl] = useState('');
```

**Mode Selection Logic:**
- `batchMode` boolean toggles between single/batch analysis
- Single mode: Immediate analysis of entered content
- Batch mode: Queue multiple items for processing
- Web scraping: Automated content extraction from URLs

### Step 2: Content Validation and Preprocessing
Input validated → Content cleaned → Platform/source identified → Analysis prepared

```typescript
const handleSingleScan = () => {
  if (!content.trim()) {
    toast({
      title: 'Input Required',
      description: 'Please enter content to scan.',
      variant: 'destructive',
    });
    return;
  }
  scanMutation.mutate({ content, source, platform });
};
```

**Validation Rules:**
- Minimum content length (10 characters)
- Maximum content length (10,000 characters)
- Required fields: content, source (optional), platform
- Content sanitization to remove malicious scripts
- URL validation for web scraping

### Step 3: Web Scraping Pipeline
URL submitted → Content extraction → Text processing → Analysis preparation

```typescript
const scrapeMutation = useMutation({
  mutationFn: async (data: { url: string; platform: string }) => {
    const response = await fetch('/api/scrape-and-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Scraping failed');
    return response.json() as Promise<MisinfoScanResult>;
  },
  onSuccess: (data) => {
    toast({
      title: 'Web Scraping Complete',
      description: `Analyzed content from ${data.title || 'webpage'}`,
    });
  }
});
```

**useMutation Pattern:**
- `mutationFn` handles async web scraping operation
- Error handling with descriptive messages
- Success feedback shows scraped page title
- Result processed same as manual content

## Backend Web Scraping

### Step 4: URL Processing and Content Extraction
Backend receives URL → Validates and fetches page → Extracts meaningful content → Cleans text

```typescript
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
```

**URL Processing Steps:**
- `new URL(url)` validates URL format
- `axios.get()` fetches page with 10-second timeout
- User-Agent header prevents bot blocking
- `cheerio.load()` parses HTML for content extraction

### Step 5: Content Extraction with Cheerio
HTML parsed → Main content identified → Text extracted → Cleaned and formatted

```typescript
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

// Extract title
const title = $('title').first().text().trim() || 
             $('h1').first().text().trim() || 
             'Untitled';
```

**Content Extraction Strategy:**
1. **Primary**: Look for `<article>` tags (semantic HTML)
2. **Secondary**: Search common content class names
3. **Fallback**: Extract from `<body>` if needed
4. **Cleaning**: Remove excess whitespace and line breaks
5. **Limits**: Cap at 5000 characters for analysis efficiency

## AI Analysis Pipeline

### Step 6: OpenAI Misinformation Classification
Content sent to GPT-4o → Analyzed for medical accuracy → Risk scored → Detailed explanation generated

```typescript
export async function classifyMisinformation(content: string, source: string): Promise<{
  riskScore: number;
  category: string;
  explanation: string;
  recommendedAction: string;
}> {
  try {
    const prompt = `
Analyze the following pediatric health content for misinformation:

Content: "${content}"
Source: ${source}

Evaluate for:
1. Medical accuracy regarding pediatric health
2. Potential harm to children if followed
3. Contradiction of established medical guidelines
4. Anti-vaccine sentiment
5. Dangerous home remedies

Provide risk score (0-1), category (vaccine, treatment, emergency_care, general), explanation, and recommended action.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a pediatric health misinformation expert. Analyze content for accuracy and potential harm to children's health."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      riskScore: Math.max(0, Math.min(1, result.riskScore || 0)),
      category: result.category || "general",
      explanation: result.explanation || "Unable to classify content",
      recommendedAction: result.recommendedAction || "Monitor for updates"
    };
  }
}
```

**AI Analysis Process:**
- **Prompt Engineering**: Specific instructions for pediatric health focus
- **Evaluation Criteria**: Medical accuracy, harm potential, guideline conflicts
- **Risk Categories**: Vaccine, treatment, emergency care, general health
- **Temperature 0.3**: Lower randomness for consistent medical analysis
- **JSON Response**: Structured output for easy processing
- **Range Validation**: Risk score clamped between 0-1

### Step 7: Risk Classification and Severity Assessment
AI response processed → Risk level determined → Severity assigned → Recommendations generated

```typescript
app.post('/api/misinfo-scan', async (req, res) => {
  try {
    const { content, source, platform, userId } = req.body;
    
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
      recommendedAction: analysis.recommendedAction,
      severity: analysis.riskScore > 0.8 ? 'critical' : 
                analysis.riskScore > 0.6 ? 'high' : 
                analysis.riskScore > 0.4 ? 'medium' : 'low',
      flaggedForReview: analysis.riskScore > 0.6
    });
  }
});
```

**Severity Mapping:**
- **Critical** (0.8-1.0): Immediately dangerous misinformation
- **High** (0.6-0.8): Seriously concerning false claims
- **Medium** (0.4-0.6): Potentially misleading information  
- **Low** (0.0-0.4): Minor inaccuracies or unclear claims

**Flagging Logic:**
- `flaggedForReview: analysis.riskScore > 0.6` triggers manual review
- High-risk content marked for expert verification
- Audit trail maintained for all classifications

## Frontend Results Display

### Step 8: Analysis Results Rendering
Results received → Severity styling applied → Detailed explanations shown → User feedback enabled

```typescript
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

**Result Display Components:**
- **Risk Score**: Large percentage display with severity badge
- **Category**: Content classification (vaccine, treatment, etc.)
- **AI Explanation**: Detailed reasoning for the assessment
- **Flagged Claims**: Specific problematic statements highlighted
- **Recommendations**: Suggested actions for addressing misinformation

### Step 9: Batch Processing Implementation
Multiple items queued → Processed sequentially → Results aggregated → Summary displayed

```typescript
const batchScanMutation = useMutation({
  mutationFn: async (items: Array<{ content: string; source: string; platform: string }>) => {
    const response = await fetch('/api/misinfo-scan-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) throw new Error('Batch scan failed');
    return response.json();
  },
  onSuccess: (data) => {
    toast({
      title: 'Batch Scan Complete',
      description: `Processed ${data.length} items successfully`,
    });
  }
});

const addBatchItem = () => {
  if (!content.trim()) return;
  setBatchItems([...batchItems, { content, source, platform }]);
  setContent('');
  setSource('');
  setPlatform('');
};
```

**Batch Processing Features:**
- **Queue Management**: Add/remove items before processing
- **Bulk Analysis**: Process up to 10 items simultaneously
- **Progress Tracking**: Visual indication of processing status
- **Aggregated Results**: Summary statistics across batch items

## Real-time Dashboard and Analytics

### Step 10: Statistics Dashboard
Analytics aggregated → Real-time metrics displayed → Trends visualized → Alerts configured

```typescript
const { data: stats = {} as MisinfoStats } = useQuery({
  queryKey: ['misinfo-stats'],
  queryFn: async () => {
    const response = await fetch('/api/misinfo-stats');
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json() as Promise<MisinfoStats>;
  },
  refetchInterval: 30000, // Refresh every 30 seconds
});
```

**Dashboard Metrics:**
- **Total Scans**: Cumulative content analyses performed
- **High Risk Items**: Count of dangerous misinformation detected
- **Average Risk Score**: Mean risk assessment across all content
- **Category Breakdown**: Distribution by misinformation type
- **Recent Trends**: Time-series data for pattern analysis

### Step 11: User Feedback Integration
Results displayed → User feedback collected → AI training improved → Classification refined

```typescript
const feedbackMutation = useMutation({
  mutationFn: async (data: { 
    logId: number; 
    feedback: 'agree' | 'disagree'; 
    reason?: string 
  }) => {
    const response = await fetch('/api/misinfo-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Feedback submission failed');
    return response.json();
  }
});

const handleFeedback = (feedback: 'agree' | 'disagree') => {
  if (!scanMutation.data) return;
  
  setUserFeedback(feedback);
  feedbackMutation.mutate({
    logId: (scanMutation.data as any).logId || 0,
    feedback,
    reason: feedback === 'disagree' ? 'User disagrees with analysis' : 'User agrees with analysis'
  });
};
```

**Feedback Loop:**
- **Agreement Tracking**: Users validate AI assessments
- **Disagreement Analysis**: Identify classification errors
- **Continuous Learning**: Feedback improves future analyses
- **Quality Assurance**: Manual review of disputed cases

## Chrome Extension Integration

### Step 12: Browser Extension Communication
Extension detects pediatric content → Sends for analysis → Receives risk assessment → Displays warnings

**Content Detection:**
- Keyword-based triggering for pediatric health topics
- Automatic page analysis when relevant content found
- Real-time risk assessment overlay
- User controls for sensitivity settings

**Warning System:**
- Visual indicators for high-risk content
- Explanatory tooltips with detailed analysis
- Links to authoritative medical sources
- Option to report additional misinformation

## Database Schema and Storage

### Misinformation Logs Table Structure
```sql
CREATE TABLE misinfo_logs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  platform TEXT NOT NULL,
  riskScore REAL NOT NULL,
  category TEXT NOT NULL,
  detectedAt TIMESTAMP DEFAULT NOW()
);
```

**Data Storage Strategy:**
- **Comprehensive Logging**: All analyses stored for audit trail
- **Source Tracking**: URL and platform information maintained
- **Risk History**: Temporal analysis of misinformation trends
- **Category Analysis**: Pattern recognition across content types

## Security and Privacy Measures

### Content Security
- **Input Sanitization**: Prevent XSS and injection attacks
- **Rate Limiting**: Prevent abuse of analysis endpoints
- **Content Filtering**: Block malicious or inappropriate submissions
- **Audit Logging**: Track all analysis requests and results

### Privacy Protection
- **Anonymous Analysis**: No personal data required for scanning
- **Data Retention**: Configurable storage periods for content
- **Secure Transmission**: HTTPS encryption for all communications
- **Access Controls**: Restricted admin access to sensitive logs

## Error Handling and Resilience

### Graceful Degradation
- **API Failures**: Fallback to cached results or manual review
- **Network Issues**: Offline capability with queue synchronization
- **Rate Limits**: Intelligent request spacing and retry logic
- **Invalid Content**: Clear error messages and guidance

### Monitoring and Alerting
- **Performance Metrics**: Response time and accuracy tracking
- **Error Rates**: Automated alerts for system issues
- **Content Quality**: Manual review triggers for edge cases
- **User Satisfaction**: Feedback analysis and improvement tracking

This misinformation monitoring system provides comprehensive protection against pediatric health misinformation while maintaining high accuracy through AI analysis and human oversight.