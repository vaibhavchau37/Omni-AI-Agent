import { useState, useEffect, useCallback, useRef } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { RoleSelector, AgentRole } from "@/components/chat/RoleSelector";
import { GoalTracker } from "@/components/chat/GoalTracker";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
import { DemoScenarios } from "@/components/chat/DemoScenarios";
import { VoiceLanguageSelector } from "@/components/chat/VoiceLanguageSelector";
import { VisionAgent } from "@/components/chat/VisionAgent";
import { AgentActivity } from "@/components/chat/AgentActivityLog";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "@/hooks/use-toast";
import { sendChatMessage, clearSession } from "@/services/chatService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  showEscalation?: boolean;
  selectedTool?: string;
  toolReason?: string;
  reasoning?: string;
  retryCount?: number;
}

type IntentType = 
  | "General Question"
  | "Information Request"
  | "Task Execution"
  | "Appointment / Scheduling"
  | "Support / Help"
  | "Unknown Intent";

const classifyIntent = (message: string): IntentType => {
  const lower = message.toLowerCase();
  
  if (/schedule|appointment|book|meeting|calendar|remind/.test(lower)) {
    return "Appointment / Scheduling";
  }
  if (/create|execute|run|do |make|generate|send|update|build|set up/.test(lower)) {
    return "Task Execution";
  }
  if (/help|support|issue|problem|trouble|fix|error/.test(lower)) {
    return "Support / Help";
  }
  if (/find|search|look up|get me|show me|list|tell me about/.test(lower)) {
    return "Information Request";
  }
  if (/what|how|why|when|where|who|can you|\?/.test(lower)) {
    return "General Question";
  }
  return "Unknown Intent";
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [agentRole, setAgentRole] = useState<AgentRole>("default");
  const [isSimulation, setIsSimulation] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showVisionAgent, setShowVisionAgent] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<{ goal: string; steps: string[]; currentStep: number; executedActions?: Array<{step: number, action: string, status: string, result: string}>; isAutonomous?: boolean } | null>(null);
  const [explainMode, setExplainMode] = useState(false);
  const conversationHistory = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  
  const { isListening, transcript, toggleListening, resetTranscript, setLanguage, currentLanguage, detectedLanguage } = useSpeechRecognition();
  const { speak, stop, isSpeaking, setPreferredLanguage } = useTextToSpeech();

  useEffect(() => {
    if (!isListening && transcript) {
      setIsVoiceMode(true);
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  useEffect(() => {
    if (!isSpeaking) setSpeakingMessageId(null);
  }, [isSpeaking]);

  const addMessage = useCallback((
    role: "user" | "assistant", 
    content: string, 
    extras?: {
      intent?: string;
      confidence?: "high" | "medium" | "low";
      emotion?: "positive" | "neutral" | "negative" | "frustrated";
      showEscalation?: boolean;
      selectedTool?: string;
      toolReason?: string;
      reasoning?: string;
      retryCount?: number;
    }
  ): string => {
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, role, content, ...extras }]);
    conversationHistory.current.push({ role, content });
    return id;
  }, []);

  const simulateAgentActivity = useCallback((activities: Array<{agent: string, action: string}>) => {
    setAgentActivities([]);
    
    activities.forEach((activity, index) => {
      setTimeout(() => {
        const activityId = `${Date.now()}_${index}`;
        setAgentActivities(prev => [
          ...prev.map(a => ({ ...a, status: "complete" as const })),
          { 
            id: activityId, 
            agent: activity.agent as AgentActivity["agent"], 
            action: activity.action, 
            status: "running" as const,
            timestamp: Date.now()
          }
        ]);
      }, index * 800);
    });

    setTimeout(() => {
      setAgentActivities(prev => prev.map(a => ({ ...a, status: "complete" as const })));
    }, activities.length * 800 + 500);
  }, []);

  const handleSpeak = useCallback((content: string) => {
    const message = messages.find(m => m.content === content);
    if (message) {
      if (speakingMessageId === message.id) {
        stop();
        setSpeakingMessageId(null);
      } else {
        stop();
        setSpeakingMessageId(message.id);
        speak(content);
      }
    }
  }, [messages, speakingMessageId, speak, stop]);

  const handleClearSession = useCallback(() => {
    setMessages([]);
    conversationHistory.current = [];
    setAgentActivities([]);
    setCurrentGoal(null);
    clearSession();
    stop();
    setSpeakingMessageId(null);
    
    if (isSimulation) {
      toast({ title: "Sandbox cleared", description: "Test session reset (no data saved)" });
    } else {
      toast({ title: "Session cleared", description: "Starting fresh conversation" });
    }
  }, [stop, isSimulation]);

  const handleSendMessage = async (content: string) => {
    const intent = classifyIntent(content);
    addMessage("user", content);
    setIsTyping(true);
    setAgentActivities([]);

    try {
      const response = await sendChatMessage(
        [...conversationHistory.current],
        isVoiceMode,
        intent,
        {
          agentRole,
          isSimulation,
          explainDecision: explainMode,
        }
      );

      // Simulate agent activities if returned
      if (response.agentActivities) {
        simulateAgentActivity(response.agentActivities);
      }

      // Handle goal tracking with autonomous execution
      if (response.isGoal && response.goalSteps && response.goalSteps.length > 0) {
        setCurrentGoal({
          goal: content,
          steps: response.goalSteps,
          currentStep: 0,
          executedActions: response.executedActions,
          isAutonomous: response.isAutonomous,
        });
      }

      // Show retry notification if retries occurred
      if (response.retryCount && response.retryCount > 0) {
        toast({
          title: "Retry Recovery",
          description: `Successfully recovered after ${response.retryCount} retry attempt(s)`,
        });
      }

      // Simulation mode indicator
      if (response.isSimulation) {
        toast({
          title: "🧪 Sandbox Mode",
          description: "This interaction was not saved",
          variant: "default",
        });
      }

      if (response.error) {
        const messageId = addMessage("assistant", response.error, { 
          intent: "Support / Help",
          confidence: "low"
        });
        
        if (response.errorType === "rate_limit") {
          toast({
            title: "Please wait",
            description: "Too many requests. Try again shortly.",
            variant: "destructive",
          });
        }
        
        if (isVoiceMode) {
          setSpeakingMessageId(messageId);
          speak(response.error);
        }
      } else if (response.content) {
        const messageId = addMessage("assistant", response.content, {
          intent: response.intent || intent,
          confidence: response.confidence,
          emotion: response.emotion,
          showEscalation: response.shouldEscalate,
          selectedTool: response.selectedTool,
          toolReason: response.toolReason,
          reasoning: response.reasoning,
          retryCount: response.retryCount,
        });
        
        if (isVoiceMode) {
          setSpeakingMessageId(messageId);
          speak(response.content);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      const errorMsg = "I apologize, but something unexpected happened. Please try again.";
      const messageId = addMessage("assistant", errorMsg, { 
        intent: "Support / Help",
        confidence: "low",
        showEscalation: true
      });
      
      if (isVoiceMode) {
        setSpeakingMessageId(messageId);
        speak(errorMsg);
      }
    }

    setIsTyping(false);
    setIsVoiceMode(false);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      toggleListening();
      const isHindi = currentLanguage === "hi-IN" || detectedLanguage === "hi";
      toast({ 
        title: isHindi ? "आपकी आवाज़ प्रोसेस हो रही है" : "Processing your voice", 
        description: isHindi ? "जल्द ही जवाब आएगा..." : "Responding shortly..." 
      });
    } else {
      stop();
      setSpeakingMessageId(null);
      toggleListening();
      const isHindi = currentLanguage === "hi-IN";
      toast({ 
        title: isHindi ? "🎤 सुन रहा हूं..." : "🎤 Listening...", 
        description: currentLanguage === "auto" 
          ? "हिंदी या English में बोलें / Speak naturally" 
          : isHindi 
            ? "हिंदी में बोलें" 
            : "Speak naturally." 
      });
    }
  };

  const handleLanguageChange = (lang: "en-US" | "hi-IN" | "auto") => {
    setLanguage(lang);
    // Also update TTS language preference
    if (lang === "hi-IN") {
      setPreferredLanguage("hi");
    } else if (lang === "en-US") {
      setPreferredLanguage("en");
    } else {
      setPreferredLanguage("auto");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader 
        onClearSession={handleClearSession} 
        onOpenAnalytics={() => setShowAnalytics(true)}
        explainMode={explainMode}
        onExplainModeToggle={() => setExplainMode(!explainMode)}
      />
      
      {/* Role Selector Bar */}
      <div className="border-b border-border/50 px-4 py-2 bg-secondary/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RoleSelector 
              currentRole={agentRole}
              onRoleChange={setAgentRole}
              isSimulation={isSimulation}
              onSimulationToggle={() => setIsSimulation(!isSimulation)}
            />
            
            <VoiceLanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              isListening={isListening}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {detectedLanguage && isVoiceMode && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
                {detectedLanguage === "hi" ? "🇮🇳 हिंदी" : "🇺🇸 English"} detected
              </span>
            )}
            
            {isSimulation && (
              <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-md">
                Sandbox Mode
              </span>
            )}
          </div>
        </div>
      </div>
      
      <ChatContainer 
        messages={messages} 
        isTyping={isTyping}
        agentActivities={agentActivities}
        onSpeak={handleSpeak}
        speakingMessageId={speakingMessageId}
        currentGoal={currentGoal}
      />
      
      <div className="border-t border-border/50 p-4 pb-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Vision Agent Panel */}
          {showVisionAgent && (
            <VisionAgent 
              language={currentLanguage === "hi-IN" ? "hi" : "en"}
              onActionSuggested={(action) => {
                console.log("Vision action suggested:", action);
              }}
            />
          )}
          
          {/* Demo Scenarios - Show only when no messages */}
          {messages.length === 0 && !showVisionAgent && (
            <DemoScenarios 
              onSelectDemo={handleSendMessage} 
              disabled={isTyping} 
            />
          )}
          
          <div className="flex gap-2">
            <ChatInput
              onSend={handleSendMessage}
              isListening={isListening}
              onVoiceToggle={handleVoiceToggle}
              disabled={isTyping}
            />
          </div>
          
          {/* Vision Agent Toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowVisionAgent(!showVisionAgent)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                showVisionAgent 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              👁️ {showVisionAgent 
                ? (currentLanguage === "hi-IN" ? "विज़न एजेंट छुपाएं" : "Hide Vision Agent")
                : (currentLanguage === "hi-IN" ? "विज़न एजेंट दिखाएं" : "Show Vision Agent")}
            </button>
          </div>
        </div>
      </div>
      
      <AnalyticsDashboard 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />
    </div>
  );
};

export default Index;