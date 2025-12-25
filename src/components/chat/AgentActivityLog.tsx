import { Brain, Wrench, HeadphonesIcon, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentActivity {
  id: string;
  agent: "planner" | "executor" | "support" | "evaluator";
  action: string;
  status: "running" | "complete";
  timestamp: number;
}

interface AgentActivityLogProps {
  activities: AgentActivity[];
  isVisible: boolean;
}

const agentConfig = {
  planner: {
    icon: Brain,
    name: "Planner Agent",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  executor: {
    icon: Wrench,
    name: "Executor Agent",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  support: {
    icon: HeadphonesIcon,
    name: "Support Agent",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  evaluator: {
    icon: CheckCircle,
    name: "Evaluator Agent",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
};

export const AgentActivityLog = ({ activities, isVisible }: AgentActivityLogProps) => {
  if (!isVisible || activities.length === 0) return null;

  return (
    <div className="mb-4 p-3 rounded-xl bg-secondary/30 border border-border/50 fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground">Agent Activity</span>
      </div>
      
      <div className="space-y-2">
        {activities.map((activity) => {
          const config = agentConfig[activity.agent];
          const Icon = config.icon;
          
          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all",
                config.bgColor,
                activity.status === "running" && "animate-pulse"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", config.color)} />
              <span className={cn("text-xs font-medium", config.color)}>
                {config.name}
              </span>
              <span className="text-xs text-muted-foreground flex-1">
                {activity.action}
              </span>
              {activity.status === "running" ? (
                <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 text-green-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
