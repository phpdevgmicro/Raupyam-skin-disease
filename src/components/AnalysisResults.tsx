import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { AnalysisResponse } from "@/types/schema";
import DOMPurify from "dompurify";
import { useMemo } from "react";

interface AnalysisResultsProps {
  results: AnalysisResponse;
}

export default function AnalysisResults({ results }: AnalysisResultsProps) {
  const sanitizedAnalysis = useMemo(() => {
    return DOMPurify.sanitize(results.analysis, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "small",
        "span",
        "div",
      ],
      ALLOWED_ATTR: ["class"],
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false,
    });
  }, [results.analysis]);
  const severityConfig = {
    mild: {
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      borderColor: "border-green-200 dark:border-green-800",
      label: "Mild Condition",
    },
    moderate: {
      icon: AlertTriangle,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      label: "Moderate Condition",
    },
    severe: {
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
      borderColor: "border-red-200 dark:border-red-800",
      label: "Severe Condition",
    },
  };

  const config = severityConfig[results.severity];
  const SeverityIcon = config.icon;

  return (
    <Card data-testid="card-analysis-results">
      <CardHeader>
        <CardTitle className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary" />
          AI Analysis Results
        </CardTitle>
        <CardDescription className="mt-3 text-base">
          Based on the images and information you provided
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-2xl font-bold mb-5 flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            Detailed Analysis
          </h3>
          <div className="bg-muted/30 rounded-lg p-8">
            <div
              className="text-foreground leading-relaxed prose prose-base max-w-none dark:prose-invert [&_p]:text-base [&_p]:leading-7 [&_p]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:text-base [&_li]:leading-7"
              data-testid="text-analysis"
              dangerouslySetInnerHTML={{ __html: sanitizedAnalysis }}
            />
          </div>
        </div>

        {results.recommendations.length > 0 && (
          <div className="pt-2">
            <h3 className="text-2xl font-bold mb-5 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Recommendations
            </h3>
            <div className="space-y-4">
              {results.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-card border rounded-lg p-5 hover-elevate"
                  data-testid={`recommendation-${index}`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-lg">
                    {index + 1}
                  </div>
                  <p className="text-base leading-7 flex-1 pt-1">
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
