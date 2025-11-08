import { useState } from "react";
import { type ConsentFormData, type AnalysisResponse } from "@/types/schema";
import { analyzeImages } from "@/lib/api";
import { sessionStorage } from "@/lib/sessionStorage";
import Header from "@/components/Header";
import ConsentForm from "@/components/ConsentForm";
import ImageUpload from "@/components/ImageUpload";
import AnalysisLoading from "@/components/AnalysisLoading";
import AnalysisResults from "@/components/AnalysisResults";
import FeedbackForm from "@/components/FeedbackForm";
import ProgressSteps from "@/components/ProgressSteps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "consent" | "upload" | "loading" | "results";

const stepMapping: Record<Step, number> = {
  consent: 1,
  upload: 2,
  loading: 2,
  results: 3,
};

export default function SkinAnalysis() {
  const [step, setStep] = useState<Step>("consent");
  const [consentData, setConsentData] = useState<ConsentFormData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { toast } = useToast();

  const transitionToStep = (newStep: Step) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 150);
  };

  const handleConsentSubmit = (data: ConsentFormData) => {
    setConsentData(data);
    transitionToStep("upload");
  };

  const handleStartAnalysis = async () => {
    if (images.length === 0) {
      toast({
        title: "No images uploaded",
        description: "Please upload at least one image to continue.",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.saveImages(images);
    setStep("loading");

    try {
      const results = await analyzeImages(images);
      
      if (results.msg === 'success') {
        setAnalysisResults({
          analysis: results.result || results.notice,
          recommendations: [],
          severity: "mild",
        });
        setStep("results");
      } else {
        throw new Error(results.notice || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your images. Please try again.",
        variant: "destructive",
      });
      setStep("upload");
    }
  };

  const handleBackToConsent = () => {
    transitionToStep("consent");
  };

  const handleStartOver = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("consent");
      setConsentData(null);
      setImages([]);
      setAnalysisResults(null);
      sessionStorage.clearAll();
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Unlock Your Skin's Hidden Superpowers ✨
          </h2>
        </div>

        {step !== "loading" && (
          <ProgressSteps
            currentStep={stepMapping[step]}
            steps={['Quick Profile', 'Upload Image', 'Results']}
          />
        )}

        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {step === "consent" && (
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300">

              <div className="text-center mb-8">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  In 60 seconds, we'll whip up a custom elixir tuned to <span className="font-medium">*your*</span> world—whether it's NYC's urban grit or Paris's crisp chill. (We tap your city's air, water, and rays for ninja-level protection.) Ready to outglow your everyday?
                </p>
              </div>
              <ConsentForm onSubmit={handleConsentSubmit} initialData={consentData} />
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">

              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Upload Your Image</h2>
                <p className="text-muted-foreground">
                  Upload a clear photo of the affected skin area for accurate analysis
                </p>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToConsent}
                      data-testid="button-back-to-consent"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                      <CardTitle>Image Upload</CardTitle>
                      <CardDescription>
                        Choose one image from your device or take a photo with your camera
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ImageUpload onImagesChange={setImages} />
                  
                  {/* Start Analysis button */}
                  {images.length > 0 && (
                    <div className="pt-6 border-t flex justify-end">
                      <Button
                        size="lg"
                        onClick={handleStartAnalysis}
                        data-testid="button-start-analysis"
                        className="gap-2 h-12"
                      >
                        <Sparkles className="w-5 h-5" />
                        Start AI Analysis
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {step === "loading" && (
            <div className="animate-in fade-in duration-300">
              <AnalysisLoading />
            </div>
          )}

          {step === "results" && analysisResults && (
            <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">

              <AnalysisResults results={analysisResults} />
              <FeedbackForm />
              
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleStartOver}
                  data-testid="button-start-over"
                  className="bg-[#353535] hover:bg-[#252525] text-white font-medium px-12 h-12 transition-colors duration-200"
                >
                  Start New Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
