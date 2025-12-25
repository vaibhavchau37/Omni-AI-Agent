import { Wrench, Search, Calendar, Mail, ListTodo, Calculator, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolIndicatorProps {
  tool: string | null;
  reason?: string;
}

const toolConfig: Record<string, { icon: typeof Wrench; color: string; label: string }> = {
  search: { icon: Search, color: "text-blue-400", label: "Search" },
  calendar: { icon: Calendar, color: "text-green-400", label: "Calendar" },
  email: { icon: Mail, color: "text-orange-400", label: "Email" },
  task: { icon: ListTodo, color: "text-purple-400", label: "Tasks" },
  calculate: { icon: Calculator, color: "text-pink-400", label: "Calculate" },
  analyze: { icon: BarChart3, color: "text-cyan-400", label: "Analyze" },
};

export const ToolIndicator = ({ tool, reason }: ToolIndicatorProps) => {
  if (!tool) return null;

  const config = toolConfig[tool] || { icon: Wrench, color: "text-muted-foreground", label: tool };
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 border border-border/50 text-xs">
      <Icon className={cn("w-3 h-3", config.color)} />
      <span className={cn("font-medium", config.color)}>{config.label}</span>
      {reason && (
        <span className="text-muted-foreground ml-1 hidden sm:inline">
          - {reason.substring(0, 40)}...
        </span>
      )}
    </div>
  );
};