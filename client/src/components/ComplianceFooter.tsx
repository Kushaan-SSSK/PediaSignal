import { Shield, Lock, FileCheck, Users, Globe, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ComplianceFooter() {
  return (
    <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Compliance Certifications */}
        <div className="mb-12">
          <h3 className="professional-heading text-2xl font-thin text-white mb-8 text-center">
            Enterprise-Grade Security & Compliance
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                <div className="professional-text text-white font-light mb-2">HIPAA (In Progress)</div>
                <div className="professional-text text-xs text-gray-400 font-light">
                  Implementation of Health Insurance Portability and Accountability Act requirements underway
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardContent className="p-6 text-center">
                <FileCheck className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                <div className="professional-text text-white font-light mb-2">SOC 2 Type II (In Progress)</div>
                <div className="professional-text text-xs text-gray-400 font-light">
                  System and Organization Controls readiness assessment in development phase
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardContent className="p-6 text-center">
                <Lock className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                <div className="professional-text text-white font-light mb-2">Data Encryption</div>
                <div className="professional-text text-xs text-gray-400 font-light">
                  TLS 1.3 encryption for data transmission and secure session management implementation
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardContent className="p-6 text-center">
                <Globe className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                <div className="professional-text text-white font-light mb-2">ISO 27001 (In Progress)</div>
                <div className="professional-text text-xs text-gray-400 font-light">
                  Information security management system development following international standards
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Features */}
        <div className="mb-12">
          <h4 className="professional-heading text-lg font-thin text-white mb-6">Security Features</h4>
          <div className="grid md:grid-cols-3 gap-6 professional-text text-sm text-gray-300">
            <div>
              <h5 className="text-white font-medium mb-3">Data Protection</h5>
              <ul className="space-y-2 text-xs">
                <li>• Zero-knowledge architecture</li>
                <li>• Automated PII detection and masking</li>
                <li>• Data minimization and retention policies</li>
                <li>• Secure multi-tenant isolation</li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-medium mb-3">Access Control</h5>
              <ul className="space-y-2 text-xs">
                <li>• Multi-factor authentication required</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• Session management and timeout</li>
                <li>• Audit logging and monitoring</li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-medium mb-3">Infrastructure</h5>
              <ul className="space-y-2 text-xs">
                <li>• 24/7 security operations center</li>
                <li>• Penetration testing quarterly</li>
                <li>• Disaster recovery and backup</li>
                <li>• 99.99% uptime SLA guarantee</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="border-t border-gray-700/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="professional-text font-medium text-white">PediaSignal AI</span>
              <span className="professional-text text-gray-500">© 2024</span>
              <span className="professional-text text-xs text-gray-500">Enterprise Medical Platform</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 professional-text text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/compliance" className="hover:text-white transition-colors">Security Documentation</a>
              <a href="/compliance" className="hover:text-white transition-colors">Compliance Reports</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support Center</a>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="professional-text text-xs text-gray-500">
              This platform is designed for healthcare professionals and complies with all applicable medical data protection regulations.
              All patient data is processed in accordance with HIPAA, GDPR, and local privacy laws.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}