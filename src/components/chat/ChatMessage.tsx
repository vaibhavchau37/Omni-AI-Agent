import { cn } from "@/lib/utils";
import { Bot, User, Tag, Volume2, Heart, Frown, Smile, Meh, Clock, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { EscalationBanner } from "./EscalationBanner";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  showEscalation?: boolean;
  selectedTool?: string;
  toolReason?: string;
  reasoning?: string;
  retryCount?: number;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  timestamp?: number;
  isStreaming?: boolean;
}

const intentColors: Record<string, string> = {
  "General Question": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Information Request": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "Task Execution": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "Appointment / Scheduling": "bg-green-500/15 text-green-400 border-green-500/25",
  "Support / Help": "bg-pink-500/15 text-pink-400 border-pink-500/25",
  "Unknown Intent": "bg-muted/50 text-muted-foreground border-border/50",
};

const emotionConfig = {
  positive: { icon: Smile, color: "text-green-400", bg: "bg-green-500/10", label: "Positive" },
  neutral: { icon: Meh, color: "text-blue-400", bg: "bg-blue-500/10", label: "Neutral" },
  negative: { icon: Frown, color: "text-orange-400", bg: "bg-orange-500/10", label: "Concerned" },
  frustrated: { icon: Heart, color: "text-red-400", bg: "bg-red-500/10", label: "Needs Care" },
};

export const ChatMessage = ({ 
  role, 
  content, 
  intent, 
  confidence,
  emotion,
  showEscalation,
  selectedTool,
  reasoning,
  onSpeak, 
  isSpeaking,
  timestamp,
  isStreaming = false,
}: ChatMessageProps) => {
  const isAssistant = role === "assistant";
  const EmotionIcon = emotion ? emotionConfig[emotion].icon : null;
  const displayTime = timestamp ? format(new Date(timestamp), "h:mm a") : format(new Date(), "h:mm a");

  const handleEscalate = () => {
    toast({
      title: "Escalation Requested",
      description: "A human support agent will be connected shortly.",
    });
  };

  return (
    <div className={cn("flex gap-3 fade-in group", isAssistant ? "justify-start" : "justify-end")}>
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
          </div>
        </div>
      )}
      
      <div className={cn("flex flex-col gap-2 max-w-[80%]", !isAssistant && "items-end")}>
        {/* Header: Name and Time */}
        <div className={cn("flex items-center gap-2 px-1", !isAssistant && "flex-row-reverse")}>
          <span className="text-xs font-medium text-foreground/80">
            {isAssistant ? "OmniAgent" : "You"}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">{displayTime}</span>
          </div>
        </div>

        {/* Intent, Confidence, Tool badges for assistant */}
        {isAssistant && (intent || confidence || selectedTool) && (
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            {intent && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium",
                intentColors[intent] || intentColors["Unknown Intent"]
              )}>
                <Tag className="w-2.5 h-2.5" />
                {intent}
              </span>
            )}
            {confidence && <ConfidenceMeter level={confidence} />}
            {selectedTool && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground border border-accent/20 font-medium">
                <Wrench className="w-2.5 h-2.5" />
                {selectedTool}
              </span>
            )}
          </div>
        )}

        {/* User emotion indicator */}
        {!isAssistant && emotion && EmotionIcon && (
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
            emotionConfig[emotion].bg,
            emotionConfig[emotion].color
          )}>
            <EmotionIcon className="w-3 h-3" />
            {emotionConfig[emotion].label}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md transition-all",
            isAssistant
              ? "bg-card border border-border/50 rounded-tl-sm"
              : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm shadow-primary/20"
          )}
        >
          <p className={cn(
            "whitespace-pre-wrap",
            isAssistant ? "text-foreground" : "text-primary-foreground"
          )}>
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-primary/70 animate-pulse rounded-sm" />
            )}
          </p>

          {/* Reasoning section */}
          {isAssistant && reasoning && (
            <div className="mt-3 pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Sparkles className="w-3 h-3 text-primary/60" />
                <span className="font-medium">AI Reasoning</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
            </div>
          )}
          
          {/* Listen button */}
          {isAssistant && onSpeak && !isStreaming && (
            <div className="mt-3 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSpeak}
                className={cn(
                  "h-7 px-2.5 text-xs gap-1.5 rounded-lg hover:bg-primary/10",
                  isSpeaking && "text-primary bg-primary/10"
                )}
              >
                <Volume2 className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                {isSpeaking ? "Speaking..." : "Listen"}
              </Button>
            </div>
          )}
        </div>

        {/* Escalation banner */}
        {isAssistant && showEscalation && (
          <EscalationBanner 
            onEscalate={handleEscalate}
            reason="My confidence is low on this topic."
          />
        )}
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-secondary to-secondary/60 border border-border/50 flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-foreground/70" />
          </div>
        </div>
      )}
    </div>
  );
};