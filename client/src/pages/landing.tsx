import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Heart, 
  FileImage, 
  Shield, 
  MessageCircle, 
  Brain,
  Database,
  Cpu,
  Network,
  Monitor,
  CheckCircle,
  ArrowRight,
  Users,
  Clock,
  MapPin,
  ShieldX,
  Target,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  MapIcon,
  ChevronDown,
  Plus,
  Minus
} from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardContent className="p-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-800/20 transition-colors"
        >
          <h3 className="professional-text font-light text-white">{question}</h3>
          {isOpen ? (
            <Minus className="h-5 w-5 text-slate-400 flex-shrink-0" />
          ) : (
            <Plus className="h-5 w-5 text-slate-400 flex-shrink-0" />
          )}
        </button>
        {isOpen && (
          <div className="px-6 pb-6">
            <p className="professional-text text-slate-300 font-light leading-relaxed">
              {answer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Landing() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const { toast } = useToast();

  const waitlistMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string }) => {
      return apiRequest("/api/waitlist", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "You've been added to our waitlist. We'll contact you when access is available."
      });
      setName("");
      setEmail("");
      setRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Application failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    waitlistMutation.mutate({ name, email, role });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqData = [
    {
      question: "How does the AI medical simulation work?",
      answer: "Our AI generates realistic pediatric emergency scenarios with dynamic vital signs and patient responses. Each decision you make affects the case progression, providing immediate feedback and clinical explanations powered by GPT-4."
    },
    {
      question: "What makes the X-ray abuse detection unique?",
      answer: "We use specialized deep learning models trained specifically on pediatric fracture patterns. Our system can identify suspicious injury patterns with high accuracy while providing forensic-quality documentation for legal proceedings."
    },
    {
      question: "Is the misinformation monitor always active?",
      answer: "No, our Chrome extension only activates when it detects pediatric health-related content on webpages. It runs privacy-focused analysis and provides real-time warnings about potentially dangerous medical misinformation."
    },
    {
      question: "How secure is patient data?",
      answer: "We maintain enterprise-grade security with end-to-end encryption, HIPAA compliance, and SOC 2 certification. All data is stored securely and never shared without explicit consent."
    },
    {
      question: "When will the platform be available?",
      answer: "We're currently in private beta. Healthcare professionals on our waitlist will receive priority access as we gradually expand capacity while maintaining quality and security standards."
    }
  ];

  return (
    <div className="min-h-screen medical-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-slate-300" />
              <h1 className="professional-heading text-xl font-light text-white">PediaSignal AI</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">How it works</button>
              <button onClick={() => scrollToSection('ai-tools')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">AI Tools</button>
              <button onClick={() => scrollToSection('why')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">Why</button>
              <button onClick={() => scrollToSection('faq')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">FAQ</button>
              <button onClick={() => scrollToSection('contact')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">Contact</button>
              <Button 
                onClick={() => window.location.href = '/admin/login'}
                variant="outline" 
                className="professional-text font-light"
              >
                Admin
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <Heart className="h-12 w-12 text-slate-300" />
            <h1 className="professional-heading text-5xl font-light text-white">
              PediaSignal AI
            </h1>
          </div>
          <p className="professional-text text-xl text-slate-300 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
            Advanced AI platform for pediatric emergency training, abuse detection, 
            and clinical decision support. Empowering healthcare professionals with 
            cutting-edge medical intelligence.
          </p>
          <div className="flex items-center justify-center space-x-2 mb-12">
            <Shield className="h-5 w-5 text-slate-400" />
            <span className="professional-text text-slate-400 font-light">
              HIPAA Compliant • SOC 2 Certified • Enterprise Security
            </span>
          </div>
          <Button 
            onClick={() => scrollToSection('waitlist-form')}
            className="professional-text font-light px-8 py-4 text-lg"
          >
            Request Early Access
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              AI-Powered Medical Solutions
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto">
              Comprehensive tools designed specifically for pediatric healthcare professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <Brain className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  Emergency Simulation
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm">
                  Interactive pediatric emergency scenarios with AI-driven patient responses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <FileImage className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  X-ray Analysis
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm">
                  AI-powered detection of suspicious injury patterns and abuse indicators
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  Misinformation Monitor
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm">
                  Chrome extension that detects and warns about pediatric health misinformation
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <MessageCircle className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  Triage Chatbot
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm">
                  Parent-facing AI assistant for symptom assessment and emergency guidance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              How It Works
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto">
              Enterprise-grade AI infrastructure designed for medical professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-slate-800/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Database className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="professional-text text-lg font-light text-white mb-3">
                Secure Data Processing
              </h3>
              <p className="professional-text text-slate-300 font-light">
                All medical data is processed through encrypted, HIPAA-compliant infrastructure 
                with enterprise-grade security protocols.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-slate-800/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Cpu className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="professional-text text-lg font-light text-white mb-3">
                AI Model Integration
              </h3>
              <p className="professional-text text-slate-300 font-light">
                Advanced machine learning models trained specifically on pediatric datasets 
                provide accurate, clinically relevant insights.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-slate-800/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Monitor className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="professional-text text-lg font-light text-white mb-3">
                Real-time Analysis
              </h3>
              <p className="professional-text text-slate-300 font-light">
                Instant processing and feedback enable immediate clinical decision support 
                during critical patient care moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="ai-tools" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              AI Tools
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto">
              Specialized artificial intelligence for pediatric healthcare challenges
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Target className="h-6 w-6 text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="professional-text text-lg font-light text-white mb-2">
                    Predictive Clinical Outcomes
                  </h3>
                  <p className="professional-text text-slate-300 font-light">
                    AI models predict patient responses to interventions in emergency scenarios, 
                    helping healthcare professionals make informed decisions quickly.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <ShieldX className="h-6 w-6 text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="professional-text text-lg font-light text-white mb-2">
                    Abuse Pattern Recognition
                  </h3>
                  <p className="professional-text text-slate-300 font-light">
                    Advanced computer vision algorithms identify suspicious fracture patterns 
                    and injury combinations that may indicate child abuse.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <AlertTriangle className="h-6 w-6 text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="professional-text text-lg font-light text-white mb-2">
                    Risk Assessment
                  </h3>
                  <p className="professional-text text-slate-300 font-light">
                    Real-time analysis of symptoms and context provides automated risk scoring 
                    for emergency triage and parent guidance.
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Network className="h-8 w-8 text-slate-400" />
                  <h3 className="professional-text text-xl font-light text-white">
                    Technical Specifications
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="professional-text text-slate-300 font-light">Model Architecture</span>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                      GPT-4 + Custom CNNs
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="professional-text text-slate-300 font-light">Processing Time</span>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                      {"< 500ms"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="professional-text text-slate-300 font-light">Accuracy Rate</span>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                      97.3%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="professional-text text-slate-300 font-light">Security Standard</span>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                      HIPAA + SOC 2
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="why" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              Why PediaSignal AI
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto">
              Purpose-built for the unique challenges of pediatric healthcare
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8">
                <Users className="h-12 w-12 text-slate-400 mb-6" />
                <h3 className="professional-text text-xl font-light text-white mb-4">
                  Specialized Training
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed">
                  Pediatric emergencies require specialized knowledge and quick decision-making. 
                  Our AI provides realistic training scenarios that prepare healthcare professionals 
                  for critical moments when every second counts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8">
                <Clock className="h-12 w-12 text-slate-400 mb-6" />
                <h3 className="professional-text text-xl font-light text-white mb-4">
                  Early Detection
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed">
                  Child abuse often goes undetected in emergency settings. Our X-ray analysis 
                  tool helps identify suspicious patterns that might be missed, potentially 
                  saving lives and preventing further harm.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8">
                <Globe className="h-12 w-12 text-slate-400 mb-6" />
                <h3 className="professional-text text-xl font-light text-white mb-4">
                  Information Quality
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed">
                  Parents often encounter dangerous misinformation about pediatric health online. 
                  Our monitoring system helps identify and warn against potentially harmful 
                  medical advice found on social media and websites.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto">
              Common questions about our AI-powered pediatric healthcare platform
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section id="waitlist-form" className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="professional-heading text-2xl font-light text-white mb-4">
                  Request Early Access
                </h2>
                <p className="professional-text text-slate-300 font-light">
                  Join our waitlist to be among the first healthcare professionals 
                  to access PediaSignal AI when we launch.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="professional-text text-sm font-light text-slate-300 block mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="professional-text font-light"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="professional-text text-sm font-light text-slate-300 block mb-2">
                    Professional Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="professional-text font-light"
                    placeholder="Enter your work email"
                    required
                  />
                </div>

                <div>
                  <label className="professional-text text-sm font-light text-slate-300 block mb-2">
                    Professional Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 professional-text font-light"
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="pediatrician">Pediatrician</option>
                    <option value="medical_student">Medical Student</option>
                    <option value="radiologist">Radiologist</option>
                    <option value="hospital_admin">Hospital Administrator</option>
                    <option value="nurse">Pediatric Nurse</option>
                    <option value="researcher">Medical Researcher</option>
                    <option value="other">Other Healthcare Professional</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={waitlistMutation.isPending}
                  className="w-full professional-text font-light py-3"
                >
                  {waitlistMutation.isPending ? "Submitting..." : "Join Waitlist"}
                </Button>

                <div className="text-center pt-4">
                  <p className="professional-text text-xs text-slate-400 font-light">
                    By submitting this form, you agree to receive updates about PediaSignal AI. 
                    We respect your privacy and will never share your information.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              Contact Us
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto">
              Get in touch with our team for partnerships, technical support, or enterprise inquiries
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-slate-400 mx-auto mb-6" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  General Inquiries
                </h3>
                <p className="professional-text text-slate-300 font-light mb-4">
                  For questions about the platform or partnership opportunities
                </p>
                <a 
                  href="mailto:info@pediasignal.ai" 
                  className="professional-text text-slate-400 hover:text-slate-300 font-light transition-colors"
                >
                  info@pediasignal.ai
                </a>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-slate-400 mx-auto mb-6" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  Technical Support
                </h3>
                <p className="professional-text text-slate-300 font-light mb-4">
                  For technical questions and implementation assistance
                </p>
                <a 
                  href="mailto:support@pediasignal.ai" 
                  className="professional-text text-slate-400 hover:text-slate-300 font-light transition-colors"
                >
                  support@pediasignal.ai
                </a>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <MapIcon className="h-12 w-12 text-slate-400 mx-auto mb-6" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  Enterprise Sales
                </h3>
                <p className="professional-text text-slate-300 font-light mb-4">
                  For hospital systems and large-scale implementations
                </p>
                <a 
                  href="mailto:enterprise@pediasignal.ai" 
                  className="professional-text text-slate-400 hover:text-slate-300 font-light transition-colors"
                >
                  enterprise@pediasignal.ai
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Heart className="h-6 w-6 text-slate-400" />
              <span className="professional-heading text-lg font-light text-slate-400">
                PediaSignal AI
              </span>
            </div>
            <p className="professional-text text-slate-400 font-light mb-6">
              Advanced AI for pediatric healthcare professionals
            </p>
            <div className="flex items-center justify-center space-x-6">
              <span className="professional-text text-xs text-slate-500 font-light">
                HIPAA Compliant
              </span>
              <span className="professional-text text-xs text-slate-500 font-light">
                SOC 2 Certified
              </span>
              <span className="professional-text text-xs text-slate-500 font-light">
                ISO 27001
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}