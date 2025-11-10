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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [analysisResults, setAnalysisResults] =
    useState<AnalysisResponse | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { toast } = useToast();

  const transitionToStep = (newStep: Step) => {
    setIsTransitioning(true);

    setStep(newStep);
    setIsTransitioning(false);
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

    // Use transition for smooth loading popup appearance
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("loading");
      setIsTransitioning(false);
    }, 200);

    try {
      const results = await analyzeImages(images);

      if (results.msg === "success") {
        setAnalysisResults({
          analysis: results.result || results.notice,
          recommendations: [],
          severity: "mild",
        });
        transitionToStep("results");
      } else {
        throw new Error(results.notice || "Analysis failed");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error analyzing your images. Please try again.",
        variant: "destructive",
      });
      transitionToStep("upload");
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

  const getTaglineContent = () => {
    switch (step) {
      case "consent":
        return {
          title: "Unlock Your Skin's Global Edge ✨",
          description:
            "In 60 seconds, we'll whip up a custom elixir tuned to your world—whether it's NYC's urban grit or Paris's crisp chill. We tap your city's air, water, and rays for ninja-level protection. Ready to outglow your everyday?",
        };
      case "upload":
      case "loading":
        return {
          title: "Show Us Your Glow Up Close 📸",
          description:
            "Upload a clear photo of your skin — no filters, no pressure. This helps us read your tone, texture, and vibe to fine-tune your routine for real-world results.",
        };
      case "results":
        return {
          title: "Meet Your World-Ready Routine ✨",
          description:
            "Here's your personalized blend — made for your city, your climate, your glow. Every drop adapts to your world so you can outshine it daily.",
        };
      default:
        return {
          title: "Unlock Your Skin's Global Edge ✨",
          description:
            "In 60 seconds, we'll whip up a custom elixir tuned to your world—whether it's NYC's urban grit or Paris's crisp chill. We tap your city's air, water, and rays for ninja-level protection. Ready to outglow your everyday?",
        };
    }
  };

  const taglineContent = getTaglineContent();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-customText leading-tight mb-4">
            {taglineContent.title}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-customText/80 mt-2 max-w-3xl mx-auto leading-relaxed">
            {taglineContent.description}
          </p>
        </div>

        {step !== "loading" && (
          <ProgressSteps
            currentStep={stepMapping[step]}
            steps={["Quick Profile", "Upload Image", "Results"]}
          />
        )}

        <div
          className={`transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {step === "consent" && (
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
              <ConsentForm
                onSubmit={handleConsentSubmit}
                initialData={consentData}
              />
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
              <ImageUpload
                onImagesChange={setImages}
                onStartAnalysis={
                  images.length > 0 ? handleStartAnalysis : undefined
                }
              />
            </div>
          )}

          {step === "loading" && (
            <div
              className={`fixed inset-0 z-50 transition-opacity duration-500 ease-in-out ${
                step === "loading"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            >
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
                  className="bg-[#353535] hover:bg-[#252525] text-white font-medium px-12 min-h-12 md:h-14 shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
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
