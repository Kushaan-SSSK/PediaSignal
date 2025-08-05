import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, Chrome, AlertTriangle, CheckCircle, Globe, Eye } from "lucide-react";
import { Link } from "wouter";

interface MisinfoAnalysis {
  title: string;
  content: string;
  source: string;
  platform: string;
  riskScore: number;
  category: string;
  detectedClaims: string[];
  factChecks: Array<{
    claim: string;
    status: "false" | "misleading" | "verified";
    explanation: string;
  }>;
}

const demoAnalyses: MisinfoAnalysis[] = [
  {
    title: "Essential Oils Can Replace Vaccines for Children",
    content: "Many parents are discovering that essential oils like tea tree and lavender can provide the same protection as vaccines, without the harmful side effects...",
    source: "https://naturalhealthblog.example.com",
    platform: "Blog",
    riskScore: 0.92,
    category: "vaccine_misinformation",
    detectedClaims: [
      "Essential oils can replace vaccines",
      "Vaccines have harmful side effects",
      "Natural immunity is always better"
    ],
    factChecks: [
      {
        claim: "Essential oils can replace vaccines",
        status: "false",
        explanation: "No scientific evidence supports essential oils as vaccine replacements. Vaccines undergo rigorous clinical trials and provide proven immunity against serious diseases."
      },
      {
        claim: "Vaccines have harmful side effects",
        status: "misleading",
        explanation: "While vaccines can have mild side effects (soreness, low fever), serious adverse events are extremely rare. The benefits far outweigh the risks."
      }
    ]
  },
  {
    title: "Honey Can Treat Infant Cough Better Than Medicine",
    content: "Grandmothers have known for generations that honey is the best remedy for babies with cough. It's natural and more effective than any pharmacy medicine...",
    source: "https://parentingtips.example.com",
    platform: "Parenting Forum",
    riskScore: 0.78,
    category: "dangerous_remedy",
    detectedClaims: [
      "Honey is safe for infants",
      "Natural remedies are always safer",
      "Honey treats cough better than medicine"
    ],
    factChecks: [
      {
        claim: "Honey is safe for infants",
        status: "false",
        explanation: "Honey should NEVER be given to children under 12 months due to risk of botulism, which can be fatal in infants."
      },
      {
        claim: "Honey treats cough better than medicine",
        status: "misleading",
        explanation: "While honey can help cough in children over 1 year, it's not superior to proven medications and carries risks for very young children."
      }
    ]
  },
  {
    title: "Fever Should Always Be Immediately Reduced in Children",
    content: "According to pediatric guidelines, any fever in children should be treated immediately with medication to prevent brain damage and seizures...",
    source: "https://medicalnews.example.com",
    platform: "Medical News Site",
    riskScore: 0.34,
    category: "medical_misinformation",
    detectedClaims: [
      "All fevers must be treated immediately",
      "Fever causes brain damage",
      "Fever medication prevents seizures"
    ],
    factChecks: [
      {
        claim: "All fevers must be treated immediately",
        status: "misleading",
        explanation: "Fever is often beneficial and doesn't always require treatment. Treatment focuses on comfort, not just temperature reduction."
      },
      {
        claim: "Fever causes brain damage",
        status: "false",
        explanation: "Simple fevers (under 107°F) from common illnesses do not cause brain damage. The body's temperature regulation prevents this."
      }
    ]
  }
];

export default function DemoMisinformation() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<MisinfoAnalysis>(demoAnalyses[0]);
  const [isExtensionActive, setIsExtensionActive] = useState(false);
  const [scanningUrl, setScanningUrl] = useState("");

  useEffect(() => {
    // Simulate extension scanning
    const interval = setInterval(() => {
      const urls = [
        "https://parentblog.example.com/natural-remedies",
        "https://healthtips.example.com/vaccine-alternatives",
        "https://kidswellness.example.com/fever-treatment"
      ];
      setScanningUrl(urls[Math.floor(Math.random() * urls.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (score: number) => {
    if (score < 0.3) return "text-green-400";
    if (score < 0.7) return "text-yellow-400";
    return "text-red-400";
  };

  const getRiskBadge = (score: number) => {
    if (score < 0.3) return { variant: "secondary" as const, text: "Low Risk", color: "border-green-400 text-green-400" };
    if (score < 0.7) return { variant: "default" as const, text: "Medium Risk", color: "border-yellow-400 text-yellow-400" };
    return { variant: "destructive" as const, text: "High Risk", color: "border-red-400 text-red-400" };
  };

  const getClaimStatusIcon = (status: string) => {
    switch (status) {
      case "false":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case "misleading":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-slate-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-light">Misinformation Monitor Demo</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-emerald-400 border-emerald-400">
              <Chrome className="h-3 w-3 mr-1" />
              Browser Extension
            </Badge>
            <Button
              onClick={() => setIsExtensionActive(!isExtensionActive)}
              className={isExtensionActive ? "bg-green-600 hover:bg-green-700" : "bg-slate-600 hover:bg-slate-700"}
            >
              {isExtensionActive ? "Active" : "Activate"} Monitor
            </Button>
          </div>
        </div>

        {/* Extension Status */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className={`h-6 w-6 ${isExtensionActive ? "text-green-400" : "text-slate-400"}`} />
                <div>
                  <h3 className="font-semibold">
                    Extension Status: {isExtensionActive ? "Monitoring Active" : "Standby Mode"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isExtensionActive ? `Scanning: ${scanningUrl}` : "Activate to begin monitoring pediatric health content"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  {isExtensionActive ? "Real-time Analysis" : "Selective Activation"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Detected Content List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-light">
                <Globe className="h-5 w-5 mr-2 text-emerald-400" />
                Detected Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoAnalyses.map((analysis, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAnalysis === analysis ? "bg-slate-700" : "bg-slate-800/50 hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium line-clamp-2">{analysis.title}</h3>
                    <Badge variant="outline" className={getRiskBadge(analysis.riskScore).color}>
                      {getRiskBadge(analysis.riskScore).text}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>{analysis.platform}</span>
                    <span>•</span>
                    <span className={getRiskColor(analysis.riskScore)}>
                      {(analysis.riskScore * 100).toFixed(0)}% risk
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Analysis Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Overview */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg font-light">
                  Content Analysis
                  <Badge variant="outline" className={getRiskBadge(selectedAnalysis.riskScore).color}>
                    Risk Score: {(selectedAnalysis.riskScore * 100).toFixed(0)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{selectedAnalysis.title}</h3>
                  <p className="text-sm text-slate-300 bg-slate-700/30 p-3 rounded-lg">
                    {selectedAnalysis.content}
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Source:</span>
                    <span className="ml-2 text-blue-400">{selectedAnalysis.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Platform:</span>
                    <span className="ml-2">{selectedAnalysis.platform}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Category:</span>
                    <span className="ml-2 capitalize">{selectedAnalysis.category.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Detection Time:</span>
                    <span className="ml-2">2 minutes ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fact Checks */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-light">AI Fact-Check Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAnalysis.factChecks.map((factCheck, index) => (
                  <div key={index} className="border border-slate-600 rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      {getClaimStatusIcon(factCheck.status)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">"{factCheck.claim}"</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            factCheck.status === "false" ? "border-red-400 text-red-400" :
                            factCheck.status === "misleading" ? "border-yellow-400 text-yellow-400" :
                            "border-green-400 text-green-400"
                          }`}
                        >
                          {factCheck.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {factCheck.explanation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Technical Implementation */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-light">Technical Implementation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2 text-emerald-400">Detection Engine</h3>
                    <ul className="space-y-1 text-slate-300">
                      <li>• OpenAI GPT-4 Analysis</li>
                      <li>• Keyword Pattern Matching</li>
                      <li>• Medical Fact Database</li>
                      <li>• Real-time Content Scanning</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-emerald-400">Browser Integration</h3>
                    <ul className="space-y-1 text-slate-300">
                      <li>• Chrome Extension API</li>
                      <li>• Content Script Injection</li>
                      <li>• DOM Analysis</li>
                      <li>• Background Processing</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-emerald-400">Risk Assessment</h3>
                    <ul className="space-y-1 text-slate-300">
                      <li>• Multi-factor Risk Scoring</li>
                      <li>• Medical Authority Verification</li>
                      <li>• Source Credibility Analysis</li>
                      <li>• Historical Pattern Recognition</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-emerald-400">User Protection</h3>
                    <ul className="space-y-1 text-slate-300">
                      <li>• Visual Warning Overlays</li>
                      <li>• Educational Resource Links</li>
                      <li>• Professional Consultation Prompts</li>
                      <li>• Alternative Source Suggestions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}