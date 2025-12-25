import { cn } from "@/lib/utils";
import { Bot, User, Tag, Volume2, Heart, Frown, Smile, Meh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { EscalationBanner } from "./EscalationBanner";
import { toast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  showEscalation?: boolean;
  onSpeak?: () => void;
  isSpeaking?: boolean;
}

const intentColors: Record<string, string> = {
  "General Question": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Information Request": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Task Execution": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Appointment / Scheduling": "bg-green-500/20 text-green-400 border-green-500/30",
  "Support / Help": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Unknown Intent": "bg-muted text-muted-foreground border-border",
};

const emotionConfig = {
  positive: { icon: Smile, color: "text-green-400", label: "Positive" },
  neutral: { icon: Meh, color: "text-blue-400", label: "Neutral" },
  negative: { icon: Frown, color: "text-orange-400", label: "Concerned" },
  frustrated: { icon: Heart, color: "text-red-400", label: "Needs Care" },
};

export const ChatMessage = ({ 
  role, 
  content, 
  intent, 
  confidence,
  emotion,
  showEscalation,
  onSpeak, 
  isSpeaking 
}: ChatMessageProps) => {
  const isAssistant = role === "assistant";
  const EmotionIcon = emotion ? emotionConfig[emotion].icon : null;

  const handleEscalate = () => {
    toast({
      title: "Escalation Requested",
      description: "A human support agent will be connected shortly.",
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3 fade-in",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className="flex flex-col gap-1.5 max-w-[75%]">
        {/* Intent and Emotion badges for assistant */}
        {isAssistant && (intent || emotion) && (
          <div className="flex items-center gap-2 flex-wrap">
            {intent && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  intentColors[intent] || intentColors["Unknown Intent"]
                )}>
                  {intent}
                </span>
              </div>
            )}
            {confidence && (
              <ConfidenceMeter level={confidence} />
            )}
          </div>
        )}

        {/* User emotion indicator */}
        {!isAssistant && emotion && EmotionIcon && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className={cn("text-xs", emotionConfig[emotion].color)}>
              {emotionConfig[emotion].label}
            </span>
            <EmotionIcon className={cn("w-3.5 h-3.5", emotionConfig[emotion].color)} />
          </div>
        )}

        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isAssistant
              ? "bg-assistant-bubble border border-border/50 rounded-tl-md"
              : "bg-user-bubble border border-border/50 rounded-tr-md"
          )}
        >
          <p className="text-foreground whitespace-pre-wrap">{content}</p>
          
          {isAssistant && onSpeak && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSpeak}
                className={cn(
                  "h-7 px-2 text-xs gap-1.5",
                  isSpeaking && "text-primary"
                )}
              >
                <Volume2 className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                {isSpeaking ? "Speaking..." : "Listen"}
              </Button>
            </div>
          )}
        </div>

        {/* Escalation banner for low confidence */}
        {isAssistant && showEscalation && (
          <EscalationBanner 
            onEscalate={handleEscalate}
            reason="My confidence is low on this topic."
          />
        )}
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
