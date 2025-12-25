import { useState, useEffect, useCallback, useRef } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ControlBar } from "@/components/chat/ControlBar";
import { AgentRole } from "@/components/chat/RoleSelector";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
import { DemoScenarios } from "@/components/chat/DemoScenarios";
import { VisionAgent } from "@/components/chat/VisionAgent";
import { MultiAgentPanel, AgentMessage, AgentDefinition } from "@/components/chat/MultiAgentPanel";
import { AgentActivity } from "@/components/chat/AgentActivityLog";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useContinuousListening } from "@/hooks/useContinuousListening";
import { toast } from "@/hooks/use-toast";
import { sendChatMessage, clearSession } from "@/services/chatService";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [activeAgents, setActiveAgents] = useState<AgentDefinition["id"][]>([]);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const conversationHistory = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  
  const { isListening, transcript, toggleListening, resetTranscript, setLanguage, currentLanguage, detectedLanguage } = useSpeechRecognition();
  const { speak, stop, isSpeaking, setPreferredLanguage } = useTextToSpeech();
  const continuousListening = useContinuousListening();

  // Handle continuous listening wake word detection
  useEffect(() => {
    if (continuousListening.isWakeWordDetected && continuousListening.transcript) {
      const trimmedTranscript = continuousListening.transcript.trim();
      if (trimmedTranscript.length > 3 && !isTyping) {
        continuousListening.pauseListening();
        setIsVoiceMode(true);
        handleSendMessage(trimmedTranscript);
        continuousListening.resetTranscript();
      }
    }
  }, [continuousListening.isWakeWordDetected, continuousListening.transcript, isTyping]);

  // Resume continuous listening after response
  useEffect(() => {
    if (!isTyping && !isSpeaking && continuousListening.isEnabled) {
      continuousListening.resumeListening();
    }
  }, [isTyping, isSpeaking, continuousListening.isEnabled]);

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
    
    toast({ 
      title: isSimulation ? "Sandbox cleared" : "Session cleared", 
      description: isSimulation ? "Test session reset" : "Starting fresh" 
    });
  }, [stop, isSimulation]);

  const handleSendMessage = async (content: string) => {
    const intent = classifyIntent(content);
    addMessage("user", content);
    setIsTyping(true);
    setAgentActivities([]);
    setActiveAgents([]);
    setAgentMessages([]);

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

      if (response.agentActivities) {
        simulateAgentActivity(response.agentActivities);
        const agents = response.agentActivities.map(a => a.agent as AgentDefinition["id"]);
        setActiveAgents([...new Set(agents)]);
        
        const messages: AgentMessage[] = [];
        response.agentActivities.forEach((activity, index) => {
          if (index > 0) {
            const prevAgent = response.agentActivities[index - 1].agent;
            messages.push({
              id: `${Date.now()}_${index}`,
              from: prevAgent as AgentDefinition["id"],
              to: activity.agent as AgentDefinition["id"],
              type: "request",
              content: activity.action,
              timestamp: Date.now(),
            });
          }
        });
        setAgentMessages(messages);
      }

      if (response.isGoal && response.goalSteps && response.goalSteps.length > 0) {
        setCurrentGoal({
          goal: content,
          steps: response.goalSteps,
          currentStep: 0,
          executedActions: response.executedActions,
          isAutonomous: response.isAutonomous,
        });
      }

      if (response.retryCount && response.retryCount > 0) {
        toast({
          title: "Recovery successful",
          description: `Recovered after ${response.retryCount} retry`,
        });
      }

      if (response.isSimulation) {
        toast({
          title: "Sandbox Mode",
          description: "This interaction was not saved",
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
      const errorMsg = "Something unexpected happened. Please try again.";
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
      toast({ 
        title: currentLanguage === "hi-IN" ? "प्रोसेसिंग..." : "Processing...", 
        description: currentLanguage === "hi-IN" ? "जवाब आ रहा है" : "Responding shortly" 
      });
    } else {
      stop();
      setSpeakingMessageId(null);
      toggleListening();
      toast({ 
        title: "🎤 Listening", 
        description: currentLanguage === "auto" ? "Speak naturally" : undefined
      });
    }
  };

  const handleLanguageChange = (lang: "en-US" | "hi-IN" | "auto") => {
    setLanguage(lang);
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
      {/* Header */}
      <ChatHeader 
        onClearSession={handleClearSession} 
        onOpenAnalytics={() => setShowAnalytics(true)}
        explainMode={explainMode}
        onExplainModeToggle={() => setExplainMode(!explainMode)}
      />
      
      {/* Control Bar */}
      <ControlBar
        agentRole={agentRole}
        onRoleChange={setAgentRole}
        isSimulation={isSimulation}
        onSimulationToggle={() => setIsSimulation(!isSimulation)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        isListening={isListening}
        continuousListening={continuousListening}
        detectedLanguage={detectedLanguage}
        isVoiceMode={isVoiceMode}
      />
      
      {/* Multi-Agent Panel */}
      {activeAgents.length > 0 && (
        <div className="px-4 max-w-5xl mx-auto w-full">
          <MultiAgentPanel
            activeAgents={activeAgents}
            messages={agentMessages}
            isProcessing={isTyping}
            language={currentLanguage === "hi-IN" ? "hi" : "en"}
          />
        </div>
      )}
      
      {/* Main Chat Area */}
      <ChatContainer
        messages={messages} 
        isTyping={isTyping}
        agentActivities={agentActivities}
        onSpeak={handleSpeak}
        speakingMessageId={speakingMessageId}
        currentGoal={currentGoal}
      />
      
      {/* Input Section */}
      <div className="border-t border-border/30 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Vision Agent */}
          {showVisionAgent && (
            <VisionAgent 
              language={currentLanguage === "hi-IN" ? "hi" : "en"}
              onActionSuggested={(action) => console.log("Vision action:", action)}
            />
          )}
          
          {/* Demo Scenarios */}
          {messages.length === 0 && !showVisionAgent && (
            <DemoScenarios onSelectDemo={handleSendMessage} disabled={isTyping} />
          )}
          
          {/* Chat Input */}
          <ChatInput
            onSend={handleSendMessage}
            isListening={isListening}
            onVoiceToggle={handleVoiceToggle}
            disabled={isTyping}
          />
          
          {/* Vision Toggle */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVisionAgent(!showVisionAgent)}
              className={`text-xs rounded-full gap-2 ${
                showVisionAgent 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {showVisionAgent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showVisionAgent ? "Hide Vision" : "Vision Agent"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Analytics Modal */}
      <AnalyticsDashboard 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />
    </div>
  );
};

export default Index;