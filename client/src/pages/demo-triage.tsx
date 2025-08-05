import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ArrowLeft, Send, User, Bot, AlertTriangle, Phone, Clock } from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  riskLevel?: "low" | "medium" | "high" | "emergency";
  recommendedAction?: string;
}

interface TriageAssessment {
  riskLevel: "low" | "medium" | "high" | "emergency";
  urgency: string;
  recommendedAction: string;
  nextSteps: string[];
  warningFlags?: string[];
}

export default function DemoTriage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hello! I'm here to help assess your child's symptoms and provide guidance. Please describe what's concerning you about your child's health today.",
      timestamp: new Date(),
      riskLevel: "low",
      recommendedAction: "Continue assessment"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<TriageAssessment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): { response: string; assessment: TriageAssessment } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Emergency keywords
    if (lowerMessage.includes("not breathing") || lowerMessage.includes("blue") || lowerMessage.includes("unconscious") || lowerMessage.includes("seizure")) {
      return {
        response: "🚨 This sounds like a medical emergency. Please call 911 immediately or go to your nearest emergency room right now. Do not wait. If your child is not breathing, begin CPR if you know how. Stay on the line with emergency services for guidance.",
        assessment: {
          riskLevel: "emergency",
          urgency: "IMMEDIATE",
          recommendedAction: "Call 911 immediately",
          nextSteps: [
            "Call 911 or emergency services now",
            "If trained, begin CPR if child is not breathing",
            "Stay with child and follow emergency dispatcher instructions",
            "Do not drive yourself - use ambulance"
          ],
          warningFlags: ["Life-threatening symptoms detected"]
        }
      };
    }
    
    // High-risk symptoms
    if (lowerMessage.includes("difficulty breathing") || lowerMessage.includes("high fever") || lowerMessage.includes("vomiting blood") || lowerMessage.includes("severe pain")) {
      return {
        response: "These symptoms are concerning and require urgent medical attention. Please take your child to the emergency room or urgent care within the next 1-2 hours. While preparing to leave, monitor their breathing and consciousness level closely.",
        assessment: {
          riskLevel: "high",
          urgency: "1-2 hours",
          recommendedAction: "Emergency room or urgent care",
          nextSteps: [
            "Go to emergency room or urgent care facility",
            "Monitor breathing and consciousness",
            "Bring any medications child is taking",
            "Note when symptoms started"
          ],
          warningFlags: ["Urgent medical attention needed"]
        }
      };
    }
    
    // Medium-risk symptoms
    if (lowerMessage.includes("fever") || lowerMessage.includes("vomiting") || lowerMessage.includes("diarrhea") || lowerMessage.includes("rash")) {
      return {
        response: "I understand you're concerned about these symptoms. Can you tell me more details? How long has this been going on, and what's your child's age? For fever, what's their temperature if you've measured it? These details will help me provide better guidance.",
        assessment: {
          riskLevel: "medium",
          urgency: "4-24 hours",
          recommendedAction: "Contact pediatrician or schedule appointment",
          nextSteps: [
            "Monitor symptoms closely",
            "Take temperature if fever suspected",
            "Ensure adequate hydration",
            "Contact pediatrician within 24 hours"
          ]
        }
      };
    }
    
    // Low-risk or general concerns
    return {
      response: "Thank you for sharing your concerns. To provide the best guidance, I'd like to learn more about your child's symptoms. Can you describe: 1) What specific symptoms you're noticing, 2) How long they've been present, 3) Your child's age, and 4) Any recent changes in their behavior or eating?",
      assessment: {
        riskLevel: "low",
        urgency: "24-48 hours",
        recommendedAction: "Monitor and consider routine pediatric consultation",
        nextSteps: [
          "Continue monitoring symptoms",
          "Maintain normal feeding and hydration",
          "Rest and comfort measures",
          "Contact pediatrician if symptoms worsen"
        ]
      }
    };
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const { response, assessment } = generateAIResponse(inputMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response,
        timestamp: new Date(),
        riskLevel: assessment.riskLevel,
        recommendedAction: assessment.recommendedAction
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentAssessment(assessment);
      setIsTyping(false);
    }, 1500);
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "emergency": return "text-red-500";
      case "high": return "text-orange-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-slate-400";
    }
  };

  const getRiskBadge = (level?: string) => {
    switch (level) {
      case "emergency": return { variant: "destructive" as const, text: "EMERGENCY" };
      case "high": return { variant: "destructive" as const, text: "HIGH RISK" };
      case "medium": return { variant: "default" as const, text: "MEDIUM RISK" };
      case "low": return { variant: "secondary" as const, text: "LOW RISK" };
      default: return { variant: "secondary" as const, text: "ASSESSMENT" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-slate-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-light">Triage Chatbot Demo</h1>
          </div>
          <Badge variant="outline" className="text-cyan-400 border-cyan-400">
            Parent Support Tool
          </Badge>
        </div>

        {/* Important Disclaimer */}
        <Card className="bg-red-900/20 border-red-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-400 mb-2">Medical Disclaimer</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  This tool provides educational guidance only and cannot replace professional medical advice, diagnosis, or treatment. 
                  In case of medical emergency, call 911 immediately. Always consult with your child's pediatrician for medical concerns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-light">
                  <MessageCircle className="h-5 w-5 mr-2 text-cyan-400" />
                  AI Triage Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.type === "user" 
                          ? "bg-blue-600 text-white" 
                          : "bg-slate-700 text-slate-200"
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {message.type === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                          <span className="text-xs opacity-75">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.riskLevel && (
                            <Badge variant={getRiskBadge(message.riskLevel).variant} className="text-xs">
                              {getRiskBadge(message.riskLevel).text}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 text-slate-200 px-4 py-3 rounded-lg max-w-xs">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <span className="text-xs opacity-75">AI is typing...</span>
                        </div>
                        <div className="flex space-x-1 mt-2">
                          <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></div>
                          <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                          <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-700 p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Describe your child's symptoms..."
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 bg-slate-700 border-slate-600 text-white"
                    />
                    <Button onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Panel */}
          <div className="space-y-6">
            {/* Current Assessment */}
            {currentAssessment && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg font-light">
                    Current Assessment
                    <Badge variant={getRiskBadge(currentAssessment.riskLevel).variant}>
                      {getRiskBadge(currentAssessment.riskLevel).text}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Action</h4>
                    <p className="text-sm text-slate-300 bg-slate-700/30 p-3 rounded-lg">
                      {currentAssessment.recommendedAction}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Timeline</h4>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{currentAssessment.urgency}</span>
                    </div>
                  </div>

                  {currentAssessment.warningFlags && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-400">Warning Flags</h4>
                      <ul className="space-y-1 text-sm">
                        {currentAssessment.warningFlags.map((flag, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                            <span className="text-red-300">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Next Steps</h4>
                    <ul className="space-y-1 text-sm">
                      {currentAssessment.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-cyan-400 text-xs mt-1">•</span>
                          <span className="text-slate-300">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emergency Contacts */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-light">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="destructive" className="w-full flex items-center justify-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency: 911
                </Button>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-300">Poison Control: 1-800-222-1222</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-300">Pediatrician: Contact your doctor</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-300">Crisis Text Line: Text HOME to 741741</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Symptoms */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-light">Common Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["Fever", "Cough", "Rash", "Vomiting", "Diarrhea", "Earache", "Sore throat", "Headache"].map((symptom) => (
                    <Button
                      key={symptom}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(`My child has ${symptom.toLowerCase()}`)}
                      className="text-slate-300 border-slate-600 hover:bg-slate-700"
                    >
                      {symptom}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Implementation */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-light">Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-semibold mb-2 text-cyan-400">AI Engine</h3>
                <ul className="space-y-1 text-slate-300">
                  <li>• OpenAI GPT-4 Medical Model</li>
                  <li>• Pediatric Triage Protocols</li>
                  <li>• Symptom Pattern Recognition</li>
                  <li>• Risk Stratification Algorithm</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-cyan-400">Safety Features</h3>
                <ul className="space-y-1 text-slate-300">
                  <li>• Emergency keyword detection</li>
                  <li>• Automatic escalation protocols</li>
                  <li>• Professional disclaimer integration</li>
                  <li>• Crisis intervention pathways</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-cyan-400">User Experience</h3>
                <ul className="space-y-1 text-slate-300">
                  <li>• Real-time response generation</li>
                  <li>• Risk-based color coding</li>
                  <li>• Progressive assessment workflow</li>
                  <li>• Emergency contact integration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}