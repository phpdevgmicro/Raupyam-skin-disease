import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { BulletIcon } from "@/components/BulletIcon";
import { sessionStorage } from "@/lib/sessionStorage";

const PROGRESS_STEPS = [
  { id: 1, label: "Pulling your location…", duration: 2000 },
  { id: 2, label: "Found {city} 🌆", duration: 1500 },
  { id: 3, label: "Pulling local AQI and humidity levels…", duration: 3000 },
  { id: 4, label: "Calibrating your glow magic", duration: 4000 },
  { id: 5, label: "Almost done — crafting your personalized story…", duration: 0 },
];

export default function AnalysisLoading() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [detectedCity, setDetectedCity] = useState<string>("");

  useEffect(() => {
    // Get detected city from session storage
    const patientData = sessionStorage.getPatientData();
    if (patientData?.city) {
      setDetectedCity(patientData.city);
    }

    // Progress through steps automatically
    let stepTimer: ReturnType<typeof setTimeout>;
    
    const progressToNextStep = (stepIndex: number) => {
      if (stepIndex >= PROGRESS_STEPS.length) return;

      setCurrentStep(stepIndex);
      
      const step = PROGRESS_STEPS[stepIndex];
      if (step.duration > 0) {
        stepTimer = setTimeout(() => {
          setCompletedSteps(prev => [...prev, step.id]);
          progressToNextStep(stepIndex + 1);
        }, step.duration);
      }
    };

    progressToNextStep(0);

    return () => {
      if (stepTimer) clearTimeout(stepTimer);
    };
  }, []);

  const getCurrentStepLabel = () => {
    const step = PROGRESS_STEPS[currentStep];
    if (!step) return "";
    return step.label.replace("{city}", detectedCity || "your location");
  };

  return (
    <div className="bg-background/80 backdrop-blur-sm flex items-center justify-center w-full h-full">
      <Card className="max-w-md w-full mx-4 shadow-lg animate-in zoom-in-95 duration-200">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <div className="relative mb-8" data-testid="loading-spinner">
            <div className="w-20 h-20 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-8 border-[#34a853] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3 text-center">
            Analyzing your skin's story…
          </h3>
          <p className="text-base md:text-lg text-customText text-center mb-4">
            We're decoding your unique glow — your light, tone, and texture.
          </p>
          <p className="text-sm md:text-base text-muted-foreground text-center mb-8 flex items-center gap-2 justify-center">
            This will take just a moment of magic ✨ <BulletIcon className="w-4 h-4" />
          </p>

          <div className="min-h-[80px] mb-6 w-full">
            <p
              key={currentStep}
              className="text-base md:text-lg font-medium text-primary animate-in fade-in slide-in-from-bottom-2 duration-500 text-center mb-4"
              data-testid="progress-hint"
            >
              {getCurrentStepLabel()}
            </p>
            
            {/* Progress steps list */}
            <div className="space-y-2 text-left">
              {PROGRESS_STEPS.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = currentStep === index;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
                      isCurrent ? "opacity-100" : isCompleted ? "opacity-70" : "opacity-30"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        isCurrent ? "border-primary" : "border-muted-foreground"
                      }`} />
                    )}
                    <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
                      {step.label.replace("{city}", detectedCity || "your location")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-1.5 items-center mb-6">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#4385f5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#fbbe04] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#34a853] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#ea4434] rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
          </div>

          <p className="text-base md:text-lg font-semibold text-primary mb-2 text-center flex items-center justify-center gap-2">
            Don't leave! We're working our magic… ✨ <BulletIcon className="w-4 h-4" />
          </p>
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            This may take 30-60 seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
