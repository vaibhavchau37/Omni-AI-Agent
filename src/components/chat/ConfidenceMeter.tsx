import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  level: "high" | "medium" | "low";
  score?: number;
}

const confidenceConfig = {
  high: {
    icon: ShieldCheck,
    label: "High Confidence",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    barColor: "bg-green-500",
    percentage: 90,
  },
  medium: {
    icon: ShieldQuestion,
    label: "Medium Confidence",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    barColor: "bg-yellow-500",
    percentage: 60,
  },
  low: {
    icon: ShieldAlert,
    label: "Low Confidence",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    barColor: "bg-red-500",
    percentage: 30,
  },
};

export const ConfidenceMeter = ({ level, score }: ConfidenceMeterProps) => {
  const config = confidenceConfig[level];
  const Icon = config.icon;
  const displayPercentage = score ?? config.percentage;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border",
      config.bgColor,
      config.borderColor
    )}>
      <Icon className={cn("w-3 h-3", config.color)} />
      <span className={cn("font-medium", config.color)}>{config.label}</span>
      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden ml-1">
        <div 
          className={cn("h-full rounded-full transition-all", config.barColor)}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
    </div>
  );
};
