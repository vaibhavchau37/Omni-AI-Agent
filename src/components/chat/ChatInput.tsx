import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceButton } from "./VoiceButton";

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
    <div className="w-full">
      <div className="glass rounded-2xl p-3 shadow-lg shadow-black/20">
        <div className="flex items-end gap-3">
          <VoiceButton isListening={isListening} onToggle={onVoiceToggle} />
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-input/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all disabled:opacity-50 scrollbar-thin"
              style={{ minHeight: "48px" }}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20 disabled:shadow-none"
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-3">
        <p className="text-xs text-muted-foreground/60">
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/80 text-[10px]">Enter</kbd> to send
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/80 text-[10px]">Shift + Enter</kbd> new line
        </p>
      </div>
    </div>
  );
};