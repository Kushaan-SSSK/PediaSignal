import Header from "@/components/Header";
import ComplianceFooter from "@/components/ComplianceFooter";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  ShieldX,
  Target,
  CheckCircle,
  ArrowRight,
  Heart,
  Brain,
  Shield,
  Globe
} from "lucide-react";

// Mock user data - in a real app this would come from authentication
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
  profileImage: undefined
};

interface ProblemCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  statistics: string[];
  impact: string;
}

function ProblemCard({ title, description, icon: Icon, statistics, impact }: ProblemCardProps) {
  return (
    <Card className="bg-slate-800/30 border-slate-700/50 h-full">
      <CardContent className="p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center mr-4">
            <Icon className="h-6 w-6 text-red-300" />
          </div>
          <h3 className="professional-heading text-xl font-light text-white">
            {title}
          </h3>
        </div>
        <p className="professional-text text-slate-300 mb-6 font-light leading-relaxed">
          {description}
        </p>
        <div className="space-y-3 mb-6">
          {statistics.map((stat, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
              <span className="professional-text text-sm text-slate-300 font-light">{stat}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700/50 pt-4">
          <p className="professional-text text-sm text-red-300 font-light">
            <strong>Impact:</strong> {impact}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface SolutionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits: string[];
  approach: string;
}

function SolutionCard({ title, description, icon: Icon, benefits, approach }: SolutionCardProps) {
  return (
    <Card className="bg-slate-800/30 border-slate-700/50 h-full">
      <CardContent className="p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mr-4">
            <Icon className="h-6 w-6 text-slate-300" />
          </div>
          <h3 className="professional-heading text-xl font-light text-white">
            {title}
          </h3>
        </div>
        <p className="professional-text text-slate-300 mb-6 font-light leading-relaxed">
          {description}
        </p>
        <div className="space-y-3 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="professional-text text-sm text-slate-300 font-light">{benefit}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700/50 pt-4">
          <p className="professional-text text-sm text-slate-300 font-light">
            <strong>Approach:</strong> {approach}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Why() {
  const problems = [
    {
      title: "Inadequate Emergency Training",
      description: "Healthcare professionals lack sufficient hands-on experience with pediatric emergencies due to limited training opportunities and high-stakes real-world scenarios.",
      icon: AlertTriangle,
      statistics: [
        "70% of medical errors occur due to inadequate training",
        "Pediatric emergencies account for 15-20% of all ER visits",
        "Only 35% of healthcare workers feel confident in pediatric care"
      ],
      impact: "Medical errors, delayed diagnosis, and compromised patient outcomes in critical pediatric cases."
    },
    {
      title: "Undetected Child Abuse",
      description: "Child abuse cases often go unrecognized due to subtle physical signs and limited radiological expertise in abuse pattern identification.",
      icon: ShieldX,
      statistics: [
        "1 in 4 children experience abuse or neglect",
        "Only 38% of child abuse cases are properly identified",
        "Delayed diagnosis occurs in 60% of abuse cases"
      ],
      impact: "Continued harm to vulnerable children, missed intervention opportunities, and long-term psychological damage."
    },
    {
      title: "Health Misinformation Spread",
      description: "Dangerous pediatric health misinformation spreads rapidly across digital platforms, putting children at risk and undermining public health efforts.",
      icon: Globe,
      statistics: [
        "64% of parents report encountering health misinformation online",
        "Vaccine hesitancy has increased by 40% due to online misinformation",
        "False health claims reach 6x more people than accurate information"
      ],
      impact: "Decreased vaccination rates, delayed medical care, and increased morbidity and mortality in children."
    },
    {
      title: "Limited Healthcare Access",
      description: "Parents struggle to access timely pediatric healthcare guidance, especially during non-business hours, leading to unnecessary emergency visits or delayed care.",
      icon: Clock,
      statistics: [
        "40% of pediatric ER visits are non-emergency cases",
        "Parents wait average 3.2 hours for medical advice",
        "68% of parents report difficulty accessing after-hours care"
      ],
      impact: "Overwhelmed emergency departments, delayed treatment for serious conditions, and increased healthcare costs."
    }
  ];

  const solutions = [
    {
      title: "AI-Powered Simulation Training",
      description: "Realistic, adaptive training scenarios that provide safe environments for healthcare professionals to practice critical pediatric emergency interventions.",
      icon: Heart,
      benefits: [
        "Risk-free learning environment for high-stakes scenarios",
        "Immediate feedback and clinical explanations",
        "Personalized training based on performance analytics",
        "Scalable training accessible to all healthcare facilities"
      ],
      approach: "Machine learning algorithms create dynamic cases that adapt to user responses, providing comprehensive training without patient risk."
    },
    {
      title: "Automated Abuse Detection",
      description: "Computer vision technology assists healthcare professionals in identifying potential child abuse cases through radiological image analysis.",
      icon: Brain,
      benefits: [
        "Early identification of abuse patterns in X-rays",
        "Reduced missed diagnoses through AI assistance",
        "Objective analysis supporting clinical decision-making",
        "Documentation support for forensic reporting"
      ],
      approach: "Deep learning models trained on clinical datasets provide confidence scores and pattern recognition to support radiological assessment."
    },
    {
      title: "Misinformation Monitoring",
      description: "Real-time monitoring and classification of pediatric health misinformation across digital platforms to protect public health.",
      icon: Shield,
      benefits: [
        "Early detection of dangerous health misinformation",
        "Rapid response capabilities for public health threats",
        "Evidence-based content classification",
        "Support for public health communication strategies"
      ],
      approach: "Natural language processing models continuously analyze content across platforms, providing risk assessment and trend analysis."
    },
    {
      title: "24/7 Triage Assistance",
      description: "AI-powered chatbot providing parents with immediate pediatric health guidance and appropriate care recommendations.",
      icon: Users,
      benefits: [
        "Immediate access to pediatric health guidance",
        "Reduced unnecessary emergency department visits",
        "Early identification of serious conditions requiring urgent care",
        "Multi-language support for diverse populations"
      ],
      approach: "Advanced language models provide symptom assessment and triage recommendations while maintaining safety-first protocols."
    }
  ];

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="professional-heading text-4xl md:text-5xl font-extralight mb-6 text-white">
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">PediaSignal AI</span>
          </h1>
          <p className="professional-text text-xl text-slate-300 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
            Addressing critical gaps in pediatric healthcare through innovative AI solutions that protect children 
            and support healthcare professionals worldwide.
          </p>
        </div>

        {/* Mission Statement */}
        <section className="mb-20">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-6" />
              <h2 className="professional-heading text-3xl font-light text-white mb-6">
                Our Mission
              </h2>
              <p className="professional-text text-slate-300 max-w-4xl mx-auto font-light leading-relaxed text-lg">
                To revolutionize pediatric healthcare by leveraging artificial intelligence to enhance medical training, 
                protect vulnerable children, combat health misinformation, and provide accessible healthcare guidance 
                to families worldwide.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Critical Problems Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              Critical Problems We Address
            </h2>
            <p className="professional-text text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              PediaSignal AI tackles four major challenges facing pediatric healthcare today, 
              each with significant impact on child welfare and healthcare outcomes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {problems.map((problem, index) => (
              <ProblemCard key={index} {...problem} />
            ))}
          </div>
        </section>

        {/* Our Solutions Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="professional-heading text-3xl font-light text-white mb-4">
              Our AI-Powered Solutions
            </h2>
            <p className="professional-text text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              Each problem requires a sophisticated, technology-driven approach that combines clinical expertise 
              with cutting-edge artificial intelligence to deliver measurable improvements in pediatric care.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <SolutionCard key={index} {...solution} />
            ))}
          </div>
        </section>

        {/* Impact Metrics */}
        <section className="mb-20">
          <h2 className="professional-heading text-3xl font-light text-white mb-12 text-center">
            Expected Impact
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <div className="professional-text text-3xl font-light text-white mb-2">25%</div>
                <div className="professional-text text-sm text-slate-300 font-light mb-2">
                  Reduction in Medical Errors
                </div>
                <p className="professional-text text-xs text-slate-400 font-light">
                  Through improved training and decision support
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <div className="professional-text text-3xl font-light text-white mb-2">40%</div>
                <div className="professional-text text-sm text-slate-300 font-light mb-2">
                  Increase in Abuse Detection
                </div>
                <p className="professional-text text-xs text-slate-400 font-light">
                  Earlier identification and intervention
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <div className="professional-text text-3xl font-light text-white mb-2">60%</div>
                <div className="professional-text text-sm text-slate-300 font-light mb-2">
                  Faster Misinformation Response
                </div>
                <p className="professional-text text-xs text-slate-400 font-light">
                  Rapid identification and classification
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <div className="professional-text text-3xl font-light text-white mb-2">30%</div>
                <div className="professional-text text-sm text-slate-300 font-light mb-2">
                  Reduction in ER Visits
                </div>
                <p className="professional-text text-xs text-slate-400 font-light">
                  Through better triage and guidance
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section>
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <h2 className="professional-heading text-3xl font-light text-white mb-6">
                Join the Future of Pediatric Healthcare
              </h2>
              <p className="professional-text text-slate-300 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
                PediaSignal AI represents a paradigm shift in how we approach pediatric healthcare challenges. 
                By combining clinical expertise with artificial intelligence, we create solutions that are not just innovative, 
                but essential for protecting children and supporting healthcare professionals.
              </p>
              <div className="flex justify-center items-center space-x-8 text-slate-400">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span className="professional-text text-sm font-light">Better Training</span>
                </div>
                <ArrowRight className="h-4 w-4" />
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span className="professional-text text-sm font-light">Child Protection</span>
                </div>
                <ArrowRight className="h-4 w-4" />
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span className="professional-text text-sm font-light">Global Impact</span>
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