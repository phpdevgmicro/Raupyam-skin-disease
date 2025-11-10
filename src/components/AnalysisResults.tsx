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
    // First sanitize the HTML
    const sanitized = DOMPurify.sanitize(results.analysis, {
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
    
    // Remove bullets by converting ul/ol lists to plain divs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;
    
    // Convert all <li> elements to <p> elements
    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(li => {
      const p = document.createElement('p');
      p.innerHTML = li.innerHTML;
      p.className = li.className;
      li.parentNode?.replaceChild(p, li);
    });
    
    // Remove <ul> and <ol> wrapper tags but keep their content
    const lists = tempDiv.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const parent = list.parentNode;
      while (list.firstChild) {
        parent?.insertBefore(list.firstChild, list);
      }
      parent?.removeChild(list);
    });
    
    return tempDiv.innerHTML;
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
      <CardContent className="space-y-10">
        <div>         
          <div className="bg-muted/30 rounded-lg p-6 md:p-8">
            <div
              className="text-customText leading-relaxed prose prose-base md:prose-lg max-w-none dark:prose-invert [&_p]:text-base [&_p]:md:text-lg [&_p]:leading-relaxed [&_p]:mb-5 [&_p]:text-left [&_h1]:text-2xl [&_h1]:md:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-left [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:text-left [&_h3]:text-lg [&_h3]:md:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:text-left [&_strong]:font-semibold [&_strong]:text-customText [&_span]:text-base [&_span]:md:text-lg [&_span]:leading-relaxed [&_small]:text-sm [&_small]:leading-relaxed [&_em]:text-base [&_em]:md:text-lg [&_u]:text-base [&_u]:md:text-lg [&_div]:text-base [&_div]:md:text-lg [&_div]:leading-relaxed [&_div]:text-left [&_ul]:list-none [&_ul]:pl-0 [&_ol]:list-none [&_ol]:pl-0 [&_li]:list-none [&_li]:pl-0"
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
                  className="flex items-start gap-5 bg-card border rounded-lg p-6 md:p-7 hover-elevate"
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
