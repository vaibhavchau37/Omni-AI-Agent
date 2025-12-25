import { Target, CheckCircle, Circle, ChevronRight, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutedAction {
  step: number;
  action: string;
  status: string;
  result: string;
}

interface GoalTrackerProps {
  goal: string;
  steps: string[];
  currentStep: number;
  isVisible: boolean;
  executedActions?: ExecutedAction[];
  isAutonomous?: boolean;
}

const actionIcons: Record<string, string> = {
  SEARCH: "🔍",
  CALENDAR: "📅",
  EMAIL: "📧",
  TASK: "✅",
  FILE: "📁",
  BROWSER: "🌐",
  CALCULATE: "🔢",
  ANALYZE: "📊",
  NOTES: "📝",
};

export const GoalTracker = ({ 
  goal, 
  steps, 
  currentStep, 
  isVisible, 
  executedActions = [],
  isAutonomous = false 
}: GoalTrackerProps) => {
  if (!isVisible || !goal || steps.length === 0) return null;

  const completedSteps = executedActions.filter(a => a.status === "completed").length;
  const progress = ((completedSteps || currentStep + 1) / steps.length) * 100;

  return (
    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {isAutonomous ? "🤖 Autonomous Goal Execution" : "Active Goal"}
        </span>
        {isAutonomous && (
          <span className="ml-2 px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Auto-Execute
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {completedSteps || currentStep + 1} of {steps.length}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3 italic">"{goal}"</p>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-3 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            isAutonomous 
              ? "bg-gradient-to-r from-green-500 to-emerald-400" 
              : "bg-gradient-to-r from-primary to-accent"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Steps with action status */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const executedAction = executedActions.find(a => a.step === index + 1);
          const isCompleted = executedAction?.status === "completed" || index < currentStep;
          const isCurrent = !executedAction && index === currentStep;
          const isPending = executedAction?.status === "pending";
          const actionIcon = executedAction?.action ? actionIcons[executedAction.action] || "⚡" : null;
          
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-all p-2 rounded-lg",
                isCompleted && "text-green-400 bg-green-500/5",
                isCurrent && "text-primary font-medium bg-primary/5",
                isPending && "text-yellow-400 bg-yellow-500/5",
                !isCompleted && !isCurrent && !isPending && "text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              ) : isCurrent ? (
                <ChevronRight className="w-3.5 h-3.5 text-primary animate-pulse flex-shrink-0" />
              ) : isPending ? (
                <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse flex-shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              
              <span className={cn(isCompleted && "line-through")}>
                {actionIcon && <span className="mr-1">{actionIcon}</span>}
                {step}
              </span>
              
              {executedAction?.action && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                  {executedAction.action}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Completion summary */}
      {completedSteps === steps.length && (
        <div className="mt-3 pt-3 border-t border-border/50 text-center">
          <span className="text-xs text-green-400 font-medium">
            🎉 Goal completed successfully!
          </span>
        </div>
      )}
    </div>
  );
};
