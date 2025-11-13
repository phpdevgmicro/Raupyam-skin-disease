import { Switch, Route, Router } from "wouter";  
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SkinAnalysis from "@/pages/skin-analysis";
import NotFound from "@/pages/not-found";

const BASE_PATH = import.meta.env.PROD ? "/skin-analysis" : "";

function AppRouter() {
  return (
    <Router base={BASE_PATH}>
      <Switch>
        <Route path="/" component={SkinAnalysis} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
