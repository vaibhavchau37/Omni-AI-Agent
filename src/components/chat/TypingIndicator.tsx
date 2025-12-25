import { Bot } from "lucide-react";

export const TypingIndicator = () => {
  return (
    <div className="flex gap-3 fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-assistant-bubble border border-border/50 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
};
