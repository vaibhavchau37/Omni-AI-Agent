import { useState, useEffect, useCallback, useRef } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ControlBar, AgentRole } from "@/components/chat/ControlBar";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
import { VisionAgent } from "@/components/chat/VisionAgent";
import { MultiAgentPanel, AgentMessage, AgentDefinition } from "@/components/chat/MultiAgentPanel";
import { AgentActivity } from "@/components/chat/AgentActivityLog";
import { BehaviorSuggestions } from "@/components/chat/BehaviorSuggestions";
import { TaskReplayPanel } from "@/components/chat/TaskReplayPanel";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useContinuousListening } from "@/hooks/useContinuousListening";
import { toast } from "@/hooks/use-toast";
import { sendChatMessageStreaming, clearSession, getCurrentSessionId } from "@/services/chatService";
import { Eye, EyeOff, Brain, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  confidenceScore?: number;
  needsUserConfirmation?: boolean;
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  showEscalation?: boolean;
  selectedTool?: string;
  toolReason?: string;
  reasoning?: string;
  retryCount?: number;
  timestamp: number;
  isStreaming?: boolean;
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
  const [showBehaviorPanel, setShowBehaviorPanel] = useState(false);
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
    extras?: Partial<Omit<Message, 'id' | 'role' | 'content' | 'timestamp'>>
  ): string => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    setMessages(prev => [...prev, { id, role, content, timestamp, ...extras }]);
    conversationHistory.current.push({ role, content });
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
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

    // Create assistant message placeholder for streaming
    const assistantId = Date.now().toString();
    const assistantTimestamp = Date.now();
    setMessages(prev => [...prev, { 
      id: assistantId, 
      role: "assistant" as const, 
      content: "", 
      timestamp: assistantTimestamp,
      isStreaming: true 
    }]);

    let streamedContent = "";

    await sendChatMessageStreaming(
      [...conversationHistory.current],
      {
        onToken: (token) => {
          streamedContent += token;
          updateMessage(assistantId, { content: streamedContent });
        },
        onComplete: (response) => {
          // Update conversation history
          conversationHistory.current.push({ role: "assistant", content: streamedContent });
          
          // Update message with final metadata
          updateMessage(assistantId, {
            content: streamedContent || response.content || "",
            isStreaming: false,
            intent: response.intent || intent,
            confidence: response.confidence,
            emotion: response.emotion,
            showEscalation: response.shouldEscalate,
            selectedTool: response.selectedTool,
            toolReason: response.toolReason,
            reasoning: response.reasoning,
            retryCount: response.retryCount,
          });

          // Handle agent activities
          if (response.agentActivities) {
            simulateAgentActivity(response.agentActivities);
            const agents = response.agentActivities.map(a => a.agent as AgentDefinition["id"]);
            setActiveAgents([...new Set(agents)] as AgentDefinition["id"][]);
            
            const msgs: AgentMessage[] = [];
            response.agentActivities.forEach((activity, index) => {
              if (index > 0 && response.agentActivities) {
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

          // Handle goals
          if (response.isGoal && response.goalSteps?.length) {
            setCurrentGoal({
              goal: content,
              steps: response.goalSteps,
              currentStep: 0,
              executedActions: response.executedActions,
              isAutonomous: response.isAutonomous,
            });
          }

          // Voice mode
          if (isVoiceMode && streamedContent) {
            setSpeakingMessageId(assistantId);
            speak(streamedContent);
          }

          setIsTyping(false);
          setIsVoiceMode(false);
        },
        onError: (error) => {
          updateMessage(assistantId, {
            content: error,
            isStreaming: false,
            intent: "Support / Help",
            confidence: "low",
            showEscalation: true,
          });
          conversationHistory.current.push({ role: "assistant", content: error });
          
          if (isVoiceMode) {
            setSpeakingMessageId(assistantId);
            speak(error);
          }
          
          setIsTyping(false);
          setIsVoiceMode(false);
        },
      },
      isVoiceMode,
      intent,
      { agentRole, isSimulation, explainDecision: explainMode }
    );
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
        onOpenAnalytics={() => setShowAnalytics(true)}
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
          
          {/* Vision Toggle and Behavior Panel */}
          <div className="flex justify-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBehaviorPanel(!showBehaviorPanel)}
              className={`text-[10px] h-7 rounded-full gap-1.5 ${
                showBehaviorPanel ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <Brain className="w-3 h-3" />
              Learning
            </Button>
          </div>
          
          {/* Behavior Learning Panel */}
          {showBehaviorPanel && (
            <div className="mt-2">
              <Tabs defaultValue="behavior" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="behavior" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" /> Behavior
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">
                    <History className="w-3 h-3 mr-1" /> Tasks
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="behavior" className="mt-2">
                  <BehaviorSuggestions
                    sessionId={getCurrentSessionId() || ""}
                    onAcceptSuggestion={handleSendMessage}
                    language={currentLanguage === "hi-IN" ? "hi" : "en"}
                  />
                </TabsContent>
                <TabsContent value="tasks" className="mt-2">
                  <TaskReplayPanel
                    sessionId={getCurrentSessionId() || ""}
                    onReplayTask={(task) => {
                      toast({ title: "Replaying task", description: task.task_name });
                      handleSendMessage(`Replay: ${task.task_name}`);
                    }}
                    language={currentLanguage === "hi-IN" ? "hi" : "en"}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
      
      <AnalyticsDashboard isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </div>
  );
};

export default Index;