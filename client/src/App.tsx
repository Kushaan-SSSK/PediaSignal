import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Simulator from "@/pages/simulator";
import XrayAnalysis from "@/pages/xray-analysis";
import MisinformationMonitor from "@/pages/misinformation-monitor";
import TriageChatbot from "@/pages/triage-chatbot";
import CompliancePage from "@/pages/compliance";
import HowItWorks from "@/pages/how-it-works";
import Why from "@/pages/why";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/simulator" component={Simulator} />
      <Route path="/xray-analysis" component={XrayAnalysis} />
      <Route path="/misinformation-monitor" component={MisinformationMonitor} />
      <Route path="/triage-chatbot" component={TriageChatbot} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/why" component={Why} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
