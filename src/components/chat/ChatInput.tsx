import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isListening: boolean;
  onVoiceToggle: () => void;
  disabled?: boolean;
}

export const ChatInput = ({
  onSend,
  isListening,
  onVoiceToggle,
  disabled,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-end gap-2 p-2 rounded-2xl bg-card border border-border/60 shadow-lg">
        {/* Voice Button */}
        <Button
          onClick={onVoiceToggle}
          size="icon"
          className={cn(
            "h-10 w-10 rounded-xl shrink-0 transition-all",
            isListening 
              ? "bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        
        {/* Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 scrollbar-thin"
          style={{ minHeight: "40px" }}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          size="icon"
          className="h-10 w-10 rounded-xl shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      
      <p className="text-center text-[10px] text-muted-foreground/50">
        <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70">Enter</kbd> send
        <span className="mx-1.5">•</span>
        <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70">Shift+Enter</kbd> new line
      </p>
    </div>
  );
};