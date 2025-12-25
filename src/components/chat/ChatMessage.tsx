import { cn } from "@/lib/utils";
import { Bot, User, Tag } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

const intentColors: Record<string, string> = {
  "General Question": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Information Request": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Task Execution": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Appointment / Scheduling": "bg-green-500/20 text-green-400 border-green-500/30",
  "Support / Help": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Unknown Intent": "bg-muted text-muted-foreground border-border",
};

export const ChatMessage = ({ role, content, intent }: ChatMessageProps) => {
  const isAssistant = role === "assistant";

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
        {intent && isAssistant && (
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
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isAssistant
              ? "bg-assistant-bubble border border-border/50 rounded-tl-md"
              : "bg-user-bubble border border-border/50 rounded-tr-md"
          )}
        >
          <p className="text-foreground whitespace-pre-wrap">{content}</p>
        </div>
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
