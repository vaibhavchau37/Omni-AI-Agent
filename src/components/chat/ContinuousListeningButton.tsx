import { Mic, MicOff, Radio, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContinuousListeningButtonProps {
  isEnabled: boolean;
  isListening: boolean;
  isWakeWordDetected: boolean;
  onToggle: () => void;
  language: "en" | "hi";
}

export const ContinuousListeningButton = ({
  isEnabled,
  isListening,
  isWakeWordDetected,
  onToggle,
  language,
}: ContinuousListeningButtonProps) => {
  const getStatusText = () => {
    if (!isEnabled) {
      return language === "hi" ? "निरंतर सुनना बंद" : "Continuous Listening Off";
    }
    if (isWakeWordDetected) {
      return language === "hi" ? "🎯 सक्रिय - बोलें!" : "🎯 Active - Speak!";
    }
    if (isListening) {
      return language === "hi" ? "'OmniGent' बोलें" : "Say 'OmniGent'";
    }
    return language === "hi" ? "प्रारंभ हो रहा..." : "Initializing...";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {/* Pulsing ring when wake word detected */}
            {isWakeWordDetected && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              </>
            )}
            
            {/* Always-on indicator ring */}
            {isEnabled && !isWakeWordDetected && isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
            )}
            
            <Button
              onClick={onToggle}
              variant={isEnabled ? "default" : "outline"}
              className={cn(
                "relative z-10 h-10 w-10 rounded-full transition-all duration-300",
                isWakeWordDetected && "bg-primary glow-pulse scale-110",
                isEnabled && !isWakeWordDetected && "bg-primary/70",
                !isEnabled && "hover:bg-primary/10"
              )}
            >
              {isWakeWordDetected ? (
                <Volume2 className="w-5 h-5 animate-pulse" />
              ) : isEnabled ? (
                <Radio className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            {/* Visual sound wave indicator */}
            {isWakeWordDetected && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-0.5 items-end h-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-primary rounded-full voice-wave"
                    style={{
                      height: "100%",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-center">
            <p className="font-medium">{getStatusText()}</p>
            {isEnabled && !isWakeWordDetected && (
              <p className="text-xs text-muted-foreground mt-1">
                {language === "hi" 
                  ? "कम संसाधन उपयोग के साथ हमेशा सुनता है"
                  : "Always-on with low resource usage"}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
