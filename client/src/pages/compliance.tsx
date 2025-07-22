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
      case "Certified": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "Compliant": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "In Progress": return "bg-slate-600/20 text-slate-300 border-slate-600/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
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
          {status === "Compliant" ? (
            <CheckCircle className="h-5 w-5 text-slate-400" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
          )}
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
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
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
      description: "Implementation of Health Insurance Portability and Accountability Act requirements for protected health information handling and patient data privacy.",
      icon: Shield,
      status: "In Progress" as const,
      lastAudit: "N/A - Initial Assessment",
      nextAudit: "Q2 2025",
      details: [
        "Administrative safeguards framework in development",
        "Technical safeguards architecture planned",
        "Access control mechanisms being implemented",
        "Staff training program scheduled",
        "Compliance documentation in progress"
      ],
      color: "bg-gray-600/20 text-gray-400"
    },
    {
      title: "SOC 2 Type II",
      description: "System and Organization Controls readiness assessment for security, availability, processing integrity, confidentiality, and privacy.",
      icon: FileCheck,
      status: "In Progress" as const,
      lastAudit: "N/A - Pre-assessment Phase",
      nextAudit: "Q3 2025",
      details: [
        "Security control framework design",
        "Monitoring system implementation planned",
        "Data integrity processes being established",
        "Third-party auditor selection underway",
        "Control testing procedures in development"
      ],
      color: "bg-gray-600/20 text-gray-400"
    },
    {
      title: "ISO 27001",
      description: "Information security management system development following international standards for systematic information security management.",
      icon: Globe,
      status: "In Progress" as const,
      lastAudit: "N/A - Gap Analysis Phase",
      nextAudit: "Q4 2025",
      details: [
        "Information security policy development",
        "Risk management framework creation",
        "Asset inventory and classification ongoing",
        "Security awareness training planning",
        "Management system documentation started"
      ],
      color: "bg-gray-600/20 text-gray-400"
    },
    {
      title: "Data Encryption",
      description: "Implementation of encryption protocols for data protection at rest and in transit following industry best practices.",
      icon: Lock,
      status: "Compliant" as const,
      lastAudit: "January 2025",
      nextAudit: "April 2025",
      details: [
        "TLS 1.3 encryption for data transmission",
        "Database encryption at application level",
        "API endpoint security implementation",
        "Session management with secure cookies",
        "Password hashing using bcrypt"
      ],
      color: "bg-gray-600/20 text-gray-400"
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
            Security & <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">Compliance</span>
          </h1>
          <p className="professional-text text-xl text-gray-300 mb-8 max-w-4xl mx-auto font-light">
            PediaSignal AI maintains the highest standards of security and compliance to protect sensitive medical data 
            and ensure regulatory adherence across healthcare environments.
          </p>
          
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/20 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-slate-300">In Progress</div>
                <div className="professional-text text-xs text-gray-400 font-light">Compliance Status</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/20 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-slate-300">Development</div>
                <div className="professional-text text-xs text-gray-400 font-light">Platform Stage</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/20 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <Lock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-slate-300">TLS 1.3</div>
                <div className="professional-text text-xs text-gray-400 font-light">Transport Security</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/20 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <div className="professional-text text-lg font-light text-slate-300">Active</div>
                <div className="professional-text text-xs text-gray-400 font-light">Security Monitoring</div>
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
                      <strong className="text-white">Security Team:</strong><br />
                      security@example.com<br />
                      For security-related inquiries
                    </div>
                    <div>
                      <strong className="text-white">Compliance Team:</strong><br />
                      compliance@example.com<br />
                      Business hours: Mon-Fri 9AM-6PM EST
                    </div>
                    <div>
                      <strong className="text-white">Privacy Office:</strong><br />
                      privacy@example.com<br />
                      Data privacy and HIPAA inquiries
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