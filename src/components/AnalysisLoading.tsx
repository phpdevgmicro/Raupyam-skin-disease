import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { sessionStorage } from "@/lib/sessionStorage";

const ROTATING_MESSAGES = [
  { id: 1, label: "Found {city}! 🎉", duration: 8000 },
  { id: 2, label: "Checking your local air quality...", duration: 10000 },
  { id: 3, label: "Analyzing weather conditions...", duration: 10000 },
  { id: 4, label: "Reading your skin's unique story...", duration: 12000 },
  { id: 5, label: "Crafting personalized recommendations...", duration: 12000 },
  { id: 6, label: "Almost there...", duration: 0 },
];

export default function AnalysisLoading() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [detectedCity, setDetectedCity] = useState<string>("");

  useEffect(() => {
    // Get detected city from session storage
    const patientData = sessionStorage.getPatientData();
    if (patientData?.city) {
      setDetectedCity(patientData.city);
    }

    // Rotate through messages automatically
    let messageTimer: ReturnType<typeof setTimeout>;
    
    const progressToNextMessage = (messageIndex: number) => {
      if (messageIndex >= ROTATING_MESSAGES.length) return;

      setCurrentMessage(messageIndex);
      
      const message = ROTATING_MESSAGES[messageIndex];
      if (message.duration > 0) {
        messageTimer = setTimeout(() => {
          progressToNextMessage(messageIndex + 1);
        }, message.duration);
      }
    };

    progressToNextMessage(0);

    return () => {
      if (messageTimer) clearTimeout(messageTimer);
    };
  }, []);

  const getCurrentMessageLabel = () => {
    const message = ROTATING_MESSAGES[currentMessage];
    if (!message) return "";
    return message.label.replace("{city}", detectedCity || "your location");
  };

  return (
    <div className="bg-background/80 backdrop-blur-sm flex items-center justify-center w-full h-full">
      <Card className="max-w-md w-full mx-4 shadow-lg animate-in zoom-in-95 duration-200">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <div className="relative mb-8" data-testid="loading-spinner">
            <div className="w-20 h-20 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-8 border-[#34a853] border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Analyzing your skin's story…
          </h3>

          <div className="flex gap-1.5 items-center mb-8">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#4385f5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#fbbe04] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#34a853] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#ea4434] rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
          </div>

          <p
            key={currentMessage}
            className="text-base md:text-lg font-medium text-primary animate-in fade-in slide-in-from-bottom-2 duration-500 text-center mb-8 min-h-[28px]"
            data-testid="progress-hint"
          >
            {getCurrentMessageLabel()}
          </p>

          <p className="text-sm md:text-base text-muted-foreground text-center">
            This may take 30-60 seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
