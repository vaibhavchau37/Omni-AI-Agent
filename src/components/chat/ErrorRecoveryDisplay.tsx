import { useState } from "react";
import { AlertCircle, RefreshCw, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ErrorRecoveryDisplayProps {
  originalTask: string;
  errorReason: string;
  alternativeStrategy?: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onCancel: () => void;
  onAcceptAlternative?: () => void;
  status: "analyzing" | "retrying" | "recovered" | "failed";
  language: "en" | "hi";
}

export const ErrorRecoveryDisplay = ({
  originalTask,
  errorReason,
  alternativeStrategy,
  retryCount,
  maxRetries,
  onRetry,
  onCancel,
  onAcceptAlternative,
  status,
  language,
}: ErrorRecoveryDisplayProps) => {
  const texts = {
    en: {
      analyzing: "Analyzing failure...",
      retrying: "Retrying with alternative approach...",
      recovered: "Successfully recovered!",
      failed: "Unable to complete task",
      originalTask: "Original task",
      errorReason: "Error reason",
      alternative: "Alternative strategy",
      retry: "Retry",
      cancel: "Cancel",
      tryAlternative: "Try Alternative",
      attempts: "Attempts",
    },
    hi: {
      analyzing: "विफलता का विश्लेषण...",
      retrying: "वैकल्पिक दृष्टिकोण के साथ पुनः प्रयास...",
      recovered: "सफलतापूर्वक पुनर्प्राप्त!",
      failed: "कार्य पूरा करने में असमर्थ",
      originalTask: "मूल कार्य",
      errorReason: "त्रुटि कारण",
      alternative: "वैकल्पिक रणनीति",
      retry: "पुनः प्रयास करें",
      cancel: "रद्द करें",
      tryAlternative: "वैकल्पिक प्रयास करें",
      attempts: "प्रयास",
    },
  };

  const t = texts[language];

  const statusConfig = {
    analyzing: {
      icon: RefreshCw,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      message: t.analyzing,
      animate: true,
    },
    retrying: {
      icon: RefreshCw,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      message: t.retrying,
      animate: true,
    },
    recovered: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      message: t.recovered,
      animate: false,
    },
    failed: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      message: t.failed,
      animate: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`p-4 ${config.bgColor} ${config.borderColor} border`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon
            className={`w-5 h-5 ${config.color} ${
              config.animate ? "animate-spin" : ""
            }`}
          />
          <span className={`font-medium ${config.color}`}>{config.message}</span>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t.originalTask}: </span>
            <span>{originalTask}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground">{t.errorReason}: </span>
            <span className="text-destructive">{errorReason}</span>
          </div>

          {alternativeStrategy && (
            <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-md">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <span className="text-muted-foreground">{t.alternative}: </span>
                <span>{alternativeStrategy}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t.attempts}: {retryCount}/{maxRetries}
          </span>
          <Progress value={(retryCount / maxRetries) * 100} className="flex-1 h-2" />
        </div>

        {status === "failed" && (
          <div className="flex gap-2">
            {alternativeStrategy && onAcceptAlternative && (
              <Button size="sm" onClick={onAcceptAlternative}>
                <Lightbulb className="w-4 h-4 mr-1" />
                {t.tryAlternative}
              </Button>
            )}
            {retryCount < maxRetries && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-1" />
                {t.retry}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onCancel}>
              {t.cancel}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
