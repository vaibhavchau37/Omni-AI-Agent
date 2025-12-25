import { useState, useRef, useCallback } from "react";
import { Camera, Eye, MousePointer, Type, ArrowUpDown, Loader2, Target, Brain, Monitor, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ActionResult {
  type: string;
  target: string;
  coordinates?: { x: number; y: number };
  value?: string;
  confidence: number;
  reasoning: string;
}

interface VisionAnalysis {
  ui_state?: {
    application: string;
    current_screen: string;
    elements_found?: string[];
  };
  analysis: string;
  suggested_action: ActionResult;
  alternative_actions?: ActionResult[];
  goal_progress?: string;
}

interface VisionAgentProps {
  onActionSuggested?: (action: ActionResult) => void;
  language?: "en" | "hi";
}

const ACTION_ICONS: Record<string, typeof MousePointer> = {
  click: MousePointer,
  type: Type,
  scroll: ArrowUpDown,
  wait: Loader2,
  navigate: Monitor,
  read: Eye,
};

export const VisionAgent = ({ onActionSuggested, language = "en" }: VisionAgentProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [actionHistory, setActionHistory] = useState<Array<{type: string, target: string, result: string}>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureScreen = useCallback(async () => {
    setIsCapturing(true);
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: "monitor",
        },
        audio: false
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture frame to canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setScreenshot(dataUrl);
        
        toast({
          title: language === "hi" ? "📸 स्क्रीन कैप्चर हुई" : "📸 Screen Captured",
          description: language === "hi" ? "अब विश्लेषण के लिए तैयार" : "Ready for analysis",
        });
      }

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error("Screen capture error:", error);
      toast({
        title: language === "hi" ? "कैप्चर विफल" : "Capture Failed",
        description: language === "hi" ? "स्क्रीन कैप्चर की अनुमति दें" : "Please allow screen capture permission",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [language]);

  const analyzeScreen = useCallback(async () => {
    if (!screenshot || !goal.trim()) {
      toast({
        title: language === "hi" ? "लक्ष्य दर्ज करें" : "Enter a Goal",
        description: language === "hi" ? "कृपया पहले स्क्रीन कैप्चर करें और लक्ष्य लिखें" : "Please capture screen and enter your goal first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("vision-agent", {
        body: { 
          screenshot, 
          goal,
          previousActions: actionHistory,
          language
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        
        if (data.analysis.suggested_action && onActionSuggested) {
          onActionSuggested(data.analysis.suggested_action);
        }

        toast({
          title: language === "hi" ? "🧠 विश्लेषण पूर्ण" : "🧠 Analysis Complete",
          description: language === "hi" 
            ? `सुझाई गई क्रिया: ${data.analysis.suggested_action?.type || "पढ़ें"}`
            : `Suggested action: ${data.analysis.suggested_action?.type || "read"}`,
        });
      }
    } catch (error) {
      console.error("Vision analysis error:", error);
      toast({
        title: language === "hi" ? "विश्लेषण विफल" : "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [screenshot, goal, actionHistory, language, onActionSuggested]);

  const executeAction = useCallback((action: ActionResult) => {
    // Simulate action execution
    const result = `Executed ${action.type} on "${action.target}"`;
    
    setActionHistory(prev => [...prev, {
      type: action.type,
      target: action.target,
      result: "success"
    }]);

    toast({
      title: language === "hi" ? "⚡ क्रिया निष्पादित" : "⚡ Action Executed",
      description: result,
    });

    // Clear analysis for next iteration
    setAnalysis(null);
  }, [language]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400 bg-green-500/10";
    if (confidence >= 0.5) return "text-yellow-400 bg-yellow-500/10";
    return "text-red-400 bg-red-500/10";
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="w-5 h-5 text-primary" />
          {language === "hi" ? "विज़न-आधारित डेस्कटॉप एजेंट" : "Vision-Based Desktop Agent"}
          <Badge variant="outline" className="ml-auto text-xs">
            {language === "hi" ? "AI विज़न" : "AI Vision"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Goal Input */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            {language === "hi" ? "लक्ष्य / Goal" : "Goal"}
          </label>
          <Input
            placeholder={language === "hi" 
              ? "उदाहरण: सेटिंग्स में जाकर डार्क मोड चालू करो" 
              : "e.g., Open settings and enable dark mode"}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {/* Capture Button */}
        <div className="flex gap-2">
          <Button
            onClick={captureScreen}
            disabled={isCapturing}
            variant="outline"
            className="flex-1"
          >
            {isCapturing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-2" />
            )}
            {language === "hi" ? "स्क्रीन कैप्चर करें" : "Capture Screen"}
          </Button>
          
          <Button
            onClick={analyzeScreen}
            disabled={!screenshot || !goal.trim() || isAnalyzing}
            className="flex-1"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            {language === "hi" ? "विश्लेषण करें" : "Analyze"}
          </Button>
        </div>

        {/* Screenshot Preview */}
        {screenshot && (
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <img 
              src={screenshot} 
              alt="Screen capture" 
              className="w-full h-40 object-cover object-top"
            />
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500/80 text-white text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {language === "hi" ? "कैप्चर किया" : "Captured"}
              </Badge>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            {/* UI State */}
            {analysis.ui_state && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Monitor className="w-4 h-4 text-primary" />
                  {analysis.ui_state.application}
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {analysis.ui_state.current_screen}
                </p>
              </div>
            )}

            {/* Suggested Action */}
            {analysis.suggested_action && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = ACTION_ICONS[analysis.suggested_action.type] || Target;
                      return <Icon className="w-4 h-4 text-primary" />;
                    })()}
                    <span className="font-medium text-sm">
                      {language === "hi" ? "सुझाई गई क्रिया" : "Suggested Action"}
                    </span>
                  </div>
                  <Badge className={cn("text-xs", getConfidenceColor(analysis.suggested_action.confidence))}>
                    {Math.round(analysis.suggested_action.confidence * 100)}% {language === "hi" ? "आत्मविश्वास" : "confidence"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="uppercase text-xs">
                      {analysis.suggested_action.type}
                    </Badge>
                    <span className="text-sm">{analysis.suggested_action.target}</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {analysis.suggested_action.reasoning}
                  </p>
                  
                  <Button
                    size="sm"
                    onClick={() => executeAction(analysis.suggested_action)}
                    className="w-full mt-2"
                  >
                    <MousePointer className="w-3 h-3 mr-2" />
                    {language === "hi" ? "क्रिया निष्पादित करें" : "Execute Action"}
                  </Button>
                </div>
              </div>
            )}

            {/* Alternative Actions */}
            {analysis.alternative_actions && analysis.alternative_actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {language === "hi" ? "वैकल्पिक क्रियाएं:" : "Alternative actions:"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.alternative_actions.map((alt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => executeAction(alt)}
                      className="text-xs"
                    >
                      {alt.type}: {alt.target.substring(0, 20)}...
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Goal Progress */}
            {analysis.goal_progress && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <Target className="w-3 h-3 mt-0.5 text-primary" />
                <span>{analysis.goal_progress}</span>
              </div>
            )}
          </div>
        )}

        {/* Action History */}
        {actionHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {language === "hi" ? "क्रिया इतिहास:" : "Action History:"}
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {actionHistory.map((action, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-secondary/50">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="uppercase font-medium">{action.type}</span>
                  <span className="text-muted-foreground truncate">{action.target}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-400">
            {language === "hi" 
              ? "विज़न-आधारित रीज़निंग एजेंट को UI को समझने और बुद्धिमान निर्णय लेने की अनुमति देता है।" 
              : "Vision-based reasoning enables the agent to understand UI context and make intelligent decisions."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
