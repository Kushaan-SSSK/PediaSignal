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

  const joinWaitlistMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string }) => {
      return apiRequest("/api/waitlist", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome to the waitlist!",
        description: "We'll notify you when PediaSignal AI becomes available."
      });
      setEmail("");
      setName("");
      setRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist",
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
    joinWaitlistMutation.mutate({ name, email, role });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: Heart,
      title: "Emergency Simulation Training",
      description: "AI-powered pediatric emergency scenarios with real-time feedback and clinical explanations."
    },
    {
      icon: FileImage,
      title: "X-ray Abuse Detection",
      description: "Computer vision technology to identify potential child abuse patterns in radiological images."
    },
    {
      icon: Shield,
      title: "Misinformation Monitor",
      description: "Chrome extension that detects and analyzes pediatric health misinformation on web pages."
    },
    {
      icon: MessageCircle,
      title: "Parent Triage Chatbot",
      description: "24/7 AI-powered guidance for parents with pediatric health concerns and emergency protocols."
    }
  ];

  const howItWorksSteps = [
    {
      number: "1",
      title: "AI Content Analysis",
      description: "Advanced machine learning models analyze medical content, images, and conversations using evidence-based protocols.",
      icon: Brain
    },
    {
      number: "2",
      title: "Clinical Integration",
      description: "Seamless integration with existing healthcare workflows and electronic medical record systems.",
      icon: Database
    },
    {
      number: "3",
      title: "Real-time Processing",
      description: "Immediate analysis and feedback powered by cloud-based AI infrastructure with enterprise security.",
      icon: Cpu
    },
    {
      number: "4",
      title: "Professional Insights",
      description: "Actionable recommendations and insights delivered to healthcare professionals in real-time.",
      icon: Network
    }
  ];

  const problems = [
    {
      title: "Inadequate Training Opportunities",
      description: "Healthcare professionals lack sufficient hands-on experience with pediatric emergencies.",
      stats: "70% of medical errors due to inadequate training"
    },
    {
      title: "Missed Abuse Cases",
      description: "Child abuse often goes unrecognized due to subtle signs and limited radiological expertise.",
      stats: "Only 38% of abuse cases properly identified"
    },
    {
      title: "Health Misinformation",
      description: "Dangerous pediatric health misinformation spreads rapidly across digital platforms.",
      stats: "64% of parents encounter health misinformation online"
    },
    {
      title: "Limited Healthcare Access",
      description: "Parents struggle to access timely pediatric healthcare guidance, especially after hours.",
      stats: "40% of pediatric ER visits are non-emergency"
    }
  ];

  const faqItems = [
    {
      question: "What is PediaSignal AI?",
      answer: "PediaSignal AI is a comprehensive platform that uses artificial intelligence to address critical challenges in pediatric healthcare, including emergency training, abuse detection, misinformation monitoring, and parent triage assistance."
    },
    {
      question: "Who can use PediaSignal AI?",
      answer: "The platform is designed for healthcare professionals, including pediatricians, medical students, radiologists, and hospital administrators. Parents can access the triage chatbot for guidance on pediatric health concerns."
    },
    {
      question: "How does the Chrome extension work?",
      answer: "Our misinformation monitor operates as a Chrome extension that automatically detects pediatric health content on web pages and analyzes it for potential misinformation, providing real-time risk assessments."
    },
    {
      question: "Is the platform HIPAA compliant?",
      answer: "We are currently implementing HIPAA compliance protocols as part of our development process. Full compliance certification is in progress and will be completed before public launch."
    },
    {
      question: "When will PediaSignal AI be available?",
      answer: "We are currently in development and accepting waitlist registrations. Priority access will be given to healthcare professionals and medical institutions. Expected beta launch is planned for Q2 2025."
    },
    {
      question: "What training is provided?",
      answer: "Comprehensive training materials, documentation, and onboarding support will be provided to all users. This includes video tutorials, clinical case studies, and dedicated support channels."
    }
  ];

  return (
    <div className="min-h-screen medical-gradient">
      {/* Navigation Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-slate-300" />
              <h1 className="professional-heading text-xl font-light text-white">PediaSignal AI</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              {[
                { name: "Features", id: "features" },
                { name: "How It Works", id: "how-it-works" },
                { name: "AI Tools", id: "ai-tools" },
                { name: "Why", id: "why" },
                { name: "FAQ", id: "faq" },
                { name: "Contact", id: "contact" }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className="professional-text font-light text-slate-300 hover:text-white transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="flex space-x-3">
              <Button
                onClick={() => scrollToSection('waitlist')}
                variant="outline"
                className="professional-text font-light"
              >
                Join Waitlist
              </Button>
              <Button
                onClick={() => window.location.href = '/admin/login'}
                className="professional-text font-light"
              >
                Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20" id="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="professional-heading text-5xl md:text-6xl font-extralight mb-6 text-white">
            Protecting Children Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">AI Innovation</span>
          </h1>
          <p className="professional-text text-xl text-slate-300 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
            Advanced artificial intelligence platform addressing critical challenges in pediatric healthcare through 
            emergency training, abuse detection, misinformation monitoring, and parent triage assistance.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => scrollToSection('waitlist')}
              size="lg"
              className="professional-text font-light px-8 py-3"
            >
              Join Waitlist
            </Button>
            <Button 
              onClick={() => scrollToSection('features')}
              variant="outline" 
              size="lg"
              className="professional-text font-light px-8 py-3"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-b border-slate-700/30" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-4xl font-extralight mb-6 text-white">
              Core Features
            </h2>
            <p className="professional-text text-xl text-slate-300 max-w-3xl mx-auto font-light">
              Comprehensive AI-powered solutions designed specifically for pediatric healthcare challenges
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/30 border-slate-700/50 h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="professional-heading text-lg font-light text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="professional-text text-slate-300 font-light leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 border-b border-slate-700/30" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-4xl font-extralight mb-6 text-white">
              How It Works
            </h2>
            <p className="professional-text text-xl text-slate-300 max-w-3xl mx-auto font-light">
              Advanced AI technology combined with clinical expertise to deliver reliable healthcare solutions
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <Card key={index} className="bg-slate-800/30 border-slate-700/50 h-full">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mr-4">
                      <step.icon className="h-6 w-6 text-slate-300" />
                    </div>
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="professional-text text-sm font-light text-white">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="professional-heading text-lg font-light text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="professional-text text-slate-300 font-light leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="py-20 border-b border-slate-700/30" id="ai-tools">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-4xl font-extralight mb-6 text-white">
              AI-Powered Tools
            </h2>
            <p className="professional-text text-xl text-slate-300 max-w-3xl mx-auto font-light">
              Specialized artificial intelligence tools designed for pediatric healthcare professionals
            </p>
          </div>
          
          <div className="space-y-12">
            {/* Simulation Training */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h3 className="professional-heading text-2xl font-light text-white mb-4">
                      Emergency Simulation Training
                    </h3>
                    <p className="professional-text text-slate-300 font-light mb-6 leading-relaxed">
                      Realistic AI-generated pediatric emergency scenarios that adapt in real-time to provide 
                      comprehensive training without patient risk. Features dynamic case progression, 
                      vital sign monitoring, and clinical explanations.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-slate-400" />
                        <span className="professional-text text-slate-300 font-light">
                          Dynamic case generation with AI adaptation
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-slate-400" />
                        <span className="professional-text text-slate-300 font-light">
                          Real-time vital sign monitoring
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Heart className="h-32 w-32 text-slate-400 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* X-ray Analysis */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="text-center md:order-1">
                    <FileImage className="h-32 w-32 text-slate-400 mx-auto" />
                  </div>
                  <div className="md:order-2">
                    <h3 className="professional-heading text-2xl font-light text-white mb-4">
                      X-ray Abuse Detection
                    </h3>
                    <p className="professional-text text-slate-300 font-light mb-6 leading-relaxed">
                      Computer vision technology analyzes pediatric X-rays for potential abuse indicators. 
                      Provides confidence scores and pattern recognition to assist healthcare professionals 
                      in identifying suspicious injuries.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-slate-400" />
                        <span className="professional-text text-slate-300 font-light">
                          Automated fracture pattern recognition
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-slate-400" />
                        <span className="professional-text text-slate-300 font-light">
                          Confidence scoring and risk assessment
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-20 border-b border-slate-700/30" id="why">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-4xl font-extralight mb-6 text-white">
              Why PediaSignal AI
            </h2>
            <p className="professional-text text-xl text-slate-300 max-w-3xl mx-auto font-light">
              Addressing critical gaps in pediatric healthcare that put children at risk
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {problems.map((problem, index) => (
              <Card key={index} className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
                    <h3 className="professional-heading text-lg font-light text-white">
                      {problem.title}
                    </h3>
                  </div>
                  <p className="professional-text text-slate-300 font-light mb-4 leading-relaxed">
                    {problem.description}
                  </p>
                  <div className="text-red-300 text-sm font-light">
                    {problem.stats}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mission Statement */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-6" />
              <h3 className="professional-heading text-2xl font-light text-white mb-6">
                Our Mission
              </h3>
              <p className="professional-text text-slate-300 max-w-4xl mx-auto font-light leading-relaxed text-lg">
                To revolutionize pediatric healthcare by leveraging artificial intelligence to enhance medical training, 
                protect vulnerable children, combat health misinformation, and provide accessible healthcare guidance 
                to families worldwide.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-b border-slate-700/30" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-4xl font-extralight mb-6 text-white">
              Frequently Asked Questions
            </h2>
            <p className="professional-text text-xl text-slate-300 font-light">
              Common questions about PediaSignal AI and our approach to pediatric healthcare
            </p>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 border-b border-slate-700/30" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="professional-heading text-4xl font-extralight mb-6 text-white">
              Contact Us
            </h2>
            <p className="professional-text text-xl text-slate-300 font-light">
              Get in touch with our team for partnerships, support, or more information
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-slate-300 mx-auto mb-6" />
                <h3 className="professional-heading text-lg font-light text-white mb-4">
                  Email Support
                </h3>
                <p className="professional-text text-slate-300 font-light">
                  support@example.com
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-6" />
                <h3 className="professional-heading text-lg font-light text-white mb-4">
                  Partnerships
                </h3>
                <p className="professional-text text-slate-300 font-light">
                  partnerships@example.com
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-slate-300 mx-auto mb-6" />
                <h3 className="professional-heading text-lg font-light text-white mb-4">
                  Security & Compliance
                </h3>
                <p className="professional-text text-slate-300 font-light">
                  security@example.com
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-20" id="waitlist">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-12">
              <div className="text-center mb-8">
                <h2 className="professional-heading text-3xl font-extralight mb-6 text-white">
                  Join the Waitlist
                </h2>
                <p className="professional-text text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
                  Be among the first to access PediaSignal AI when it launches. 
                  Priority access will be given to healthcare professionals and medical institutions.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="professional-text font-light"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="professional-text font-light"
                  />
                </div>
                <div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 professional-text font-light"
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
                  disabled={joinWaitlistMutation.isPending}
                  className="w-full professional-text font-light py-3"
                >
                  {joinWaitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Heart className="h-6 w-6 text-slate-300" />
            <span className="professional-heading text-xl font-light text-white">PediaSignal AI</span>
          </div>
          <p className="professional-text text-slate-400 font-light">
            Protecting children through AI-powered pediatric healthcare innovation
          </p>
        </div>
      </footer>
    </div>
  );
}