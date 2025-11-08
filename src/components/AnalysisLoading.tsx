import { Card, CardContent } from "@/components/ui/card";

export default function AnalysisLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6">
          <div className="relative mb-8" data-testid="loading-spinner">
            <div className="w-24 h-24 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-8 border-[#34a853] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Analyzing your skin...</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Our AI is carefully examining your image
          </p>
          <div className="flex gap-1.5 items-center">
            <div className="w-2 h-2 bg-[#4385f5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#fbbe04] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#34a853] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-2 bg-[#ea4434] rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-8">
            This may take 30-60 seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
