import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConfidenceIndicatorProps {
  confidence: "high" | "medium" | "low";
  score?: number;
  showLabel?: boolean;
  language: "en" | "hi";
}

export const ConfidenceIndicator = ({
  confidence,
  score,
  showLabel = true,
  language,
}: ConfidenceIndicatorProps) => {
  const texts = {
    en: {
      high: "High Confidence",
      medium: "Medium Confidence",
      low: "Low Confidence",
      highDesc: "I'm confident in this response",
      mediumDesc: "This response may need verification",
      lowDesc: "Please verify this information",
    },
    hi: {
      high: "उच्च विश्वास",
      medium: "मध्यम विश्वास",
      low: "कम विश्वास",
      highDesc: "मुझे इस उत्तर पर विश्वास है",
      mediumDesc: "इस उत्तर को सत्यापन की आवश्यकता हो सकती है",
      lowDesc: "कृपया इस जानकारी को सत्यापित करें",
    },
  };

  const t = texts[language];

  const config = {
    high: {
      icon: ShieldCheck,
      label: t.high,
      description: t.highDesc,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    medium: {
      icon: Shield,
      label: t.medium,
      description: t.mediumDesc,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    low: {
      icon: ShieldAlert,
      label: t.low,
      description: t.lowDesc,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
  };

  const { icon: Icon, label, description, color, bgColor, borderColor } = config[confidence];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border",
              bgColor,
              borderColor,
              color
            )}
          >
            <Icon className="w-3 h-3" />
            {showLabel && <span>{label}</span>}
            {score !== undefined && (
              <span className="font-mono">{Math.round(score * 100)}%</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface TrustScoreDisplayProps {
  confidence: "high" | "medium" | "low";
  shouldEscalate?: boolean;
  reasoning?: string;
  language: "en" | "hi";
}

export const TrustScoreDisplay = ({
  confidence,
  shouldEscalate,
  reasoning,
  language,
}: TrustScoreDisplayProps) => {
  const texts = {
    en: {
      escalate: "Human assistance recommended",
      reasoning: "Why this confidence:",
    },
    hi: {
      escalate: "मानव सहायता की सिफारिश",
      reasoning: "यह विश्वास क्यों:",
    },
  };

  const t = texts[language];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <ConfidenceIndicator
          confidence={confidence}
          language={language}
          showLabel
        />
        {shouldEscalate && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            <span>{t.escalate}</span>
          </div>
        )}
      </div>
      {reasoning && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">{t.reasoning}</span> {reasoning}
        </p>
      )}
    </div>
  );
};
