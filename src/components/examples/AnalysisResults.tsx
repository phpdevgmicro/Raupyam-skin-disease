import AnalysisResults from '../AnalysisResults';

export default function AnalysisResultsExample() {
  const mockResults = {
    severity: "moderate" as const,
    analysis: "Based on the images provided, the skin appears to show signs of acne vulgaris with moderate inflammatory lesions. The affected areas show a combination of comedones (blackheads and whiteheads) and papules, primarily concentrated in the T-zone area.\n\nThe skin also exhibits some signs of post-inflammatory hyperpigmentation, which is common with acne. The overall skin texture appears to be combination type with some areas showing increased sebum production.",
    recommendations: [
      "Use a gentle, non-comedogenic cleanser twice daily to maintain skin hygiene without stripping natural oils",
      "Apply a topical treatment containing salicylic acid or benzoyl peroxide to affected areas",
      "Consider incorporating a retinoid into your nighttime routine to help prevent clogged pores",
      "Use a broad-spectrum SPF 30+ sunscreen daily to prevent further hyperpigmentation",
      "Avoid picking or squeezing lesions to minimize scarring and inflammation",
      "Consult with a dermatologist for personalized treatment options, which may include prescription medications"
    ]
  };

  return <AnalysisResults results={mockResults} />;
}
