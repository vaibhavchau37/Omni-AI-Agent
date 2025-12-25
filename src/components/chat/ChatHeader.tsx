import { Sparkles, Zap, RotateCcw, BarChart3, Lightbulb, Settings2 } from "lucide-react";
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
}

export const ChatHeader = ({ 
  onClearSession, 
  onOpenAnalytics, 
  explainMode, 
  onExplainModeToggle,
}: ChatHeaderProps) => {
  const handleNewSession = () => {
    clearSession();
    if (onClearSession) {
      onClearSession();
    }
    toast({
      title: "Conversation reset",
      description: "Ready for a new session!",
    });
  };

  return (
    <header className="glass border-b border-border/40 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/20 flex items-center justify-center glow-primary group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              OmniAgent
              <Sparkles className="w-4 h-4 text-primary/80" />
            </h1>
            <p className="text-xs text-muted-foreground">Multi-Agent AI Assistant</p>
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
                  "h-9 px-3 text-muted-foreground hover:text-foreground gap-2 rounded-xl",
                  explainMode && "text-primary bg-primary/10 hover:bg-primary/15"
                )}
              >
                <Lightbulb className={cn("w-4 h-4", explainMode && "fill-primary/30")} />
                <span className="hidden sm:inline text-xs font-medium">Explain</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show AI reasoning</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAnalytics}
                className="h-9 px-3 text-muted-foreground hover:text-foreground gap-2 rounded-xl"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Analytics</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View performance metrics</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSession}
                className="h-9 px-3 text-muted-foreground hover:text-foreground gap-2 rounded-xl"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start fresh conversation</p>
            </TooltipContent>
          </Tooltip>

          <div className="ml-2 h-6 w-px bg-border/50" />

          <div className="ml-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="text-xs font-medium text-success flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};