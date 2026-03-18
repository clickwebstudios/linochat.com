import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const DEFAULT_STEPS = [
  'Checking session',
  'Verifying credentials',
  'Loading profile',
];

interface StepLoaderProps {
  steps?: string[];
  className?: string;
}

export function StepLoader({ steps = DEFAULT_STEPS, className = '' }: StepLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      <div className="flex items-center gap-2">
        {steps.map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                index < currentStep
                  ? 'bg-primary border-primary text-primary-foreground'
                  : index === currentStep
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/50 text-muted-foreground'
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-0.5 transition-colors duration-300 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {steps[currentStep]}
          <span className="animate-pulse">...</span>
        </p>
      </div>
    </div>
  );
}
