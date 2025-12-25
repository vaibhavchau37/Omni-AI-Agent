import { Target, CheckCircle, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalTrackerProps {
  goal: string;
  steps: string[];
  currentStep: number;
  isVisible: boolean;
}

export const GoalTracker = ({ goal, steps, currentStep, isVisible }: GoalTrackerProps) => {
  if (!isVisible || !goal || steps.length === 0) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Active Goal</span>
        <span className="text-xs text-muted-foreground ml-auto">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3 italic">"{goal}"</p>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-all",
                isCompleted && "text-green-400",
                isCurrent && "text-primary font-medium",
                !isCompleted && !isCurrent && "text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              ) : isCurrent ? (
                <ChevronRight className="w-3.5 h-3.5 text-primary animate-pulse" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
              <span className={cn(isCompleted && "line-through")}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};