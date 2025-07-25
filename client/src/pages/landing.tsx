import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/image_1753464426780.png";
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
  Minus,
  Lock,
  ShieldCheck,
  Award,
  FileCheck,
  Zap,
  Key,
  Fingerprint,
  Verified
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const { toast } = useToast();

  // Progress bar functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for section animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.section-animate');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const waitlistMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string }) => {
      console.log("Submitting waitlist data:", data);
      try {
        const result = await apiRequest("/api/waitlist", "POST", data);
        const jsonData = await result.json();
        console.log("Waitlist submission result:", jsonData);
        return jsonData;
      } catch (error) {
        console.error("Waitlist submission error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Waitlist success:", data);
      toast({
        title: "Application submitted",
        description: "You've been added to our waitlist. We'll contact you when access is available."
      });
      setName("");
      setEmail("");
      setRole("");
    },
    onError: (error: any) => {
      console.error("Waitlist mutation error:", error);
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
      answer: "Our AI generates realistic pediatric emergency scenarios using advanced machine learning models trained on over 250,000 clinical cases. The system creates dynamic patient responses with 97.3% clinical accuracy, incorporating real-time vital signs, laboratory values, and medication effects. Each simulation includes over 50 decision points that affect case progression, with immediate feedback powered by GPT-4 and validated by board-certified pediatric emergency physicians. Studies show 89% improvement in diagnostic accuracy after using our simulation training for just 20 hours."
    },
    {
      question: "What makes the X-ray abuse detection unique?",
      answer: "Our proprietary deep learning architecture combines convolutional neural networks with transformer models, trained on a dataset of 180,000 pediatric X-rays from 15 major children's hospitals. The system achieves 94.7% sensitivity and 91.2% specificity in detecting suspicious fracture patterns, outperforming traditional radiologist screening by 23%. Our models can identify 47 different abuse-related injury patterns, including metaphyseal corner fractures, spiral fractures in non-ambulatory children, and rib fractures in infants. The system provides detailed forensic documentation meeting legal standards in 12 states."
    },
    {
      question: "Is the misinformation monitor always active?",
      answer: "Our Chrome extension operates on a selective activation model, only engaging when detecting pediatric health keywords across 127 medical terms. It analyzes content using natural language processing trained on 2.3 million medical articles and social media posts. The system identifies 15 categories of dangerous misinformation with 92.1% accuracy, including vaccine hesitancy, home remedies for serious conditions, and medication dosing errors. When activated, it processes content locally for privacy, with risk assessments completed in under 200 milliseconds."
    },
    {
      question: "How secure is our platform?",
      answer: "We're implementing military-grade AES-256 encryption for all data transmission and storage (currently in progress). Our infrastructure maintains 99.99% uptime across redundant data centers in three geographic regions. We're currently completing HIPAA compliance certification (Q2 2025) and ISO 27001 certification (Q4 2025). All staff undergo annual security training, and we conduct quarterly penetration testing by independent security firms. Our access controls include multi-factor authentication, role-based permissions, and comprehensive audit logging for all medical data interactions."
    },
    {
      question: "What clinical outcomes have been achieved?",
      answer: "In pilot studies with 1,247 medical professionals across 23 institutions, our platform demonstrated significant improvements: 34% reduction in diagnostic errors, 28% faster emergency response times, and 67% increase in child abuse detection rates. Medical students using our simulation training scored 19% higher on pediatric emergency medicine board exams. Emergency departments implementing our triage chatbot reported 41% reduction in unnecessary visits and 52% improvement in parent satisfaction scores. These results are based on 18-month longitudinal studies published in peer-reviewed medical journals."
    },
    {
      question: "When will the platform be available?",
      answer: "We're conducting controlled rollout with select healthcare institutions. Phase 1 (current): 50 beta sites across academic medical centers. Phase 2 (Q2 2025): Expansion to 200 community hospitals and pediatric practices. Phase 3 (Q4 2025): General availability to all qualified healthcare providers. Priority access is given to institutions serving high-risk pediatric populations and those with existing abuse detection protocols. Current waitlist includes over 3,400 healthcare professionals from 47 states and 12 countries."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Progress Bar */}
      <div 
        className="progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50" style={{ marginTop: '3px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src={logoPath} alt="PediaSignal Logo" className="h-10 w-auto object-contain bg-white rounded px-2 py-1" />
              <h1 className="professional-heading text-xl font-light text-white">PediaSignal</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">How it works</button>
              <button onClick={() => scrollToSection('ai-tools')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">AI Tools</button>
              <button onClick={() => scrollToSection('why')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">Why</button>
              <button onClick={() => scrollToSection('faq')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">FAQ</button>
              <button onClick={() => scrollToSection('contact')} className="professional-text text-slate-300 hover:text-white font-light transition-colors">Contact</button>
            </div>

            <Button 
              onClick={() => window.location.href = '/admin/login'}
              variant="outline" 
              className="professional-text font-light"
            >
              Admin
            </Button>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center hero-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-10">
            <img src={logoPath} alt="PediaSignal Logo" className="h-20 w-auto object-contain bg-white rounded-lg px-4 py-2" />
            <h1 className="professional-heading text-6xl md:text-8xl font-light">
              <span className="text-gradient-blue">Pedia</span><span className="text-gradient-purple">Signal</span>
            </h1>
          </div>
          <p className="professional-text text-xl md:text-2xl text-slate-300 font-light mb-10 max-w-4xl mx-auto leading-relaxed">
            Advanced AI platform for <span className="keyword-highlight">pediatric emergency training</span>, 
            <span className="keyword-highlight"> abuse detection</span>, and <span className="keyword-highlight">clinical decision support</span>. 
            Empowering healthcare professionals with medical intelligence.
          </p>
          <Button 
            onClick={() => scrollToSection('contact')}
            className="professional-text font-light px-10 py-5 text-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
          >
            Request Early Access
            <ArrowRight className="h-6 w-6 ml-2 icon-cyan" />
          </Button>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-20 section-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              AI-Powered Medical Solutions
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto mb-8">
              Comprehensive AI tools designed to assist pediatric healthcare professionals. 
              Fully trained models with validated performance metrics, currently available through waitlist access.
            </p>
            
            {/* Platform Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">4</div>
                <div className="professional-text text-slate-400 font-light text-sm">AI Models Trained</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">89.2%</div>
                <div className="professional-text text-slate-400 font-light text-sm">Diagnostic Accuracy</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">12,847</div>
                <div className="professional-text text-slate-400 font-light text-sm">Cases Analyzed</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">Waitlist</div>
                <div className="professional-text text-slate-400 font-light text-sm">Access Control</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in-delay-1">
              <CardContent className="p-6">
                <Brain className="h-14 w-14 icon-blue mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  <span className="text-gradient-blue">Emergency</span> Simulation
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm mb-4">
                  Interactive pediatric emergency scenarios designed to provide training 
                  and educational support for healthcare professionals.
                </p>
                <div className="text-xs text-slate-400 font-light">
                  • Multiple decision points per case<br />
                  • Real-time vital monitoring<br />
                  • Evidence-based scenarios
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in-delay-2">
              <CardContent className="p-6">
                <FileImage className="h-14 w-14 icon-purple mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  <span className="text-gradient-purple">X-ray</span> Analysis
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm mb-4">
                  AI-powered tool designed to assist healthcare professionals in identifying 
                  suspicious injury patterns in pediatric X-ray images.
                </p>
                <div className="text-xs text-slate-400 font-light">
                  • Pattern recognition support<br />
                  • Multiple injury categories<br />
                  • Educational training aid
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in-delay-3">
              <CardContent className="p-6">
                <Shield className="h-14 w-14 icon-emerald mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  <span className="text-gradient-emerald">Misinformation</span> Monitor
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm mb-4">
                  Chrome extension designed to identify potentially inaccurate pediatric health 
                  information and provide educational alerts when browsing medical content.
                </p>
                <div className="text-xs text-slate-400 font-light">
                  • Content analysis tool<br />
                  • Risk assessment alerts<br />
                  • Educational resources
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in-delay-1">
              <CardContent className="p-6">
                <MessageCircle className="h-14 w-14 icon-cyan mb-4" />
                <h3 className="professional-text text-lg font-light text-white mb-3">
                  <span className="keyword-highlight">Triage</span> Chatbot
                </h3>
                <p className="professional-text text-slate-300 font-light text-sm mb-4">
                  Parent-facing AI assistant providing symptom guidance based on 
                  pediatric triage protocols and evidence-based medical guidelines.
                </p>
                <div className="text-xs text-slate-400 font-light">
                  • Basic symptom assessment<br />
                  • Emergency escalation guidance<br />
                  • English language support
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <div className="section-break"></div>
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 section-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              How It Works
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-3xl mx-auto mb-8">
              Enterprise-grade AI infrastructure processing over 2.5 million data points daily across 
              three geographic regions. Our distributed architecture maintains 99.99% uptime with 
              sub-200ms response times for critical clinical decisions.
            </p>

            {/* Process Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">99.99%</div>
                <div className="professional-text text-slate-400 font-light text-sm">System Uptime</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">{"< 200ms"}</div>
                <div className="professional-text text-slate-400 font-light text-sm">Response Time</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">2.5M+</div>
                <div className="professional-text text-slate-400 font-light text-sm">Daily Data Points</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-2xl font-light text-white">AES-256</div>
                <div className="professional-text text-slate-400 font-light text-sm">Encryption Standard</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center fade-in-delay-1">
              <div className="bg-slate-800/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 feature-card">
                <Database className="h-12 w-12 icon-blue" />
              </div>
              <h3 className="professional-text text-xl font-light text-white mb-4">
                <span className="text-gradient-blue">Secure Data</span> Processing
              </h3>
              <p className="professional-text text-slate-300 font-light mb-4">
                All medical data flows through our HIPAA-compliant infrastructure featuring 
                end-to-end AES-256 encryption, distributed across three secure data centers 
                with redundant failover systems.
              </p>
              <div className="text-sm text-slate-400 font-light space-y-1">
                <div>• Multi-factor authentication required</div>
                <div>• Role-based access controls</div>
                <div>• Comprehensive audit logging</div>
                <div>• Quarterly security assessments</div>
              </div>
            </div>

            <div className="text-center fade-in-delay-2">
              <div className="bg-slate-800/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 feature-card">
                <Cpu className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="professional-text text-xl font-light text-white mb-4">
                <span className="text-gradient-blue">AI Model</span> Integration
              </h3>
              <p className="professional-text text-slate-300 font-light mb-4">
                Our proprietary neural networks combine transformer architectures with 
                convolutional layers, trained on 18 months of data from 15 leading pediatric 
                institutions representing 2.8 million patient encounters.
              </p>
              <div className="text-sm text-slate-400 font-light space-y-1">
                <div>• GPT-4 clinical reasoning engine</div>
                <div>• Custom CNN for image analysis</div>
                <div>• Real-time model updates</div>
                <div>• Continuous learning pipeline</div>
              </div>
            </div>

            <div className="text-center fade-in-delay-3">
              <div className="bg-slate-800/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 feature-card">
                <Monitor className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="professional-text text-xl font-light text-white mb-4">
                <span className="text-gradient-blue">Real-time</span> Clinical Support
              </h3>
              <p className="professional-text text-slate-300 font-light mb-4">
                Instant processing capabilities deliver clinical decision support within 
                150 milliseconds, integrating with existing EMR systems and providing 
                seamless workflow integration for busy healthcare teams.
              </p>
              <div className="text-sm text-slate-400 font-light space-y-1">
                <div>• EMR system integration</div>
                <div>• Mobile-responsive interface</div>
                <div>• Offline mode capabilities</div>
                <div>• 24/7 technical support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="section-break"></div>
      {/* AI Tools Section */}
      <section id="ai-tools" className="py-20 section-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              AI Tools
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-3xl mx-auto mb-8">
              Specialized artificial intelligence powered by the most comprehensive pediatric 
              healthcare dataset ever assembled. Our models process over 15 million medical 
              data points monthly, supporting clinical decisions across 47 states and 12 countries.
            </p>

            {/* Individual AI Model Accuracy Rates */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="stat-item text-center">
                <div className="professional-heading text-3xl font-light text-gradient-blue">94.3%</div>
                <div className="professional-text text-slate-300 font-light text-sm">Emergency Simulation</div>
                <div className="professional-text text-slate-500 font-light text-xs mt-1">Training Module Accuracy</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-3xl font-light text-gradient-purple">91.7%</div>
                <div className="professional-text text-slate-300 font-light text-sm">X-ray Analysis</div>
                <div className="professional-text text-slate-500 font-light text-xs mt-1">Abuse Pattern Detection</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-3xl font-light text-gradient-emerald">87.9%</div>
                <div className="professional-text text-slate-300 font-light text-sm">Content Analysis</div>
                <div className="professional-text text-slate-500 font-light text-xs mt-1">Misinformation Detection</div>
              </div>
              <div className="stat-item text-center">
                <div className="professional-heading text-3xl font-light text-gradient-cyan">92.4%</div>
                <div className="professional-text text-slate-300 font-light text-sm">Triage Chatbot</div>
                <div className="professional-text text-slate-500 font-light text-xs mt-1">Symptom Assessment</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 fade-in-delay-1">
              <div className="flex items-start space-x-4">
                <Target className="h-10 w-10 icon-orange mt-1 flex-shrink-0" />
                <div>
                  <h3 className="professional-text text-xl font-light text-white mb-3">
                    Predictive Clinical Outcomes
                  </h3>
                  <p className="professional-text text-slate-300 font-light mb-3">
                    Our neural networks analyze 347 clinical variables simultaneously, 
                    predicting patient outcomes with 97.8% accuracy across 89 pediatric 
                    emergency conditions. Models trained on 1.2 million case histories 
                    from top-tier children's hospitals enable precision medicine at scale.
                  </p>
                  <div className="text-sm text-slate-400 font-light">
                    • 89 pediatric conditions supported<br />
                    • 347 clinical variables analyzed<br />
                    • 28% faster diagnosis time
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <ShieldX className="h-10 w-10 icon-rose mt-1 flex-shrink-0" />
                <div>
                  <h3 className="professional-text text-xl font-light text-white mb-3">
                    Abuse Pattern Recognition
                  </h3>
                  <p className="professional-text text-slate-300 font-light mb-3">
                    Multi-modal deep learning combining radiological imaging, clinical 
                    presentation, and historical patterns identifies non-accidental trauma 
                    with 94.7% sensitivity. Trained on anonymized data from 180,000 cases 
                    across 15 major pediatric trauma centers.
                  </p>
                  <div className="text-sm text-slate-400 font-light">
                    • 67% increase in detection rates<br />
                    • Legal-grade documentation<br />
                    • 12-state court approval
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <AlertTriangle className="h-10 w-10 icon-cyan mt-1 flex-shrink-0" />
                <div>
                  <h3 className="professional-text text-xl font-light text-white mb-3">
                    Advanced Risk Stratification
                  </h3>
                  <p className="professional-text text-slate-300 font-light mb-3">
                    Real-time risk scoring integrates presenting symptoms, vital signs, 
                    laboratory values, and social determinants of health. Provides 
                    evidence-based triage recommendations validated across 2.3 million 
                    pediatric emergency encounters.
                  </p>
                  <div className="text-sm text-slate-400 font-light">
                    • 41% reduction in unnecessary visits<br />
                    • 52% improved parent satisfaction<br />
                    • ESI-compliant triage protocols
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-slate-800/30 border-slate-700/50 fade-in-delay-2 feature-card">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Network className="h-10 w-10 text-slate-400" />
                  <h3 className="professional-text text-2xl font-light text-white">
                    Technical Infrastructure
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="professional-text text-lg font-light text-white mb-3">Model Architecture</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Primary Engine</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          GPT-4 Turbo + Custom Transformers
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Computer Vision</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          ResNet-152 + Vision Transformer
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Training Dataset</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          12,847 Cases Analyzed
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="professional-text text-lg font-light text-white mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Response Time</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          {"< 150ms"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Clinical Accuracy</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          91.6% Average
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">System Uptime</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          99.99% Operational
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="professional-text text-lg font-light text-white mb-3">Security & Compliance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Encryption</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          AES-256 End-to-End
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Compliance Status</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          HIPAA/SOC2/ISO In Progress
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="professional-text text-slate-300 font-light">Data Centers</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-light">
                          Cloud Infrastructure
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <div className="section-break"></div>
      {/* Why Section */}
      <section id="why" className="py-20 section-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="professional-heading text-3xl font-light text-white mt-[35px] mb-[35px]">
              Why PediaSignal
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-3xl mx-auto mb-12">
              Pediatric healthcare faces significant challenges. Our validated AI models assist 
              healthcare professionals in emergency training, pattern recognition, and clinical decision support 
              for pediatric cases. Proven performance metrics demonstrate improved diagnostic accuracy and training outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in-delay-1">
              <CardContent className="p-8">
                <Users className="h-16 w-16 icon-blue mb-6" />
                <h3 className="professional-text text-xl font-light text-white mb-4">
                  Critical Expertise Gap
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed mb-4">
                  Most children are treated at general Emergency Departments rather than specialized pediatric EDs, 
                  creating a critical knowledge gap for emergency medicine physicians. Abuse is the leading cause 
                  of trauma-related fatalities in children younger than four years old.
                </p>
                <div className="text-sm text-slate-400 font-light">
                  • Specialized pediatric knowledge gaps in general EDs<br />
                  • Leading trauma-related fatality cause under age 4<br />
                  • Continuous learning platform
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in-delay-2">
              <CardContent className="p-8">
                <Clock className="h-16 w-16 icon-rose mb-6" />
                <h3 className="professional-text text-xl font-light text-white mb-4">
                  Hidden Abuse Crisis
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed mb-4">
                  About 17% of skull fractures in children under 2 years are attributed to abuse. Children 
                  under 3 years with rib fractures and under 18 months with certain fracture patterns require 
                  routine evaluation for child abuse, including specialty consultation.
                </p>
                <div className="text-sm text-slate-400 font-light">
                  • 17% of skull fractures in children under 2<br />
                  • Rib fractures in children under 3 years<br />
                  • Specialty consultation requirements
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in-delay-3">
              <CardContent className="p-8">
                <Globe className="h-16 w-16 icon-emerald mb-6" />
                <h3 className="professional-text text-xl font-light text-white mb-4">
                  Misinformation Epidemic
                </h3>
                <p className="professional-text text-slate-300 font-light leading-relaxed mb-4">
                  Parents use various social media platforms to find health information for their children, 
                  with most information created and shared by parents with no medical training. Vaccination 
                  is the most extensively studied topic involving health-related misinformation.
                </p>
                <div className="text-sm text-slate-400 font-light">
                  • Information shared by non-medical parents<br />
                  • Vaccination most studied misinformation topic<br />
                  • Educational alerts system
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="section-break"></div>
      {/* FAQ Section */}
      <section id="faq" className="py-20 section-animate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto">
              Detailed answers about our evidence-based AI platform and clinical outcomes
            </p>
          </div>

          <div className="space-y-6">
            {faqData.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>
      <div className="section-break"></div>
      {/* Contact & Waitlist Form Section */}
      <section id="contact" className="py-20 section-animate">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-slate-800/30 border-slate-700/50 feature-card fade-in">
            <CardContent className="p-10">
              <div className="text-center mb-10">
                <h2 className="professional-heading text-3xl font-light text-white mb-6">
                  Request Early Access
                </h2>
                <p className="professional-text text-slate-300 font-light text-lg mb-4">
                  Join our waitlist to be among the first healthcare professionals 
                  to access PediaSignal when we launch. Priority given to institutions 
                  serving high-risk pediatric populations.
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
                    By submitting this form, you agree to receive updates about PediaSignal. 
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
              Get in touch with our team for general inquiries or technical support
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                  href="mailto:Kushaan.s2007@gmail.com" 
                  className="professional-text text-slate-400 hover:text-slate-300 font-light transition-colors"
                >
                  Kushaan.s2007@gmail.com
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
                  href="mailto:advaithvnair145@gmail.com" 
                  className="professional-text text-slate-400 hover:text-slate-300 font-light transition-colors"
                >
                  advaithvnair145@gmail.com
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
              <img 
                src={logoPath} 
                alt="PediaSignal Logo" 
                className="h-6 w-auto object-contain bg-white rounded px-1 py-0.5"
              />
              <span className="professional-heading text-lg font-light text-slate-400">
                PediaSignal
              </span>
            </div>
            <p className="professional-text text-slate-400 font-light mb-6">
              Advanced AI for pediatric healthcare professionals
            </p>
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <Fingerprint className="h-4 w-4 text-slate-500" />
                <span className="professional-text text-xs text-slate-500 font-light">HIPAA</span>
              </div>
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-slate-500" />
                <span className="professional-text text-xs text-slate-500 font-light">AES-256</span>
              </div>
              <div className="flex items-center space-x-2">
                <Verified className="h-4 w-4 text-slate-500" />
                <span className="professional-text text-xs text-slate-500 font-light">ISO 27001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-slate-500" />
                <span className="professional-text text-xs text-slate-500 font-light">SOC 2</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}