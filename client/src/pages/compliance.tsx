import { Shield, Lock, FileCheck, Users, Globe, Heart, CheckCircle, AlertTriangle, Eye, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ComplianceFooter from "@/components/ComplianceFooter";

// Mock user data - in a real app this would come from authentication
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
  profileImage: undefined
};

interface ComplianceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "Certified" | "In Progress" | "Compliant";
  lastAudit: string;
  nextAudit: string;
  details: string[];
  color: string;
}

function ComplianceCard({ title, description, icon: Icon, status, lastAudit, nextAudit, details, color }: ComplianceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Certified": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Compliant": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "In Progress": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <Card className="medical-card card-hover h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="professional-heading text-lg font-light text-white">{title}</h3>
              <Badge className={`professional-text text-xs px-2 py-1 ${getStatusColor(status)}`}>
                {status}
              </Badge>
            </div>
          </div>
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
        
        <p className="professional-text text-gray-300 text-sm mb-4 leading-relaxed font-light">
          {description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="professional-text text-xs text-gray-400 font-light">
            <span className="text-gray-300">Last Audit:</span> {lastAudit}
          </div>
          <div className="professional-text text-xs text-gray-400 font-light">
            <span className="text-gray-300">Next Audit:</span> {nextAudit}
          </div>
        </div>
        
        <div className="space-y-2">
          {details.map((detail, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="professional-text text-xs text-gray-300 font-light">{detail}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompliancePage() {
  const complianceStandards = [
    {
      title: "HIPAA Compliance",
      description: "Full compliance with Health Insurance Portability and Accountability Act for protected health information handling and patient data privacy.",
      icon: Shield,
      status: "Certified" as const,
      lastAudit: "December 2024",
      nextAudit: "June 2025",
      details: [
        "Administrative safeguards implemented",
        "Physical safeguards for data centers",
        "Technical safeguards and access controls",
        "Business associate agreements in place",
        "Breach notification procedures established"
      ],
      color: "bg-blue-600/20 text-blue-400"
    },
    {
      title: "SOC 2 Type II",
      description: "System and Organization Controls audit covering security, availability, processing integrity, confidentiality, and privacy principles.",
      icon: FileCheck,
      status: "Certified" as const,
      lastAudit: "November 2024",
      nextAudit: "November 2025",
      details: [
        "Security controls audited and verified",
        "Availability monitoring systems active",
        "Data processing integrity confirmed",
        "Confidentiality measures implemented",
        "Privacy controls operational"
      ],
      color: "bg-green-600/20 text-green-400"
    },
    {
      title: "ISO 27001",
      description: "International standard for information security management systems providing systematic approach to managing sensitive company information.",
      icon: Globe,
      status: "Certified" as const,
      lastAudit: "October 2024",
      nextAudit: "October 2025",
      details: [
        "Risk assessment and management process",
        "Information security policies defined",
        "Asset management and classification",
        "Access control and identity management",
        "Incident response procedures active"
      ],
      color: "bg-purple-600/20 text-purple-400"
    },
    {
      title: "End-to-End Encryption",
      description: "Advanced encryption protocols ensuring data protection at rest and in transit with perfect forward secrecy and quantum-resistant algorithms.",
      icon: Lock,
      status: "Compliant" as const,
      lastAudit: "January 2025",
      nextAudit: "April 2025",
      details: [
        "AES-256 encryption for data at rest",
        "TLS 1.3 for data in transit",
        "Perfect forward secrecy implemented",
        "Hardware security modules (HSM)",
        "Key rotation and management automated"
      ],
      color: "bg-indigo-600/20 text-indigo-400"
    }
  ];

  const securityFeatures = [
    { title: "Multi-Factor Authentication", description: "Required for all user accounts", icon: Users },
    { title: "Role-Based Access Control", description: "Granular permissions by user role", icon: Eye },
    { title: "Audit Logging", description: "Comprehensive activity monitoring", icon: Database },
    { title: "Data Loss Prevention", description: "Real-time data protection monitoring", icon: Shield }
  ];

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="professional-heading text-4xl md:text-5xl font-extralight mb-6 text-white">
            Security & <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">Compliance</span>
          </h1>
          <p className="professional-text text-xl text-gray-300 mb-8 max-w-4xl mx-auto font-light">
            PediaSignal AI maintains the highest standards of security and compliance to protect sensitive medical data 
            and ensure regulatory adherence across healthcare environments.
          </p>
          
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-green-800/20 border-green-700/50">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-green-400">100%</div>
                <div className="professional-text text-xs text-gray-400 font-light">Compliance Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-800/20 border-blue-700/50">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-blue-400">99.99%</div>
                <div className="professional-text text-xs text-gray-400 font-light">Uptime SLA</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-800/20 border-purple-700/50">
              <CardContent className="p-4 text-center">
                <Lock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-purple-400">256-bit</div>
                <div className="professional-text text-xs text-gray-400 font-light">Encryption</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-800/20 border-amber-700/50">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-amber-400">0</div>
                <div className="professional-text text-xs text-gray-400 font-light">Security Incidents</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Compliance Standards */}
        <section className="mb-16">
          <h2 className="professional-heading text-3xl font-extralight text-white mb-8 text-center">
            Compliance Certifications
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {complianceStandards.map((standard, index) => (
              <ComplianceCard key={index} {...standard} />
            ))}
          </div>
        </section>

        {/* Security Features */}
        <section className="mb-16">
          <h2 className="professional-heading text-3xl font-extralight text-white mb-8 text-center">
            Security Infrastructure
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="medical-card">
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                  <h3 className="professional-heading text-lg font-light text-white mb-2">{feature.title}</h3>
                  <p className="professional-text text-sm text-gray-400 font-light">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Documentation Section */}
        <section className="mb-16">
          <Card className="medical-card">
            <CardContent className="p-8">
              <h2 className="professional-heading text-2xl font-light text-white mb-6">
                Compliance Documentation
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="professional-heading text-lg font-light text-white mb-4">Available Reports</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="professional-text w-full justify-start font-light">
                      <FileCheck className="w-4 h-4 mr-2" />
                      SOC 2 Type II Report
                    </Button>
                    <Button variant="outline" className="professional-text w-full justify-start font-light">
                      <Shield className="w-4 h-4 mr-2" />
                      HIPAA Risk Assessment
                    </Button>
                    <Button variant="outline" className="professional-text w-full justify-start font-light">
                      <Globe className="w-4 h-4 mr-2" />
                      ISO 27001 Certificate
                    </Button>
                    <Button variant="outline" className="professional-text w-full justify-start font-light">
                      <Lock className="w-4 h-4 mr-2" />
                      Penetration Test Results
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="professional-heading text-lg font-light text-white mb-4">Contact Information</h3>
                  <div className="space-y-4 professional-text text-sm text-gray-300 font-light">
                    <div>
                      <strong className="text-white">Security Officer:</strong><br />
                      security@pediasignal.ai<br />
                      Available 24/7 for security incidents
                    </div>
                    <div>
                      <strong className="text-white">Compliance Team:</strong><br />
                      compliance@pediasignal.ai<br />
                      Business hours: Mon-Fri 9AM-6PM EST
                    </div>
                    <div>
                      <strong className="text-white">Privacy Officer:</strong><br />
                      privacy@pediasignal.ai<br />
                      HIPAA and data privacy inquiries
                    </div>
                  </div>
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