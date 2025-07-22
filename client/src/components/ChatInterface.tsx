import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, AlertTriangle, Phone, Hospital } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  riskLevel?: string;
  emergencyWarning?: boolean;
}

interface ChatInterfaceProps {
  sessionId: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="medical-card p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">Parent Triage Assistant</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">Online</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/50 border-gray-700 h-96 mb-4 overflow-hidden">
            <CardContent className="p-4 h-full">
              <div className="h-full overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="mx-auto h-12 w-12 mb-4" />
                    <p>Hi! I'm here to help with your child's health concerns.</p>
                    <p className="text-sm mt-2">Describe your child's symptoms to get started.</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'items-start space-x-3'}`}>
                    {message.type === 'bot' && (
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-lg ${message.type === 'user' ? 'max-w-xs' : ''}`}>
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-800 text-white border border-gray-700'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        
                        {message.emergencyWarning && (
                          <div className="mt-3 p-2 bg-red-900/50 border border-red-600/50 rounded">
                            <div className="flex items-center text-red-300 text-xs font-medium">
                              <Hospital className="h-3 w-3 mr-1" />
                              EMERGENCY CARE RECOMMENDED - Do not delay seeking medical attention
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.riskLevel && (
                            <Badge className={`text-xs ${getRiskColor(message.riskLevel)}`}>
                              {message.riskLevel.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your child's symptoms..."
              disabled={chatMutation.isPending}
              className="flex-1 bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={chatMutation.isPending || !inputMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Safety Guidelines */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-white">Safety Guidelines</h4>
          <div className="space-y-4 text-sm">
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
                  <li>• Seizures lasting &gt;5 minutes</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-900/20 border border-amber-600/30">
              <CardContent className="p-3">
                <h5 className="text-amber-300 font-medium mb-2 flex items-center">
                  <Hospital className="h-4 w-4 mr-2" />
                  Seek Emergency Care For:
                </h5>
                <ul className="text-gray-300 space-y-1 text-xs">
                  <li>• High fever (&gt;102°F) with lethargy</li>
                  <li>• Persistent vomiting</li>
                  <li>• Signs of severe pain</li>
                  <li>• Unusual rash or skin changes</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-900/20 border border-blue-600/30">
              <CardContent className="p-3">
                <h5 className="text-blue-300 font-medium mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Remember:
                </h5>
                <p className="text-gray-300 text-xs">
                  This AI assistant provides guidance only. Always consult healthcare professionals for medical decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Card>
  );
}
