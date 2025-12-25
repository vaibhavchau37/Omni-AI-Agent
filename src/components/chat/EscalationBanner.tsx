import { UserRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EscalationBannerProps {
  onEscalate: () => void;
  reason?: string;
}

export const EscalationBanner = ({ onEscalate, reason }: EscalationBannerProps) => {
  return (
    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <UserRound className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-400">
            Would you like to speak with a human?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {reason || "I want to make sure you get the best possible help."}
          </p>
        </div>
        <Button
          size="sm"
          onClick={onEscalate}
          className="bg-amber-500 hover:bg-amber-600 text-amber-950 gap-1"
        >
          Connect
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
