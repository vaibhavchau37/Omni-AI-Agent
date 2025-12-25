import { Bot, Sparkles, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/services/chatService";
import { toast } from "@/hooks/use-toast";

interface ChatHeaderProps {
  onClearSession?: () => void;
}

export const ChatHeader = ({ onClearSession }: ChatHeaderProps) => {
  const handleNewSession = () => {
    clearSession();
    if (onClearSession) {
      onClearSession();
    }
    toast({
      title: "New conversation started",
      description: "I've cleared my memory. Let's start fresh!",
    });
  };

  return (
    <header className="glass border-b border-border/50 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground flex items-center gap-2">
              OmniAgent
              <Sparkles className="w-4 h-4 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">Intelligent AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
          <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="text-xs font-medium text-green-400">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};
