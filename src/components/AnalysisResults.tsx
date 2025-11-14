import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResponse } from "@/types/schema";
import DOMPurify from "dompurify";
import { useMemo } from "react";

interface AnalysisResultsProps {
  results: AnalysisResponse;
}

export default function AnalysisResults({ results }: AnalysisResultsProps) {
  // Just sanitize the HTML from backend for security - display as-is
  const sanitizedAnalysis = useMemo(() => {
    return DOMPurify.sanitize(results.analysis);
  }, [results.analysis]);

  return (
    <Card data-testid="card-analysis-results">
      <CardContent className="space-y-6 md:space-y-10">
        <div>
          <div className="bg-muted/30 rounded-lg p-4 md:p-8">
            <div
              className="text-customText leading-relaxed prose prose-base md:prose-lg max-w-none dark:prose-invert results-div-main"
              style={{ fontFamily: 'var(--font-body)' }}
              data-testid="text-analysis"
              dangerouslySetInnerHTML={{ __html: sanitizedAnalysis }}
            />
          </div>
        </div>

        {results.recommendations.length > 0 && (
          <div className="pt-2">
            <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
              <div className="w-1 h-7 bg-primary rounded-full" />
              Recommendations
            </h3>
            <div className="space-y-5">
              {results.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 md:gap-5 bg-card border rounded-lg p-4 md:p-7 hover-elevate"
                  data-testid={`recommendation-${index}`}
                >
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-lg md:text-xl">
                    {index + 1}
                  </div>
                  <p className="text-base md:text-lg leading-relaxed flex-1 pt-1" style={{ fontFamily: 'var(--font-body)' }}>
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
