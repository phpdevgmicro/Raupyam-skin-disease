import { Check } from "lucide-react";

interface ProgressStepsProps {
  currentStep: number;
  steps: string[];
}

export default function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="w-full flex justify-center mb-8 md:mb-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;

            return (
              <div key={index} className="flex items-start" style={{ flex: index < steps.length - 1 ? '1' : '0 0 auto' }}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ease-in-out z-10 bg-background ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                        ? "border-primary text-primary bg-primary/10 ring-2 ring-primary/20 ring-offset-2"
                        : "border-gray-300 dark:border-gray-600 text-muted-foreground"
                    }`}
                    data-testid={`step-${stepNumber}`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 md:w-6 md:h-6 animate-in fade-in zoom-in duration-300" />
                    ) : (
                      <span className="font-semibold text-sm md:text-base">{stepNumber}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs md:text-sm mt-2 text-center font-medium transition-colors duration-200 whitespace-nowrap ${
                      isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mt-5 md:mt-6 mx-2 md:mx-3 transition-all duration-500 ${
                      isCompleted ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
