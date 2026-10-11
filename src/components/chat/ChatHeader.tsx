import { Sparkles, Zap, RotateCcw, BarChart3, Lightbulb, PanelLeft } from "lucide-react";
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
  accountSlot?: React.ReactNode;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const ChatHeader = ({ 
  onClearSession, 
  onOpenAnalytics, 
  explainMode, 
  onExplainModeToggle,
  accountSlot,
  sidebarOpen = true,
  onToggleSidebar,
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
    <header className="relative shrink-0 border-b border-border/40 px-2.5 py-2 sm:px-4 sm:py-3 bg-card/60 backdrop-blur-md">
      <div className="absolute inset-x-0 bottom-0 h-px warm-rule opacity-60" />
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle chats sidebar"
                onClick={onToggleSidebar}
                className="h-11 w-11 shrink-0 sm:h-8 sm:w-8"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chats and settings</TooltipContent>
          </Tooltip>
          <div className="relative hidden sm:block">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 border border-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
          </div>
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-base">
              OmniAgent
              <Sparkles className="w-3.5 h-3.5 text-primary/70" />
            </h1>
            <p className="hidden text-[10px] text-muted-foreground sm:block">Your everyday AI · हिंदी & English</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0 sm:gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExplainModeToggle}
                className={cn(
                  "h-11 w-10 px-1.5 gap-1.5 text-xs rounded-lg lg:h-8 lg:w-auto lg:px-2.5",
                  explainMode && "text-primary bg-primary/10"
                )}
              >
                <Lightbulb className={cn("w-3.5 h-3.5", explainMode && "fill-primary/30")} />
                <span className="hidden lg:inline">Explain</span>
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
                className="h-11 w-10 px-1.5 gap-1.5 text-xs rounded-lg lg:h-8 lg:w-auto lg:px-2.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Analytics</span>
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
                className="h-11 w-10 px-1.5 gap-1.5 text-xs rounded-lg lg:h-8 lg:w-auto lg:px-2.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start fresh</TooltipContent>
          </Tooltip>

          <div className="hidden sm:block ml-1 px-2 py-1 rounded-full bg-success/10 border border-success/20">
            <span className="text-[10px] font-medium text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Online
            </span>
          </div>
          {accountSlot}
        </div>
      </div>
    </header>
  );
};