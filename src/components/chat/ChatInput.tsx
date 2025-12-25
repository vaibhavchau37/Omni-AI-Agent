import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
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
    <div className="glass rounded-2xl p-4">
      <div className="flex items-end gap-3">
        <VoiceButton isListening={isListening} onToggle={onVoiceToggle} />
        
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or use voice..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 scrollbar-thin"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="h-12 w-12 rounded-xl shadow-lg shadow-primary/25"
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Press Enter to send • Shift + Enter for new line
      </p>
    </div>
  );
};
