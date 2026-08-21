import { Sparkles, Zap, RotateCcw, BarChart3, Lightbulb, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/services/chatService";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onClearSession?: () => void;
  onOpenAnalytics?: () => void;
  explainMode?: boolean;
  onExplainModeToggle?: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const ChatHeader = ({ 
  onClearSession, 
  onOpenAnalytics, 
  explainMode, 
  onExplainModeToggle,
  onOpenHistory,
  historyCount = 0,
}: ChatHeaderProps) => {

  const handleNewSession = () => {
    clearSession();
    if (onClearSession) {
      onClearSession();
    }
    toast({
      title: "Conversation reset",
      description: "Ready for a new session",
    });
  };

  return (
    <header className="border-b border-border/40 px-4 py-3 bg-card/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 border border-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground flex items-center gap-1.5">
              OmniAgent
              <Sparkles className="w-3.5 h-3.5 text-primary/70" />
            </h1>
            <p className="text-[10px] text-muted-foreground">Multi-Agent AI</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExplainModeToggle}
                className={cn(
                  "h-8 px-2.5 gap-1.5 text-xs rounded-lg",
                  explainMode && "text-primary bg-primary/10"
                )}
              >
                <Lightbulb className={cn("w-3.5 h-3.5", explainMode && "fill-primary/30")} />
                <span className="hidden sm:inline">Explain</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show AI reasoning</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAnalytics}
                className="h-8 px-2.5 gap-1.5 text-xs rounded-lg"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View metrics</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSession}
                className="h-8 px-2.5 gap-1.5 text-xs rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start fresh</TooltipContent>
          </Tooltip>

          <div className="ml-1 px-2 py-1 rounded-full bg-success/10 border border-success/20">
            <span className="text-[10px] font-medium text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};