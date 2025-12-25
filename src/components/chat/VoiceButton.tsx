import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
}

export const VoiceButton = ({ isListening, onToggle }: VoiceButtonProps) => {
  return (
    <div className="relative">
      {isListening && (
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      )}
      <Button
        onClick={onToggle}
        className={cn(
          "relative z-10 h-14 w-14 rounded-full transition-all duration-300 glow-primary hover:scale-105 active:scale-95",
          isListening && "bg-destructive glow-pulse"
        )}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </Button>
      
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 items-end h-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full voice-wave"
              style={{
                height: "100%",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
