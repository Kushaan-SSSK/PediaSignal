import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ComplianceFooter from "@/components/ComplianceFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  FileImage, 
  Shield, 
  MessageCircle, 
  TrendingUp, 
  Users,
  Activity,
  Brain,
  Stethoscope,
  FileText,
  Play,
  Upload,
  Send,
  Monitor,
  Target,
  ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import SimulationInterface from "@/components/SimulationInterface";
import XrayUploader from "@/components/XrayUploader";
import ChatInterface from "@/components/ChatInterface";

// Mock user data - in a real app this would come from authentication
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
  profileImage: undefined
};

interface ModuleSectionProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  component: React.ReactNode;
  stats?: string;
}

function ModuleSection({ title, subtitle, description, icon: Icon, features, component, stats }: ModuleSectionProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <section className="py-16 border-b border-slate-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-800/50 rounded-xl flex items-center justify-center">
              <Icon className="h-8 w-8 text-slate-300" />
            </div>
          </div>
          <h2 className="professional-heading text-3xl md:text-4xl font-extralight mb-4 text-white">
            {title}
          </h2>
          <p className="professional-text text-lg text-slate-300 mb-2 font-light">
            {subtitle}
          </p>
          <p className="professional-text text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
            {description}
          </p>
          {stats && (
            <div className="mt-6">
              <Badge className="bg-slate-800/50 text-slate-300 border-slate-600 px-4 py-2 text-sm font-light">
                {stats}
              </Badge>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full" />
                  <span className="professional-text text-slate-200 font-light">{feature}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interactive Component */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/30">
            <div className="flex items-center justify-between">
              <h3 className="professional-heading text-xl font-light text-white">
                Interactive Training Module
              </h3>
              <Button 
                onClick={() => setIsActive(!isActive)}
                variant="outline"
                className="professional-text font-light"
              >
                {isActive ? "Close" : "Launch"} Module
              </Button>
            </div>
          </div>
          <div className="p-6">
            {isActive ? component : (
              <div className="text-center py-16">
                <Icon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="professional-text text-slate-400 font-light">
                  Click "Launch Module" to begin interactive training
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/overview'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const analyticsData = (analytics as any) || {
    totalSimulations: 247,
    totalXrayAnalyses: 89,
    totalMisinfoReports: 156,
    totalTriageConversations: 423
  };

  const modules = [
    {
      title: "Emergency Simulation Training",
      subtitle: "AI-Powered Pediatric Case Scenarios",
      description: "Practice critical decision-making with realistic pediatric emergency scenarios. Our AI generates dynamic cases that adapt to your responses, providing immediate feedback and clinical explanations.",
      icon: Heart,
      features: [
        "Dynamic case generation with AI adaptation",
        "Real-time vital sign monitoring",
        "Intervention tracking and outcome analysis"
      ],
      component: <SimulationInterface simulation={{
        caseType: "demo",
        stage: 1,
        vitals: { heartRate: 120, temperature: 98.6, respRate: 20 },
        status: "active",
        interventions: [],
        aiExplanations: []
      }} userId={1} />,
      stats: `${analyticsData.totalSimulations} simulations completed`
    },
    {
      title: "X-ray Abuse Detection",
      subtitle: "AI-Assisted Radiological Analysis",
      description: "Upload pediatric X-rays for automated abuse pattern detection. Our trained models identify suspicious fracture patterns and provide confidence scores to assist in clinical decision-making.",
      icon: FileImage,
      features: [
        "Automated fracture pattern recognition",
        "Confidence scoring and risk assessment",
        "Historical analysis and documentation"
      ],
      component: <XrayUploader userId={1} />,
      stats: `${analyticsData.totalXrayAnalyses} analyses performed`
    },
    {
      title: "Misinformation Monitor",
      subtitle: "Chrome Extension for Pediatric Content Detection",
      description: "Our Chrome extension automatically detects pediatric health content on web pages and analyzes it for misinformation. Only activates when pediatric-related content is found, providing targeted protection.",
      icon: Shield,
      features: [
        "Pediatric content detection only",
        "Browser extension integration",
        "Real-time risk assessment"
      ],
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h4 className="professional-heading text-lg font-light text-white mb-3">
              Chrome Extension Required
            </h4>
            <p className="professional-text text-slate-300 font-light mb-6 leading-relaxed">
              The Misinformation Monitor operates as a Chrome extension that automatically detects 
              pediatric-related content on web pages and analyzes it for potential misinformation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="professional-text text-slate-300 font-light">High Risk Reports</span>
                  <Badge className="bg-red-900/30 text-red-300 border-red-600/30 font-light">
                    {Math.floor(analyticsData.totalMisinfoReports * 0.23)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="professional-text text-slate-300 font-light">Extension Installs</span>
                  <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                    1,247
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6">
            <h5 className="professional-heading text-sm font-light text-white mb-3">
              How It Works
            </h5>
            <div className="space-y-2 professional-text text-sm text-slate-300 font-light">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                <span>Automatically scans web pages for pediatric health content</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                <span>Only activates when pediatric-related keywords are detected</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                <span>Analyzes content for potential misinformation patterns</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                <span>Provides risk warnings for dangerous health claims</span>
              </div>
            </div>
          </div>
        </div>
      ),
      stats: `${analyticsData.totalMisinfoReports} reports analyzed`
    },
    {
      title: "Parent Triage Chatbot",
      subtitle: "24/7 Pediatric Health Assistance",
      description: "Provide parents with immediate guidance for pediatric health concerns. Our AI chatbot offers triage assistance, symptom assessment, and emergency escalation protocols.",
      icon: MessageCircle,
      features: [
        "24/7 symptom assessment",
        "Emergency escalation protocols",
        "Multi-language support"
      ],
      component: <ChatInterface sessionId="demo-session" />,
      stats: `${analyticsData.totalTriageConversations} conversations handled`
    }
  ];

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="professional-heading text-5xl md:text-6xl font-extralight mb-6 text-white">
            PediaSignal <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">AI</span>
          </h1>
          <p className="professional-text text-xl text-slate-300 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
            Advanced AI-powered platform for pediatric medical training, abuse detection, misinformation monitoring, and parent triage assistance.
          </p>
          
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <div className="professional-text text-2xl font-light text-white mb-1">
                  {analyticsData.totalSimulations}
                </div>
                <div className="professional-text text-sm text-slate-400 font-light">
                  Training Simulations
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6 text-center">
                <FileImage className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <div className="professional-text text-2xl font-light text-white mb-1">
                  {analyticsData.totalXrayAnalyses}
                </div>
                <div className="professional-text text-sm text-slate-400 font-light">
                  X-ray Analyses
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <div className="professional-text text-2xl font-light text-white mb-1">
                  {analyticsData.totalMisinfoReports}
                </div>
                <div className="professional-text text-sm text-slate-400 font-light">
                  Misinformation Reports
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <div className="professional-text text-2xl font-light text-white mb-1">
                  {analyticsData.totalTriageConversations}
                </div>
                <div className="professional-text text-sm text-slate-400 font-light">
                  Triage Conversations
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Module Sections */}
      {modules.map((module, index) => (
        <ModuleSection key={index} {...module} />
      ))}

      <ComplianceFooter />
    </div>
  );
}