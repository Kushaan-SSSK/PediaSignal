import { useQuery } from "@tanstack/react-query";
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
  FileText
} from "lucide-react";
import Header from "@/components/Header";

// Mock user data - in a real app this would come from authentication
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
  profileImage: undefined
};

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  stats: string;
  buttonText: string;
  buttonAction: () => void;
  color: string;
}

function ModuleCard({ title, description, icon: Icon, stats, buttonText, buttonAction, color }: ModuleCardProps) {
  return (
    <Card className="medical-card card-hover">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400">Interactive training scenarios</p>
          </div>
        </div>
        <p className="text-gray-300 mb-6">
          {description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{stats}</span>
          <Button 
            onClick={buttonAction}
            className={`${color.replace('/20', '').replace('bg-', 'bg-')} hover:${color.replace('/20', '').replace('bg-', 'bg-')}/80`}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/overview'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const analyticsData = (analytics as any) || {
    totalSimulations: 0,
    totalXrayAnalyses: 0,
    misinformationDetected: 0,
    chatConversations: 0,
    activeUsers: 0
  };

  const modules = [
    {
      title: "Emergency Simulator",
      description: "Practice critical pediatric emergency cases with real-time vital monitoring and AI-powered clinical feedback.",
      icon: Stethoscope,
      stats: "12 Active Cases",
      buttonText: "Launch Simulator",
      buttonAction: () => window.location.href = "/simulator",
      color: "bg-red-600/20 text-red-400"
    },
    {
      title: "X-ray Analysis", 
      description: "Upload pediatric X-rays for automated analysis and potential abuse pattern detection with detailed reporting.",
      icon: FileImage,
      stats: "96.8% Accuracy",
      buttonText: "Analyze Image",
      buttonAction: () => window.location.href = "/xray-analysis",
      color: "bg-blue-600/20 text-blue-400"
    },
    {
      title: "Misinfo Monitor",
      description: "Real-time monitoring of pediatric health misinformation across global platforms with risk assessment.",
      icon: Shield,
      stats: "247 Sources Monitored",
      buttonText: "View Dashboard",
      buttonAction: () => window.location.href = "/misinformation-monitor",
      color: "bg-amber-600/20 text-amber-400"
    },
    {
      title: "Triage Assistant",
      description: "AI-powered chatbot providing parents with symptom-based medical guidance and emergency care recommendations.",
      icon: MessageCircle,
      stats: "24/7 Available",
      buttonText: "Open Chat",
      buttonAction: () => window.location.href = "/triage-chatbot",
      color: "bg-green-600/20 text-green-400"
    },
    {
      title: "Analytics Hub",
      description: "Comprehensive analytics on training progress, case outcomes, and system-wide performance metrics.",
      icon: TrendingUp,
      stats: "Real-time Data",
      buttonText: "View Reports",
      buttonAction: () => console.log("Navigate to analytics"),
      color: "bg-purple-600/20 text-purple-400"
    },
    {
      title: "User Management",
      description: "Manage user roles, permissions, and access levels across medical students, pediatricians, and administrators.",
      icon: Users,
      stats: "3 Role Types",
      buttonText: "Manage Users",
      buttonAction: () => console.log("Navigate to user management"),
      color: "bg-indigo-600/20 text-indigo-400"
    }
  ];

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            The Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Pediatric Medicine
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Advanced AI-powered tools for pediatric emergency training, diagnosis assistance, and global health monitoring. 
            Empowering medical professionals with cutting-edge technology.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 glow-effect"
              onClick={() => window.location.href = "/simulator"}
            >
              <Activity className="w-5 h-5 mr-2" />
              Start Simulation
            </Button>
            <Button 
              variant="secondary"
              className="bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 px-8 py-3"
              onClick={() => console.log("Navigate to analytics")}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              View Analytics
            </Button>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{analyticsData.totalSimulations}</div>
              <div className="text-xs text-gray-400">Simulations Run</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{analyticsData.totalXrayAnalyses}</div>
              <div className="text-xs text-gray-400">X-rays Analyzed</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{analyticsData.misinformationDetected}</div>
              <div className="text-xs text-gray-400">Misinfo Detected</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{analyticsData.chatConversations}</div>
              <div className="text-xs text-gray-400">Chat Sessions</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{analyticsData.activeUsers}</div>
              <div className="text-xs text-gray-400">Active Users</div>
            </CardContent>
          </Card>
        </section>

        {/* Module Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <ModuleCard key={index} {...module} />
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="font-medium text-white">PediaSignal AI</span>
              <span className="text-gray-500">© 2024</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
