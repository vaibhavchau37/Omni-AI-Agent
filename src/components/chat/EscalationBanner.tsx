import { UserRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EscalationBannerProps {
  onEscalate: () => void;
  reason?: string;
}

export const EscalationBanner = ({ onEscalate, reason }: EscalationBannerProps) => {
  return (
    <div className="mt-3 p-3 rounded-xl bg-warning/10 border border-warning/30 fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
          <UserRound className="w-4 h-4 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-warning">
            Would you like to speak with a human?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {reason || "I want to make sure you get the best possible help."}
          </p>
        </div>
        <Button
          size="sm"
          onClick={onEscalate}
          className="bg-warning hover:bg-warning/90 text-warning-foreground gap-1"
        >
          Connect
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
