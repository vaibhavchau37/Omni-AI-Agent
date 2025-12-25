import { useState, useEffect } from "react";
import { Brain, Lightbulb, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface BehaviorPattern {
  id: string;
  pattern_key: string;
  pattern_value: string;
  pattern_type: string;
  occurrence_count: number;
  confidence_score: number;
  user_approved: boolean;
  is_automated: boolean;
}

interface BehaviorSuggestionsProps {
  sessionId: string;
  onAcceptSuggestion: (suggestion: string) => void;
  language: "en" | "hi";
}

export const BehaviorSuggestions = ({
  sessionId,
  onAcceptSuggestion,
  language,
}: BehaviorSuggestionsProps) => {
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPatterns();
  }, [sessionId]);

  const fetchPatterns = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("behavior_patterns")
      .select("*")
      .eq("session_id", sessionId)
      .gte("occurrence_count", 2)
      .order("occurrence_count", { ascending: false })
      .limit(3);

    if (data) {
      setPatterns(data as BehaviorPattern[]);
    }
    setIsLoading(false);
  };

  const handleApprove = async (pattern: BehaviorPattern) => {
    await supabase
      .from("behavior_patterns")
      .update({ user_approved: true })
      .eq("id", pattern.id);

    onAcceptSuggestion(pattern.pattern_value);
    fetchPatterns();
  };

  const handleDismiss = async (pattern: BehaviorPattern) => {
    await supabase
      .from("behavior_patterns")
      .update({ occurrence_count: 0 })
      .eq("id", pattern.id);

    fetchPatterns();
  };

  const handleAutomate = async (pattern: BehaviorPattern) => {
    await supabase
      .from("behavior_patterns")
      .update({ is_automated: true, user_approved: true })
      .eq("id", pattern.id);

    fetchPatterns();
  };

  if (patterns.length === 0 || isLoading) return null;

  const texts = {
    en: {
      title: "Behavior Learned",
      subtitle: "I noticed you do this often",
      automate: "Automate",
      doNow: "Do Now",
      dismiss: "Dismiss",
    },
    hi: {
      title: "व्यवहार सीखा",
      subtitle: "मैंने देखा कि आप यह अक्सर करते हैं",
      automate: "स्वचालित करें",
      doNow: "अभी करें",
      dismiss: "हटाएं",
    },
  };

  const t = texts[language];

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Brain className="w-4 h-4 text-primary" />
        <span>{t.title}</span>
      </div>
      
      {patterns.map((pattern) => (
        <Card
          key={pattern.id}
          className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{t.subtitle}</span>
                <Badge variant="secondary" className="text-xs">
                  {pattern.occurrence_count}x
                </Badge>
              </div>
              <p className="text-sm text-foreground">{pattern.pattern_value}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  Confidence: {Math.round(Number(pattern.confidence_score) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAutomate(pattern)}
                className="h-7 px-2"
                title={t.automate}
              >
                <Sparkles className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleApprove(pattern)}
                className="h-7 px-2 text-green-600 hover:text-green-700"
                title={t.doNow}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(pattern)}
                className="h-7 px-2 text-destructive hover:text-destructive"
                title={t.dismiss}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
