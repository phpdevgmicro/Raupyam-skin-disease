import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const PROGRESS_HINTS = [
  "Reading your glow…",
  "Mapping your world…",
  "Crafting your custom blend…"
];

export default function AnalysisLoading() {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % PROGRESS_HINTS.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

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
          <p className="text-sm md:text-base text-muted-foreground text-center mb-8 flex items-center gap-2">
            This will take just a moment of magic <Sparkles className="w-4 h-4 text-[#fbbe04]" />
          </p>

          <div className="min-h-[32px] mb-6 flex items-center justify-center">
            <p
              key={currentHintIndex}
              className="text-base md:text-lg font-medium text-primary animate-in fade-in slide-in-from-bottom-2 duration-500"
              data-testid="progress-hint"
            >
              {PROGRESS_HINTS[currentHintIndex]}
            </p>
          </div>

          <div className="flex gap-1.5 items-center mb-6">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#4385f5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#fbbe04] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#34a853] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#ea4434] rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground">
            This may take 30-60 seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
