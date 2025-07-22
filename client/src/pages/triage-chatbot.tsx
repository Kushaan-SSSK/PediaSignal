import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Clock, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";

// Mock user
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
};

export default function TriageChatbot() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const { data: chatHistory } = useQuery({
    queryKey: ['/api/chat-history', sessionId],
    enabled: !!sessionId,
  });

  // Mock statistics - in real app this would come from analytics API
  const stats = {
    totalSessions: 1247,
    averageResponseTime: "2.3s",
    emergencyAlerts: 45,
    satisfactionRate: 94.2
  };

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Parent Triage Assistant</h1>
          <p className="text-gray-300">AI-powered symptom assessment and emergency guidance for parents</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="medical-card p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="h-8 w-8 text-blue-400" />
              <Badge className="bg-blue-600/20 text-blue-400">Active</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.totalSessions}</div>
            <div className="text-sm text-gray-400">Total Sessions</div>
            <div className="text-xs text-green-400 mt-1">+12% this week</div>
          </Card>

          <Card className="medical-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-green-400" />
              <Badge className="bg-green-600/20 text-green-400">Real-time</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.averageResponseTime}</div>
            <div className="text-sm text-gray-400">Avg Response Time</div>
            <div className="text-xs text-green-400 mt-1">-0.3s improvement</div>
          </Card>

          <Card className="medical-card p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-red-400" />
              <Badge className="bg-red-600/20 text-red-400">Critical</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.emergencyAlerts}</div>
            <div className="text-sm text-gray-400">Emergency Alerts</div>
            <div className="text-xs text-red-400 mt-1">Sent this month</div>
          </Card>

          <Card className="medical-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-purple-400" />
              <Badge className="bg-purple-600/20 text-purple-400">High</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.satisfactionRate}%</div>
            <div className="text-sm text-gray-400">Satisfaction Rate</div>
            <div className="text-xs text-green-400 mt-1">+2.1% vs last month</div>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <ChatInterface sessionId={sessionId} />

        {/* Additional Information */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Recent Emergency Alerts */}
          <Card className="medical-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Emergency Alerts</h3>
            <div className="space-y-3">
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-red-300 font-medium text-sm">High Fever Emergency</span>
                  <span className="text-xs text-red-400">2 hours ago</span>
                </div>
                <p className="text-gray-300 text-xs">3-year-old with 104°F fever and lethargy - emergency care recommended</p>
              </div>
              
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-red-300 font-medium text-sm">Breathing Difficulty</span>
                  <span className="text-xs text-red-400">5 hours ago</span>
                </div>
                <p className="text-gray-300 text-xs">18-month-old with severe respiratory distress - 911 recommended</p>
              </div>
              
              <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-amber-300 font-medium text-sm">Dehydration Alert</span>
                  <span className="text-xs text-amber-400">8 hours ago</span>
                </div>
                <p className="text-gray-300 text-xs">2-year-old with persistent vomiting - urgent care needed</p>
              </div>
            </div>
          </Card>

          {/* Common Queries */}
          <Card className="medical-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Common Parent Queries</h3>
            <div className="space-y-3">
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-sm font-medium">Fever Management</span>
                  <Badge className="bg-blue-600/20 text-blue-400 text-xs">342 queries</Badge>
                </div>
                <p className="text-gray-400 text-xs">Temperature concerns and when to seek care</p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-sm font-medium">Respiratory Symptoms</span>
                  <Badge className="bg-green-600/20 text-green-400 text-xs">198 queries</Badge>
                </div>
                <p className="text-gray-400 text-xs">Cough, congestion, and breathing issues</p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-sm font-medium">Digestive Issues</span>
                  <Badge className="bg-amber-600/20 text-amber-400 text-xs">156 queries</Badge>
                </div>
                <p className="text-gray-400 text-xs">Vomiting, diarrhea, and stomach problems</p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-sm font-medium">Rash & Skin</span>
                  <Badge className="bg-purple-600/20 text-purple-400 text-xs">124 queries</Badge>
                </div>
                <p className="text-gray-400 text-xs">Skin conditions and allergic reactions</p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-sm font-medium">Injury Assessment</span>
                  <Badge className="bg-red-600/20 text-red-400 text-xs">89 queries</Badge>
                </div>
                <p className="text-gray-400 text-xs">Falls, cuts, and minor trauma evaluation</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
