import { useState, useEffect, useCallback, useRef } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ControlBar, AgentRole } from "@/components/chat/ControlBar";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
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
  if (/schedule|appointment|book|meeting|calendar|remind/.test(lower)) return "Appointment / Scheduling";
  if (/create|execute|run|do |make|generate|send|update|build|set up/.test(lower)) return "Task Execution";
  if (/help|support|issue|problem|trouble|fix|error/.test(lower)) return "Support / Help";
  if (/find|search|look up|get me|show me|list|tell me about/.test(lower)) return "Information Request";
  if (/what|how|why|when|where|who|can you|\?/.test(lower)) return "General Question";
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
  
  const { isListening, transcript, toggleListening, resetTranscript, setLanguage, currentLanguage } = useSpeechRecognition();
  const { speak, stop, isSpeaking, setPreferredLanguage } = useTextToSpeech();
  const continuousListening = useContinuousListening();

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
    extras?: Partial<Message>
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
          { id: activityId, agent: activity.agent as AgentActivity["agent"], action: activity.action, status: "running" as const, timestamp: Date.now() }
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
    toast({ title: "Session cleared" });
  }, [stop]);

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
        { agentRole, isSimulation, explainDecision: explainMode }
      );

      if (response.agentActivities) {
        simulateAgentActivity(response.agentActivities);
        const agents = response.agentActivities.map(a => a.agent as AgentDefinition["id"]);
        setActiveAgents([...new Set(agents)]);
        
        const msgs: AgentMessage[] = [];
        response.agentActivities.forEach((activity, index) => {
          if (index > 0) {
            const prevAgent = response.agentActivities[index - 1].agent;
            msgs.push({
              id: `${Date.now()}_${index}`,
              from: prevAgent as AgentDefinition["id"],
              to: activity.agent as AgentDefinition["id"],
              type: "request",
              content: activity.action,
              timestamp: Date.now(),
            });
          }
        });
        setAgentMessages(msgs);
      }

      if (response.isGoal && response.goalSteps?.length) {
        setCurrentGoal({
          goal: content,
          steps: response.goalSteps,
          currentStep: 0,
          executedActions: response.executedActions,
          isAutonomous: response.isAutonomous,
        });
      }

      if (response.error) {
        const messageId = addMessage("assistant", response.error, { intent: "Support / Help", confidence: "low" });
        if (isVoiceMode) { setSpeakingMessageId(messageId); speak(response.error); }
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
        if (isVoiceMode) { setSpeakingMessageId(messageId); speak(response.content); }
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = "Something went wrong. Please try again.";
      const messageId = addMessage("assistant", errorMsg, { intent: "Support / Help", confidence: "low", showEscalation: true });
      if (isVoiceMode) { setSpeakingMessageId(messageId); speak(errorMsg); }
    }

    setIsTyping(false);
    setIsVoiceMode(false);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      toggleListening();
      toast({ title: "Processing..." });
    } else {
      stop();
      setSpeakingMessageId(null);
      toggleListening();
      toast({ title: "🎤 Listening" });
    }
  };

  const handleLanguageChange = (lang: "en-US" | "hi-IN" | "auto") => {
    setLanguage(lang);
    setPreferredLanguage(lang === "hi-IN" ? "hi" : lang === "en-US" ? "en" : "auto");
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
      />
      
      {/* Multi-Agent Panel */}
      {activeAgents.length > 0 && (
        <div className="px-4 max-w-3xl mx-auto w-full">
          <MultiAgentPanel
            activeAgents={activeAgents}
            messages={agentMessages}
            isProcessing={isTyping}
            language={currentLanguage === "hi-IN" ? "hi" : "en"}
          />
        </div>
      )}
      
      {/* Main Content */}
      <ChatContainer
        messages={messages} 
        isTyping={isTyping}
        agentActivities={agentActivities}
        onSpeak={handleSpeak}
        speakingMessageId={speakingMessageId}
        currentGoal={currentGoal}
        onSelectDemo={handleSendMessage}
      />
      
      {/* Input Area */}
      <div className="border-t border-border/30 p-4 bg-background">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Vision Agent */}
          {showVisionAgent && (
            <VisionAgent 
              language={currentLanguage === "hi-IN" ? "hi" : "en"}
              onActionSuggested={(action) => console.log("Vision:", action)}
            />
          )}
          
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
              className={`text-[10px] h-7 rounded-full gap-1.5 ${
                showVisionAgent ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              {showVisionAgent ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              Vision
            </Button>
          </div>
        </div>
      </div>
      
      <AnalyticsDashboard isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </div>
  );
};

export default Index;