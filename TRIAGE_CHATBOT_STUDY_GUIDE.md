# Triage Chatbot System - Technical Study Guide

## System Overview

The Parent Triage Assistant is an AI-powered chatbot that helps parents assess their child's symptoms and provides guidance on appropriate medical care. The system uses GPT-4o to analyze symptoms, determine risk levels, and recommend actions while prioritizing child safety.

## Data Flow Architecture

### Step 1: User Initiates Chat Session
User opens triage chatbot → React generates unique session ID → Frontend initializes chat interface

```typescript
const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
```

**sessionId Generation:**
- `session_` prefix for identification
- `Date.now()` provides timestamp for uniqueness
- `Math.random().toString(36).substr(2, 9)` adds random string
- Combined format: `session_1754457345841_abc123def`

### Step 2: Parent Sends Symptom Message
Parent types symptoms → handleSendMessage() triggered → Message added to chat state → API request sent

```typescript
const handleSendMessage = () => {
  if (!inputMessage.trim()) return;

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    type: 'user',
    message: inputMessage,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setIsTyping(true);
  chatMutation.mutate(inputMessage);
  setInputMessage('');
};
```

**Frontend Logic:**
- `inputMessage.trim()` validates non-empty input
- `userMessage` object created with unique ID and timestamp
- `setMessages(prev => [...prev, userMessage])` adds message to React state
- `setIsTyping(true)` shows typing indicator
- `chatMutation.mutate()` sends message to backend
- `setInputMessage('')` clears input field

### Step 3: AI Processing Pipeline
Frontend sends POST request → Backend validates input → OpenAI analyzes symptoms → Response generated with risk assessment

```typescript
const chatMutation = useMutation({
  mutationFn: async (message: string) => {
    const response = await apiRequest('POST', '/api/triage-chat', {
      message,
      sessionId
    });
    return response.json();
  },
  onSuccess: (data) => {
    const botMessage: ChatMessage = {
      id: Date.now().toString() + '_bot',
      type: 'bot',
      message: data.response,
      timestamp: new Date(),
      riskLevel: data.riskLevel,
      emergencyWarning: data.emergencyWarning
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);

    if (data.emergencyWarning) {
      toast({
        title: "⚠️ EMERGENCY ALERT",
        description: "Immediate medical attention required",
        variant: "destructive",
      });
    }
  }
});
```

**useMutation Hook:**
- `mutationFn` handles async API communication
- `apiRequest()` sends POST with message and sessionId
- `onSuccess` processes AI response and updates UI
- `emergencyWarning` triggers immediate alert toast
- `setIsTyping(false)` removes typing indicator

## Backend Processing

### Step 4: API Endpoint Handling
Backend receives request → Validates required fields → Calls OpenAI function → Stores conversation

```typescript
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
```

**Express Route Handler:**
- `req.body` destructuring extracts message and sessionId
- Input validation ensures required fields present
- `generateTriageResponse()` calls OpenAI for AI analysis
- `storage.createChatConversation()` saves to database
- `res.json()` returns structured response with risk assessment

### Step 5: OpenAI Integration
AI analyzes symptoms → Determines risk level → Generates response → Returns structured data

```typescript
export async function generateTriageResponse(parentMessage: string): Promise<{
  response: string;
  riskLevel: string;
  recommendedAction: string;
  emergencyWarning: boolean;
}> {
  try {
    const prompt = `
A parent has sent this message about their child's symptoms: "${parentMessage}"

As a pediatric triage AI assistant, provide:
1. A helpful, empathetic response
2. Risk assessment (low, medium, high, emergency)
3. Recommended action (home_care, call_doctor, urgent_care, emergency_room)
4. Whether emergency warning is needed

SAFETY FIRST: Always err on the side of caution for pediatric cases. High fevers, difficulty breathing, lethargy, dehydration, or severe symptoms require immediate medical attention.

Respond in JSON format.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a pediatric triage assistant. Always prioritize child safety and provide clear guidance to parents. Include emergency warnings when appropriate and never replace professional medical advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      response: result.response || "Please consult with a healthcare professional for medical advice.",
      riskLevel: result.riskLevel || "medium",
      recommendedAction: result.recommendedAction || "call_doctor",
      emergencyWarning: result.emergencyWarning || false
    };
  } catch (error) {
    console.error("Triage response error:", error);
    throw new Error("Failed to generate triage response: " + (error as Error).message);
  }
}
```

**OpenAI Function:**
- `prompt` contains parent message and instructions
- System message defines AI role and safety priorities
- `response_format: { type: "json_object" }` ensures structured output
- `temperature: 0.5` balances consistency with appropriate variation
- `JSON.parse()` converts AI response to usable object
- Error handling with fallback values for safety

### Step 6: Database Storage
Conversation data stored → Audit trail created → Response sent to frontend

```typescript
const conversation = await storage.createChatConversation({
  sessionId,
  parentMessage: message,
  aiResponse: triageResult.response,
  riskLevel: triageResult.riskLevel,
  recommendedAction: triageResult.recommendedAction
});
```

**Database Schema (chatConversations table):**
- `id`: Auto-incremented primary key
- `sessionId`: Groups messages in conversation
- `parentMessage`: Original symptom description
- `aiResponse`: AI-generated guidance
- `riskLevel`: Assessed urgency (low/medium/high/emergency)
- `recommendedAction`: Suggested next steps
- `createdAt`: Timestamp for tracking

## Risk Assessment Logic

### Risk Level Determination
AI analyzes symptoms → Assigns risk category → Determines appropriate response

**Risk Categories:**
- **Low**: Minor symptoms, home care appropriate
- **Medium**: Concerning symptoms, contact doctor recommended  
- **High**: Serious symptoms, urgent care needed
- **Emergency**: Life-threatening symptoms, immediate ER/911

**Emergency Triggers:**
- Difficulty breathing or blue lips
- Unconscious or unresponsive
- High fever (>102°F) with lethargy
- Severe dehydration symptoms
- Seizures lasting >5 minutes
- Signs of severe allergic reaction

### Frontend Risk Display
Risk level determines UI styling → Emergency warnings shown → Toast notifications triggered

```typescript
const getRiskColor = (level?: string) => {
  switch (level) {
    case 'emergency':
      return 'bg-red-600 text-white';
    case 'high':
      return 'bg-red-600/80 text-white';
    case 'medium':
      return 'bg-amber-600 text-white';
    case 'low':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};
```

**Visual Indicators:**
- Badge color-coding by risk level
- Emergency warning banners for critical cases
- Hospital/phone icons for urgent situations
- Animated indicators for active chat status

## Safety Guidelines Integration

### Built-in Safety Measures
Frontend displays safety guidelines → Backend prioritizes caution → AI errs on side of safety

**Safety Guidelines Panel:**
```typescript
<Card className="bg-red-900/20 border border-red-600/30">
  <CardContent className="p-3">
    <h5 className="text-red-300 font-medium mb-2 flex items-center">
      <Phone className="h-4 w-4 mr-2" />
      Call 911 Immediately If:
    </h5>
    <ul className="text-gray-300 space-y-1 text-xs">
      <li>• Child is unconscious or unresponsive</li>
      <li>• Difficulty breathing or blue lips</li>
      <li>• Severe dehydration symptoms</li>
      <li>• Seizures lasting >5 minutes</li>
    </ul>
  </CardContent>
</Card>
```

**Emergency Escalation:**
- Immediate 911 recommendations for life-threatening symptoms
- Hospital/urgent care guidance for serious symptoms
- Clear disclaimer about AI limitations
- Emphasis on professional medical consultation

## Session Management

### Chat History Tracking
Session persists across page reloads → History retrieved from database → Conversation continuity maintained

```typescript
const { data: chatHistory } = useQuery({
  queryKey: ['/api/chat-history', sessionId],
  enabled: !!sessionId,
});
```

**History Retrieval:**
- `useQuery` automatically fetches chat history
- `queryKey` includes sessionId for caching
- `enabled: !!sessionId` prevents unnecessary requests
- Backend stores all conversation turns for reference

### Analytics and Monitoring

**Dashboard Statistics:**
- Total triage sessions conducted
- Average AI response time
- Emergency alerts sent
- Parent satisfaction ratings
- Common symptom categories

**Real-time Metrics:**
```typescript
const stats = {
  totalSessions: 1247,
  averageResponseTime: "2.3s", 
  emergencyAlerts: 45,
  satisfactionRate: 94.2
};
```

## Error Handling and Fallbacks

### Graceful Degradation
API failures handled → Fallback messages shown → User guided to seek medical help

```typescript
onError: (error) => {
  setIsTyping(false);
  toast({
    title: "Chat Error",
    description: error.message,
    variant: "destructive",
  });
}
```

**Error Scenarios:**
- OpenAI API timeouts or failures
- Database connection issues
- Network connectivity problems
- Invalid input handling

**Fallback Strategy:**
- Default to higher risk assessment when uncertain
- Provide emergency contact information
- Recommend immediate medical consultation
- Log errors for system monitoring

## Security and Privacy Measures

### HIPAA Compliance Considerations
- No personal health information stored unnecessarily
- Session IDs anonymized
- Audit trails for all medical consultations
- Secure data transmission with HTTPS
- Regular security assessments

### Data Protection
- Conversation encryption in transit
- Limited data retention policies
- User consent for data processing
- Anonymous analytics where possible
- Secure API endpoints with rate limiting

This triage chatbot system prioritizes child safety above all else, providing parents with immediate guidance while ensuring appropriate escalation to medical professionals when needed.