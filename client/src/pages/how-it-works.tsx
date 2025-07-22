import Header from "@/components/Header";
import ComplianceFooter from "@/components/ComplianceFooter";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain,
  Database,
  Shield,
  Cpu,
  Network,
  Monitor,
  CheckCircle,
  ArrowRight,
  Users,
  FileImage,
  MessageCircle,
  Heart
} from "lucide-react";

// Mock user data - in a real app this would come from authentication
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
  profileImage: undefined
};

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
}

function ProcessStep({ number, title, description, icon: Icon, details }: StepProps) {
  return (
    <Card className="bg-slate-800/30 border-slate-700/50 h-full">
      <CardContent className="p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mr-4">
            <Icon className="h-6 w-6 text-slate-300" />
          </div>
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
            <span className="professional-text text-sm font-light text-white">{number}</span>
          </div>
        </div>
        <h3 className="professional-heading text-xl font-light text-white mb-4">
          {title}
        </h3>
        <p className="professional-text text-slate-300 mb-6 font-light leading-relaxed">
          {description}
        </p>
        <div className="space-y-3">
          {details.map((detail, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
              <span className="professional-text text-sm text-slate-300 font-light">{detail}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HowItWorks() {
  const simulationProcess = [
    {
      number: "1",
      title: "Case Generation",
      description: "AI algorithms create dynamic pediatric emergency scenarios based on real clinical data and evidence-based medicine.",
      icon: Brain,
      details: [
        "Machine learning models trained on pediatric emergency cases",
        "Real-time adaptation based on user responses",
        "Evidence-based clinical protocols integration"
      ]
    },
    {
      number: "2", 
      title: "Interactive Training",
      description: "Healthcare professionals interact with simulated patients, making decisions that affect case outcomes.",
      icon: Users,
      details: [
        "Real-time vital sign monitoring",
        "Dynamic case progression based on interventions",
        "Immediate feedback on clinical decisions"
      ]
    },
    {
      number: "3",
      title: "Performance Analysis",
      description: "Advanced analytics track decision-making patterns and provide personalized improvement recommendations.",
      icon: Monitor,
      details: [
        "Comprehensive performance metrics",
        "Learning outcome assessment",
        "Personalized training recommendations"
      ]
    }
  ];

  const xrayProcess = [
    {
      number: "1",
      title: "Image Processing",
      description: "Advanced computer vision algorithms analyze uploaded X-ray images for potential abuse indicators.",
      icon: FileImage,
      details: [
        "High-resolution image analysis",
        "Fracture pattern recognition",
        "Automated image preprocessing"
      ]
    },
    {
      number: "2",
      title: "Pattern Detection",
      description: "Trained models identify suspicious fracture patterns and injury distributions characteristic of abuse.",
      icon: Cpu,
      details: [
        "Deep learning models trained on clinical datasets",
        "Multi-pattern recognition algorithms",
        "Confidence scoring for each detection"
      ]
    },
    {
      number: "3",
      title: "Clinical Support",
      description: "Results are presented with confidence scores and recommendations to support clinical decision-making.",
      icon: CheckCircle,
      details: [
        "Risk assessment scoring",
        "Clinical interpretation guidance",
        "Documentation support for reports"
      ]
    }
  ];

  const misinfoProcess = [
    {
      number: "1",
      title: "Content Monitoring",
      description: "Automated systems continuously scan digital platforms for pediatric health-related content.",
      icon: Network,
      details: [
        "Multi-platform content aggregation",
        "Real-time monitoring capabilities",
        "Automated content classification"
      ]
    },
    {
      number: "2",
      title: "AI Analysis",
      description: "Natural language processing models classify content for medical accuracy and potential harm.",
      icon: Brain,
      details: [
        "Medical fact verification algorithms",
        "Harm assessment scoring",
        "Source credibility evaluation"
      ]
    },
    {
      number: "3",
      title: "Risk Assessment",
      description: "Content is categorized by risk level with detailed analysis for public health authorities.",
      icon: Shield,
      details: [
        "Risk categorization system",
        "Impact assessment metrics",
        "Reporting and alert systems"
      ]
    }
  ];

  const triageProcess = [
    {
      number: "1",
      title: "Symptom Assessment",
      description: "Parents describe their child's symptoms through an intuitive conversational interface.",
      icon: MessageCircle,
      details: [
        "Natural language understanding",
        "Structured symptom collection",
        "Multi-language support"
      ]
    },
    {
      number: "2",
      title: "AI Evaluation", 
      description: "Advanced algorithms assess symptom severity and determine appropriate care recommendations.",
      icon: Brain,
      details: [
        "Clinical decision support algorithms",
        "Severity assessment protocols",
        "Emergency detection systems"
      ]
    },
    {
      number: "3",
      title: "Care Guidance",
      description: "System provides appropriate care recommendations and escalation to emergency services when needed.",
      icon: Heart,
      details: [
        "Personalized care recommendations",
        "Emergency service integration",
        "Follow-up guidance protocols"
      ]
    }
  ];

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="professional-heading text-4xl md:text-5xl font-extralight mb-6 text-white">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">It Works</span>
          </h1>
          <p className="professional-text text-xl text-slate-300 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
            PediaSignal AI combines advanced machine learning, clinical expertise, and evidence-based medicine 
            to deliver comprehensive pediatric healthcare solutions.
          </p>
        </div>

        {/* Core Technology Overview */}
        <section className="mb-20">
          <h2 className="professional-heading text-3xl font-light text-white mb-12 text-center">
            Core Technology Stack
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-slate-300 mx-auto mb-6" />
                <h3 className="professional-heading text-xl font-light text-white mb-4">
                  Artificial Intelligence
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed">
                  Advanced machine learning models trained on clinical datasets for accurate 
                  medical analysis and decision support.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Database className="h-12 w-12 text-slate-300 mx-auto mb-6" />
                <h3 className="professional-heading text-xl font-light text-white mb-4">
                  Clinical Data
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed">
                  Evidence-based medical protocols and clinical guidelines integrated 
                  into all system recommendations and analyses.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-slate-300 mx-auto mb-6" />
                <h3 className="professional-heading text-xl font-light text-white mb-4">
                  Security Framework
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed">
                  Enterprise-grade security with HIPAA compliance protocols 
                  protecting sensitive medical information.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Emergency Simulation Training */}
        <section className="mb-20">
          <h2 className="professional-heading text-3xl font-light text-white mb-4 text-center">
            Emergency Simulation Training
          </h2>
          <p className="professional-text text-slate-400 text-center mb-12 max-w-3xl mx-auto font-light">
            AI-powered pediatric emergency scenarios that adapt in real-time to provide comprehensive training experiences.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {simulationProcess.map((step, index) => (
              <ProcessStep key={index} {...step} />
            ))}
          </div>
        </section>

        {/* X-ray Analysis */}
        <section className="mb-20">
          <h2 className="professional-heading text-3xl font-light text-white mb-4 text-center">
            X-ray Abuse Detection
          </h2>
          <p className="professional-text text-slate-400 text-center mb-12 max-w-3xl mx-auto font-light">
            Computer vision technology analyzes radiological images to identify potential indicators of child abuse.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {xrayProcess.map((step, index) => (
              <ProcessStep key={index} {...step} />
            ))}
          </div>
        </section>

        {/* Misinformation Monitoring */}
        <section className="mb-20">
          <h2 className="professional-heading text-3xl font-light text-white mb-4 text-center">
            Misinformation Monitor
          </h2>
          <p className="professional-text text-slate-400 text-center mb-12 max-w-3xl mx-auto font-light">
            Real-time monitoring and classification of pediatric health misinformation across digital platforms.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {misinfoProcess.map((step, index) => (
              <ProcessStep key={index} {...step} />
            ))}
          </div>
        </section>

        {/* Triage Chatbot */}
        <section className="mb-20">
          <h2 className="professional-heading text-3xl font-light text-white mb-4 text-center">
            Parent Triage Chatbot
          </h2>
          <p className="professional-text text-slate-400 text-center mb-12 max-w-3xl mx-auto font-light">
            24/7 AI-powered triage assistance providing parents with immediate guidance for pediatric health concerns.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {triageProcess.map((step, index) => (
              <ProcessStep key={index} {...step} />
            ))}
          </div>
        </section>

        {/* Integration Section */}
        <section>
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <h2 className="professional-heading text-3xl font-light text-white mb-6">
                Seamless Integration
              </h2>
              <p className="professional-text text-slate-300 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
                All modules work together to provide a comprehensive pediatric healthcare platform, 
                sharing insights and maintaining consistent clinical standards across all features.
              </p>
              <div className="flex justify-center items-center space-x-8">
                <div className="flex items-center space-x-4">
                  <Heart className="h-6 w-6 text-slate-400" />
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <FileImage className="h-6 w-6 text-slate-400" />
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <Shield className="h-6 w-6 text-slate-400" />
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <MessageCircle className="h-6 w-6 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <ComplianceFooter />
    </div>
  );
}